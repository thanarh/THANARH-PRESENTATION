import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
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

const router = Router();

function getIp(req: Request): string {
  return (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
}

function getDeviceType(ua: string): string {
  if (/mobile|android|iphone|ipad/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}

function setCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearCookies(res: Response): void {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
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
    const mfaToken = generateSecureToken(16);
    res.status(200).json({
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, permissions: user.permissions, allowedSections: user.allowedSections, preferredLanguage: user.preferredLanguage, mfaEnabled: true },
      requiresMfa: true,
      mfaSessionToken: mfaToken,
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
  setCookies(res, accessToken, refreshJwt);

  await logAudit({ actor: user.fullName, actorId: user._id as unknown as import("mongoose").Types.ObjectId, action: "login.success", result: "success", riskScore: "low", ipAddress: ip, sessionId: session.id, timestamp: new Date() });

  // Fire-and-forget login alert
  sendLoginAlertEmail({ to: user.email, name: user.fullName, ipAddress: ip, device: getDeviceType(ua), time: new Date() }).catch(() => {});

  res.json({
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
  clearCookies(res);
  await logAudit({ actor: req.userId || "unknown", action: "logout", result: "success", riskScore: "low", ipAddress: getIp(req), sessionId: req.sessionId, timestamp: new Date() });
  res.json({ success: true, message: "Logged out" });
});

// POST /api/auth/refresh
router.post("/refresh", async (req: Request, res: Response) => {
  await connectDb();
  const refreshJwt = req.cookies?.refresh_token;
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
    setCookies(res, newAccessToken, newRefreshToken);

    res.json({
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, permissions: user.permissions, allowedSections: user.allowedSections, preferredLanguage: user.preferredLanguage, mfaEnabled: user.mfaEnabled, lastLoginAt: user.lastLoginAt?.toISOString() ?? null, sessionExpiresAt: null },
      requiresMfa: false,
      mfaSessionToken: null,
    });
  } catch {
    clearCookies(res);
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

// POST /api/auth/mfa/verify
router.post("/mfa/verify", async (req: Request, res: Response) => {
  // Simplified MFA — in production integrate with a TOTP library
  res.status(501).json({ error: "MFA not fully implemented yet" });
});

export default router;
