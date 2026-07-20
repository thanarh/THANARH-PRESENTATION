import jwt from "jsonwebtoken";
import crypto from "crypto";
import { type Request, type Response, type NextFunction } from "express";
import { logger } from "./logger";

const JWT_SECRET = process.env.JWT_SECRET || "thanarah-dev-secret-change-in-production";
const JWT_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

export interface TokenPayload {
  userId: string;
  sessionId: string;
  role: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function generateSessionCode(): string {
  return crypto.randomBytes(8).toString("hex").toUpperCase();
}

export interface AuthRequest extends Request {
  userId?: string;
  sessionId?: string;
  userRole?: string;
  userPermissions?: string[];
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const payload = verifyToken(token);
    req.userId = payload.userId;
    req.sessionId = payload.sessionId;
    req.userRole = payload.role;
    next();
  } catch (err) {
    logger.error({ err }, "Token verification failed");
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userPermissions?.includes(permission)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

export const ADMIN_ROLES = ["owner", "super_admin", "admin"];
export const PRESENTER_ROLES = [...ADMIN_ROLES, "presenter", "investor", "partner", "team_member", "viewer"];

export function isAdmin(role: string): boolean {
  return ADMIN_ROLES.includes(role);
}
