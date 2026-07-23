/**
 * /api/whatsapp — admin-only WhatsApp management routes
 */

import { Router, type Response, type Request } from "express";
import { authenticate, type AuthRequest, ADMIN_ROLES } from "../lib/auth";
import { whatsappService } from "../services/whatsapp";
import { logger } from "../lib/logger";
import { connectDb } from "../lib/db";
import WhatsAppAccount, {
  normalizeWhatsAppPhone,
  serializeWhatsAppAccount,
} from "../models/whatsappAccount";

const router = Router();

// ── Auth middleware for all routes ──────────────────────────────────────────
// SSE clients can't set headers, so we also accept ?token= as a query param
router.use((req: AuthRequest, res: Response, next: any) => {
  // Inject query token into Authorization header if not already present
  const queryToken = req.query?.token as string | undefined;
  if (queryToken && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${queryToken}`;
  }
  next();
});

function requireAdmin(req: AuthRequest, res: Response): boolean {
  if (!ADMIN_ROLES.includes(req.userRole ?? "")) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

router.use(authenticate as any);
router.use((req: AuthRequest, res: Response, next: any) => requireAdmin(req, res) && next());

// ── WhatsApp account routing configuration ──────────────────────────────────
router.get("/accounts", async (_req: Request, res: Response) => {
  await connectDb();
  const accounts = await WhatsAppAccount.find().sort({ createdAt: 1 }).lean();
  res.json({ accounts: accounts.map((account) => serializeWhatsAppAccount(account as any)) });
});

router.post("/accounts", async (req: AuthRequest, res: Response) => {
  await connectDb();
  const {
    name,
    phone,
    enabled = true,
    autoReplyEnabled = true,
    responseTopics = [],
    responseInstructions = "",
    adminUsers = [],
  } = req.body ?? {};

  if (typeof name !== "string" || name.trim().length < 2) {
    res.status(400).json({ error: "اسم الحساب مطلوب" });
    return;
  }

  const normalizedPhone = phone ? normalizeWhatsAppPhone(String(phone)) : undefined;
  if (normalizedPhone && normalizedPhone.length < 7) {
    res.status(400).json({ error: "رقم واتساب غير صحيح" });
    return;
  }

  const account = await WhatsAppAccount.create({
    name: name.trim(),
    phone: normalizedPhone,
    enabled: Boolean(enabled),
    autoReplyEnabled: Boolean(autoReplyEnabled),
    responseTopics: Array.isArray(responseTopics)
      ? responseTopics.map((topic: unknown) => String(topic).trim()).filter(Boolean)
      : [],
    responseInstructions: typeof responseInstructions === "string" ? responseInstructions.trim() : "",
    adminUsers: normalizeAdminUsers(adminUsers),
    createdBy: req.userId,
  });

  res.status(201).json({ account: serializeWhatsAppAccount(account) });
});

router.patch("/accounts/:id", async (req: AuthRequest, res: Response) => {
  await connectDb();
  const updates: Record<string, unknown> = {};
  const body = req.body ?? {};

  if (body.name !== undefined) updates.name = String(body.name).trim();
  if (body.phone !== undefined) updates.phone = body.phone ? normalizeWhatsAppPhone(String(body.phone)) : "";
  if (body.enabled !== undefined) updates.enabled = Boolean(body.enabled);
  if (body.autoReplyEnabled !== undefined) updates.autoReplyEnabled = Boolean(body.autoReplyEnabled);
  if (body.responseInstructions !== undefined) updates.responseInstructions = String(body.responseInstructions).trim();
  if (body.responseTopics !== undefined) {
    updates.responseTopics = Array.isArray(body.responseTopics)
      ? body.responseTopics.map((topic: unknown) => String(topic).trim()).filter(Boolean)
      : [];
  }
  if (body.adminUsers !== undefined) updates.adminUsers = normalizeAdminUsers(body.adminUsers);

  const account = await WhatsAppAccount.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!account) {
    res.status(404).json({ error: "WhatsApp account not found" });
    return;
  }
  res.json({ account: serializeWhatsAppAccount(account) });
});

router.delete("/accounts/:id", async (req: Request, res: Response) => {
  await connectDb();
  const deleted = await WhatsAppAccount.findByIdAndDelete(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: "WhatsApp account not found" });
    return;
  }
  res.json({ success: true });
});

// GET /api/whatsapp/state — connection state + recent messages
router.get("/state", (req: Request, res: Response) => {
  const state = whatsappService.getState();
  // Don't send the full QR in state (it's large); send a flag instead
  res.json({
    ...state,
    hasQr: !!state.qrBase64,
    qrBase64: undefined,
    messages: whatsappService.messages.slice(0, 50),
  });
});

// GET /api/whatsapp/qr — returns the QR code as base64 PNG (if available)
router.get("/qr", (req: Request, res: Response) => {
  const qr = whatsappService.qrBase64;
  if (!qr) {
    res.status(404).json({ error: "No QR code available", status: whatsappService.status });
    return;
  }
  res.json({ qrBase64: qr, status: whatsappService.status });
});

// POST /api/whatsapp/connect — start WhatsApp connection
router.post("/connect", async (req: Request, res: Response) => {
  try {
    await whatsappService.connect();
    res.json({ message: "Connection initiated", status: whatsappService.status });
  } catch (err: any) {
    logger.error({ err }, "WhatsApp connect error");
    res.status(500).json({ error: err.message ?? "Connection failed" });
  }
});

// POST /api/whatsapp/disconnect — log out & clear auth
router.post("/disconnect", async (req: Request, res: Response) => {
  try {
    await whatsappService.disconnect();
    res.json({ message: "Disconnected and session cleared" });
  } catch (err: any) {
    logger.error({ err }, "WhatsApp disconnect error");
    res.status(500).json({ error: err.message ?? "Disconnect failed" });
  }
});

// POST /api/whatsapp/cancel-reply — cancel pending AI auto-reply for a JID
router.post("/cancel-reply", (req: Request, res: Response) => {
  const { jid } = req.body;
  if (!jid) { res.status(400).json({ error: "jid required" }); return; }
  whatsappService.cancelPendingReply(jid);
  res.json({ success: true });
});

// POST /api/whatsapp/send — send a manual text message
router.post("/send", async (req: Request, res: Response) => {
  const { jid, text } = req.body;
  if (!jid || !text) { res.status(400).json({ error: "jid and text required" }); return; }
  try {
    await whatsappService.sendMessage(jid, text);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/whatsapp/send-image — send an image by URL with optional caption
router.post("/send-image", async (req: Request, res: Response) => {
  const { jid, imageUrl, caption } = req.body;
  if (!jid || !imageUrl) { res.status(400).json({ error: "jid and imageUrl required" }); return; }
  try {
    await whatsappService.sendImage(jid, imageUrl, caption ?? "");
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/whatsapp/events — SSE stream for real-time updates (status + messages)
router.get("/events", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Send current state immediately
  sendEvent("state", whatsappService.getState());

  const onStatus = (status: string) => sendEvent("state", { status });
  const onQR    = (qr: string)     => sendEvent("qr", { qrBase64: qr });
  const onMsg   = (msg: any)       => sendEvent("message", msg);

  whatsappService.on("status", onStatus);
  whatsappService.on("qr", onQR);
  whatsappService.on("message", onMsg);

  // Heartbeat every 20s
  const hb = setInterval(() => res.write(":heartbeat\n\n"), 20_000);

  req.on("close", () => {
    clearInterval(hb);
    whatsappService.off("status", onStatus);
    whatsappService.off("qr", onQR);
    whatsappService.off("message", onMsg);
  });
});

export default router;

function normalizeAdminUsers(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      name: String(item.name ?? "").trim(),
      phone: normalizeWhatsAppPhone(String(item.phone ?? "")),
      enabled: item.enabled !== false,
      permissions: Array.isArray(item.permissions) ? item.permissions.map(String) : ["commands"],
      topics: Array.isArray(item.topics)
        ? item.topics.map(String).map((topic) => topic.trim()).filter(Boolean)
        : [],
    }))
    .filter((item) => item.name.length >= 2 && item.phone.length >= 7);
}
