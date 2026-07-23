import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { generateSecret, generateSync, verifySync, generateURI } from "otplib";
import User from "../models/user";
import Session from "../models/session";
import SystemSettings from "../models/systemSettings";
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  hashToken,
  generateSecureToken,
  generateSessionCode,
  authenticate,
  type AuthRequest,
} from "../lib/auth";
import { logAudit } from "../models/auditLog";
import {
  sendVerificationEmail,
  sendLoginAlertEmail,
  sendPasswordResetEmail,
} from "../lib/email";
import { connectDb } from "../lib/db";
import { logger } from "../lib/logger";

const JWT_SECRET = process.env.JWT_SECRET || "thanarah-dev-secret-change-in-production";

/** Sign a short-lived (5 min) MFA session token */
function signMfaToken(userId: string): string {
  return jwt.sign({ userId, purpose: "mfa" }, JWT_SECRET, { expiresIn: "5m" });
}

/** Verify and decode an MFA session token — throws if invalid/expired */
function verifyMfaToken(token: string): { userId: string } {
  const payload = jwt.verify(token, JWT_SECRET) as { userId: string; purpose: string };
  if (payload.purpose !== "mfa") throw new Error("wrong purpose");
  return { userId: payload.userId };
}

const router = Router();

function getIp(req: Request): string {
  return (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
}

function getDeviceType(ua: string): string {
  if (/mobile|android|iphone|ipad/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}


// POST /api/auth/setup — one-time owner setup
router.post("/setup", async (req: Request, res: Response) => {
  await connectDb();
  const ownerExists = await User.findOne({ role: "owner" });
  if (ownerExists) {
    res.status(403).json({ error: "Setup already completed" });
    return;
  }

  const setupKey = process.env.OWNER_SETUP_KEY;
  if (!setupKey || req.body.setupKey !== setupKey) {
    res.status(403).json({ error: "Invalid setup key" });
    return;
  }

  const schema = z.object({
    setupKey: z.string(),
    fullName: z.string().min(2),
    email: z.string(),
    password: z.string().min(12),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { fullName, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({
    fullName,
    email,
    passwordHash,
    role: "owner",
    status: "active",
    emailVerified: true,
    permissions: ["*"],
    allowedSections: ["*"],
  });

  res.status(201).json({ success: true, message: "Owner account created" });
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  await connectDb();
  const ip = getIp(req);
  const ua = req.headers["user-agent"] || "";

  const schema = z.object({
    email: z.string(),
    password: z.string().min(1),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { email, password } = parsed.data;
  const user = await User.findOne({ email });

  if (!user || user.status === "disabled") {
    await logAudit({ actor: email, action: "login.failed", result: "failure", riskScore: "medium", ipAddress: ip, metadata: { reason: "user_not_found" }, timestamp: new Date() });
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  // Check lockout
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    res.status(429).json({ error: "Account temporarily locked. Try again later." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    await user.save();
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  if (user.mfaEnabled) {
    const mfaSessionToken = signMfaToken(user.id);
    res.status(200).json({
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, preferredLanguage: user.preferredLanguage, mfaEnabled: true },
      requiresMfa: true,
      mfaSessionToken,
    });
    return;
  }

  const sessionCode = generateSessionCode();
  const sessionToken = generateSecureToken();
  const refreshToken = generateSecureToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  const session = await Session.create({
    userId: user._id,
    sessionTokenHash: hashToken(sessionToken),
    refreshTokenHash: hashToken(refreshToken),
    sessionCode,
    ipAddress: ip,
    userAgent: ua,
    deviceType: getDeviceType(ua),
    expiresAt,
  });

  const accessToken = signAccessToken({ userId: user.id, sessionId: session.id, role: user.role });
  const refreshJwt = signRefreshToken({ userId: user.id, sessionId: session.id, role: user.role });

  await logAudit({ actor: user.fullName, actorId: user._id as unknown as import("mongoose").Types.ObjectId, action: "login.success", result: "success", riskScore: "low", ipAddress: ip, sessionId: session.id, timestamp: new Date() });

  // Fire-and-forget login alert
  sendLoginAlertEmail({ to: user.email, name: user.fullName, ipAddress: ip, device: getDeviceType(ua), time: new Date() }).catch(() => {});

  res.json({
    accessToken,
    refreshToken: refreshJwt,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      allowedSections: user.allowedSections,
      preferredLanguage: user.preferredLanguage,
      mfaEnabled: user.mfaEnabled,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      sessionExpiresAt: expiresAt.toISOString(),
    },
    requiresMfa: false,
    mfaSessionToken: null,
  });
});

// POST /api/auth/logout
router.post("/logout", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  await Session.findOneAndUpdate({ _id: req.sessionId }, { status: "revoked", revokedAt: new Date() });
  await logAudit({ actor: req.userId || "unknown", action: "logout", result: "success", riskScore: "low", ipAddress: getIp(req), sessionId: req.sessionId, timestamp: new Date() });
  res.json({ success: true, message: "Logged out" });
});

// POST /api/auth/refresh
router.post("/refresh", async (req: Request, res: Response) => {
  await connectDb();
  const refreshJwt = req.body?.refreshToken as string | undefined;
  if (!refreshJwt) {
    res.status(401).json({ error: "No refresh token" });
    return;
  }

  try {
    const payload = verifyToken(refreshJwt);
    const user = await User.findById(payload.userId);
    if (!user || user.status !== "active") {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const newAccessToken = signAccessToken({ userId: user.id, sessionId: payload.sessionId, role: user.role });
    const newRefreshToken = signRefreshToken({ userId: user.id, sessionId: payload.sessionId, role: user.role });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, permissions: user.permissions, allowedSections: user.allowedSections, preferredLanguage: user.preferredLanguage, mfaEnabled: user.mfaEnabled, lastLoginAt: user.lastLoginAt?.toISOString() ?? null, sessionExpiresAt: null },
      requiresMfa: false,
      mfaSessionToken: null,
    });
  } catch (err) {
    logger.error({ err }, "Refresh token verification failed");
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  const user = await User.findById(req.userId).lean();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const session = await Session.findById(req.sessionId).lean();

  res.json({
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    allowedSections: user.allowedSections,
    preferredLanguage: user.preferredLanguage,
    mfaEnabled: user.mfaEnabled,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    sessionExpiresAt: session?.expiresAt?.toISOString() ?? null,
  });
});

// POST /api/auth/verify-email
router.post("/verify-email", async (req: Request, res: Response) => {
  await connectDb();
  const { email, code } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.emailVerificationCode !== code) {
    res.status(400).json({ error: "Invalid or expired code" });
    return;
  }

  if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
    res.status(400).json({ error: "Code expired" });
    return;
  }

  user.emailVerified = true;
  user.emailVerificationCode = undefined;
  user.emailVerificationExpiry = undefined;
  user.status = "active";
  await user.save();

  res.json({ success: true, message: "Email verified" });
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req: Request, res: Response) => {
  await connectDb();
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration
  if (user) {
    const token = generateSecureToken();
    user.passwordResetToken = hashToken(token);
    user.passwordResetExpiry = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const baseUrl = process.env.BASE_URL || "https://presentation.thanarah.com";
    await sendPasswordResetEmail({
      to: user.email,
      name: user.fullName,
      resetUrl: `${baseUrl}/reset-password?token=${token}`,
    });
  }

  res.json({ success: true, message: "If an account exists, a reset email has been sent" });
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req: Request, res: Response) => {
  await connectDb();
  const { token, password } = req.body;

  if (!token || !password || password.length < 8) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const tokenHash = hashToken(token);
  const user = await User.findOne({ passwordResetToken: tokenHash });

  if (!user || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
    res.status(400).json({ error: "Invalid or expired reset link" });
    return;
  }

  user.passwordHash = await bcrypt.hash(password, 12);
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  await user.save();

  // Revoke all sessions
  await Session.updateMany({ userId: user._id, status: "active" }, { status: "revoked", revokedAt: new Date() });

  res.json({ success: true, message: "Password reset successfully" });
});

// POST /api/auth/mfa/verify  — step 2 of login when MFA is required
router.post("/mfa/verify", async (req: Request, res: Response) => {
  await connectDb();
  const { mfaSessionToken, code } = req.body;
  if (!mfaSessionToken || !code) {
    res.status(400).json({ error: "Missing mfaSessionToken or code" });
    return;
  }
  let userId: string;
  try {
    ({ userId } = verifyMfaToken(mfaSessionToken));
  } catch {
    res.status(401).json({ error: "MFA session expired or invalid. Please log in again." });
    return;
  }

  const user = await User.findById(userId);
  if (!user || !user.mfaEnabled || !user.mfaSecret) {
    res.status(401).json({ error: "Invalid MFA state" });
    return;
  }

  const result = verifySync({ token: code.replace(/\s/g, ""), secret: user.mfaSecret });
  const valid = result && (typeof result === 'boolean' ? result : result.valid);
  if (!valid) {
    res.status(401).json({ error: "رمز التحقق غير صحيح أو منتهي الصلاحية" });
    return;
  }

  const ip = getIp(req);
  const ua = req.headers["user-agent"] || "";
  const sessionCode = generateSessionCode();
  const sessionToken = generateSecureToken();
  const refreshToken = generateSecureToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  const session = await Session.create({
    userId: user._id,
    sessionTokenHash: hashToken(sessionToken),
    refreshTokenHash: hashToken(refreshToken),
    sessionCode,
    ipAddress: ip,
    userAgent: ua,
    deviceType: getDeviceType(ua),
    expiresAt,
  });

  const accessToken = signAccessToken({ userId: user.id, sessionId: session.id, role: user.role });
  const refreshJwt  = signRefreshToken({ userId: user.id, sessionId: session.id, role: user.role });

  await logAudit({ actor: user.fullName, actorId: user._id as any, action: "login.mfa.success", result: "success", riskScore: "low", ipAddress: ip, sessionId: session.id, timestamp: new Date() });

  res.json({
    accessToken,
    refreshToken: refreshJwt,
    user: {
      id: user.id, fullName: user.fullName, email: user.email,
      role: user.role, permissions: user.permissions,
      allowedSections: user.allowedSections,
      preferredLanguage: user.preferredLanguage,
      mfaEnabled: true, lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      sessionExpiresAt: expiresAt.toISOString(),
    },
  });
});

// POST /api/auth/mfa/setup  — generate TOTP secret for authenticated user
router.post("/mfa/setup", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  const user = await User.findById(req.userId);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  // Generate a fresh secret (not saved yet — only saved on /mfa/enable after verification)
  const secret = generateSecret();
  const otpauthUrl = generateURI({ strategy: "totp", issuer: "Thanarah", label: user.email, secret });

  res.json({ secret, otpauthUrl });
});

// POST /api/auth/mfa/enable  — verify TOTP and save secret
router.post("/mfa/enable", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  const { secret, code } = req.body;
  if (!secret || !code) { res.status(400).json({ error: "Missing secret or code" }); return; }

  const r2 = verifySync({ token: String(code).replace(/\s/g, ""), secret });
  const valid2 = r2 && (typeof r2 === 'boolean' ? r2 : r2.valid);
  if (!valid2) { res.status(400).json({ error: "رمز التحقق غير صحيح" }); return; }

  await User.findByIdAndUpdate(req.userId, { mfaEnabled: true, mfaSecret: secret });
  await logAudit({ actor: req.userId!, action: "mfa.enabled", result: "success", riskScore: "low", ipAddress: getIp(req), timestamp: new Date() });

  res.json({ success: true });
});

// POST /api/auth/mfa/disable  — disable MFA (requires current TOTP code or password)
router.post("/mfa/disable", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  const { code, password } = req.body;
  const user = await User.findById(req.userId);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  // Require either valid TOTP or password to disable
  let authorized = false;
  if (code && user.mfaSecret) {
    const r3 = verifySync({ token: String(code).replace(/\s/g, ""), secret: user.mfaSecret });
    authorized = !!(r3 && (typeof r3 === 'boolean' ? r3 : r3.valid));
  }
  if (!authorized && password) {
    authorized = await bcrypt.compare(password, user.passwordHash);
  }
  if (!authorized) {
    res.status(401).json({ error: "رمز التحقق أو كلمة المرور غير صحيحة" });
    return;
  }

  user.mfaEnabled = false;
  user.mfaSecret  = undefined;
  await user.save();
  await logAudit({ actor: user.fullName, actorId: user._id as any, action: "mfa.disabled", result: "success", riskScore: "medium", ipAddress: getIp(req), timestamp: new Date() });

  res.json({ success: true });
});

export default router;
