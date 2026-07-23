/**
 * WhatsApp Web service — Baileys-based singleton.
 * Manages connection, QR code, incoming messages, and 60-second AI auto-reply.
 */

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  type WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import { EventEmitter } from "events";
import path from "path";
import fs from "fs/promises";
import { logger } from "../lib/logger";
import { generateWhatsAppReply, type ChatMessage } from "./moonshot";
import { isAdminPhone, handleAdminCommand } from "./waAdminCommands";
import WhatsAppAccount, {
  phoneFromJid,
  type IWhatsAppAccount,
} from "../models/whatsappAccount";

// Store WhatsApp auth in a persistent workspace directory (not /tmp).
// process.cwd() is artifacts/api-server/ when started via pnpm, so
// .wa-auth lives at artifacts/api-server/.wa-auth — survives restarts.
const PERSISTENT_AUTH_DIR = path.resolve(process.cwd(), ".wa-auth");

export type WAStatus = "disconnected" | "connecting" | "qr_ready" | "connected";

export interface WAMessage {
  id: string;
  from: string;           // JID
  fromName: string;
  body: string;
  timestamp: number;
  direction: "in" | "out";
  aiReplied: boolean;
  pending: boolean;       // waiting for auto-reply timer
  mediaUrl?: string;
  mediaType?: "image";
}

const AUTO_REPLY_DELAY_MS = 0; // immediate reply

class WhatsAppService extends EventEmitter {
  private sock: WASocket | null = null;
  private _status: WAStatus = "disconnected";
  private _qrBase64: string | null = null;
  private _phone: string | null = null;
  private pendingTimers = new Map<string, NodeJS.Timeout>();
  private conversationHistory = new Map<string, ChatMessage[]>(); // jid → history
  public messages: WAMessage[] = [];
  private authDir: string;

  constructor() {
    super();
    this.authDir = PERSISTENT_AUTH_DIR;
  }

  get status(): WAStatus { return this._status; }
  get qrBase64(): string | null { return this._qrBase64; }
  get phone(): string | null { return this._phone; }

  private async getConnectedAccount(): Promise<IWhatsAppAccount | null> {
    if (!this._phone) return null;
    return WhatsAppAccount.findOne({ phone: this._phone, enabled: true }).exec();
  }

  private async getRoutingProfile(jid: string): Promise<IWhatsAppAccount | null> {
    const account = await this.getConnectedAccount();
    if (!account) return null;
    const senderPhone = phoneFromJid(jid);
    const isAdmin = account.adminUsers.some(
      (admin) => admin.enabled && admin.phone === senderPhone,
    );
    return isAdmin ? account : null;
  }

  private setStatus(s: WAStatus) {
    this._status = s;
    this.emit("status", s);
    logger.info({ waStatus: s }, "WhatsApp status changed");
  }

  async connect() {
    if (this._status === "connecting" || this._status === "connected") return;

    this.setStatus("connecting");
    await fs.mkdir(this.authDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
    const { version } = await fetchLatestBaileysVersion();

    this.sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: logger.child({ module: "baileys" }) as any,
      browser: ["Thanarah Admin", "Chrome", "3.0.0"],
      connectTimeoutMs: 60_000,
      retryRequestDelayMs: 2000,
      maxMsgRetryCount: 3,
      generateHighQualityLinkPreview: false,
    });

    this.sock.ev.on("creds.update", saveCreds);

    this.sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this._qrBase64 = await QRCode.toDataURL(qr, {
          errorCorrectionLevel: "M",
          margin: 2,
          color: { dark: "#041C0F", light: "#FFFFFF" },
        });
        this.setStatus("qr_ready");
        this.emit("qr", this._qrBase64);
      }

      if (connection === "open") {
        this._qrBase64 = null;
        const jid = this.sock?.user?.id ?? null;
        this._phone = jid ? jid.split(":")[0].split("@")[0] : null;
        this.setStatus("connected");
      }

      if (connection === "close") {
        const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = reason !== DisconnectReason.loggedOut;
        logger.warn({ reason, shouldReconnect }, "WhatsApp connection closed");
        this._phone = null;
        this.setStatus("disconnected");

        if (shouldReconnect) {
          setTimeout(() => this.connect(), 5000);
        } else {
          // Logged out — clear auth
          await fs.rm(this.authDir, { recursive: true, force: true });
        }
      }
    });

    this.sock.ev.on("messages.upsert", async ({ messages: msgs, type }) => {
      if (type !== "notify") return;

      for (const msg of msgs) {
        if (!msg.message || msg.key.fromMe) continue;

        const jid = msg.key.remoteJid!;
        if (jid.endsWith("@g.us")) continue; // skip group messages

        const body =
          msg.message.conversation ??
          msg.message.extendedTextMessage?.text ??
          "";
        if (!body.trim()) continue;

        const pushName = msg.pushName ?? jid.split("@")[0];
        const msgId = msg.key.id ?? `${Date.now()}`;
        const timestamp = (msg.messageTimestamp as number) * 1000;

        const waMsg: WAMessage = {
          id: msgId,
          from: jid,
          fromName: pushName,
          body,
          timestamp,
          direction: "in",
          aiReplied: false,
          pending: true,
        };

        this.messages.unshift(waMsg);
        if (this.messages.length > 200) this.messages.length = 200;
        this.emit("message", waMsg);

        const configuredAccount = await this.getConnectedAccount().catch(() => null);
        const adminProfile = await this.getRoutingProfile(jid).catch(() => null);
        const legacyAdmin = !configuredAccount && isAdminPhone(jid);
        const isAdmin = Boolean(adminProfile || legacyAdmin);

        logger.info({ from: jid, pushName, body, isAdmin }, "WhatsApp message received");

        // ── Admin command routing ────────────────────────────────────────────
        if (isAdmin) {
          waMsg.pending = false;
          try {
            const reply = await handleAdminCommand(body);
            await this.sock?.sendMessage(jid, { text: reply });

            const outMsg: WAMessage = {
              id: `cmd-${Date.now()}`,
              from: jid,
              fromName: "⚙️ بوت ثناره",
              body: reply,
              timestamp: Date.now(),
              direction: "out",
              aiReplied: false,
              pending: false,
            };
            this.messages.unshift(outMsg);
            if (this.messages.length > 200) this.messages.length = 200;
            this.emit("message", outMsg);
            logger.info({ jid, cmd: body.split(" ")[0] }, "Admin command executed via WhatsApp");
          } catch (err) {
            logger.error({ err, jid }, "Admin command failed");
            await this.sock?.sendMessage(jid, { text: "❌ حدث خطأ أثناء تنفيذ الأمر. راجع سجلات الخادم." }).catch(() => {});
          }
          continue; // Skip AI auto-reply for admin numbers
        }

        // ── AI auto-reply (non-admin contacts) ──────────────────────────────
        if (configuredAccount && !configuredAccount.autoReplyEnabled) {
          waMsg.pending = false;
          continue;
        }
        // Cancel any existing timer for this JID (new message resets it)
        const existing = this.pendingTimers.get(jid);
        if (existing) clearTimeout(existing);

        const timer = setTimeout(async () => {
          this.pendingTimers.delete(jid);
          waMsg.pending = false;

          try {
            const history = this.conversationHistory.get(jid) ?? [];
            const reply = await generateWhatsAppReply(body, history, {
              topics: configuredAccount?.responseTopics,
              instructions: configuredAccount?.responseInstructions,
            });
            await this.sock?.sendMessage(jid, { text: reply });

            // Update history
            history.push({ role: "user", content: body });
            history.push({ role: "assistant", content: reply });
            if (history.length > 20) history.splice(0, 2);
            this.conversationHistory.set(jid, history);

            // Record out message
            const outMsg: WAMessage = {
              id: `ai-${Date.now()}`,
              from: jid,
              fromName: "مساعد ثناره 🤖",
              body: reply,
              timestamp: Date.now(),
              direction: "out",
              aiReplied: true,
              pending: false,
            };
            waMsg.aiReplied = true;
            this.messages.unshift(outMsg);
            this.emit("message", outMsg);
            logger.info({ jid, replyLength: reply.length }, "AI auto-reply sent");
          } catch (err) {
            logger.error({ err, jid }, "Failed to send AI auto-reply");
          }
        }, AUTO_REPLY_DELAY_MS);

        this.pendingTimers.set(jid, timer);
      }
    });
  }

  /** Cancel the pending AI reply for a JID (team is handling it manually) */
  cancelPendingReply(jid: string) {
    const t = this.pendingTimers.get(jid);
    if (t) { clearTimeout(t); this.pendingTimers.delete(jid); }
    const msg = this.messages.find(m => m.from === jid && m.pending);
    if (msg) msg.pending = false;
  }

  async sendMessage(jid: string, text: string) {
    if (!this.sock || this._status !== "connected") throw new Error("Not connected");
    await this.sock.sendMessage(jid, { text });
    this.cancelPendingReply(jid);
    const outMsg: WAMessage = {
      id: `manual-${Date.now()}`,
      from: jid,
      fromName: "الفريق",
      body: text,
      timestamp: Date.now(),
      direction: "out",
      aiReplied: false,
      pending: false,
    };
    this.messages.unshift(outMsg);
    this.emit("message", outMsg);
  }

  async sendImage(jid: string, imageUrl: string, caption = "") {
    if (!this.sock || this._status !== "connected") throw new Error("Not connected");
    await this.sock.sendMessage(jid, { image: { url: imageUrl }, caption });
    this.cancelPendingReply(jid);
    const outMsg: WAMessage = {
      id: `img-${Date.now()}`,
      from: jid,
      fromName: "الفريق",
      body: caption ? `🖼️ ${caption}` : "🖼️ صورة",
      timestamp: Date.now(),
      direction: "out",
      aiReplied: false,
      pending: false,
      mediaUrl: imageUrl,
      mediaType: "image",
    };
    this.messages.unshift(outMsg);
    this.emit("message", outMsg);
  }

  async disconnect() {
    for (const t of this.pendingTimers.values()) clearTimeout(t);
    this.pendingTimers.clear();
    await this.sock?.logout();
    this.sock = null;
    this._qrBase64 = null;
    this._phone = null;
    await fs.rm(this.authDir, { recursive: true, force: true });
    this.setStatus("disconnected");
  }

  getState() {
    return {
      status: this._status,
      phone: this._phone,
      accountConfigured: Boolean(this._phone),
      qrBase64: this._qrBase64,
      pendingCount: this.pendingTimers.size,
      messageCount: this.messages.length,
    };
  }
}

export const whatsappService = new WhatsAppService();
