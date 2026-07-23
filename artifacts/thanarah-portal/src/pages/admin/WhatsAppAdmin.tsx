import React, {
  useEffect, useRef, useState, useCallback, useMemo,
} from 'react';
import { AdminShell } from '../../components/AdminShell';
import {
  Wifi, WifiOff, QrCode, RefreshCw, Loader2, MessageSquare,
  Bot, User, XCircle, Send, PhoneCall, CheckCircle2, Clock,
  Image, Link2, Hash, ChevronLeft, Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ─────────────────────────────────────────────────────────────────────
type WAStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'connected';

interface WAMessage {
  id: string;
  from: string;
  fromName: string;
  body: string;
  timestamp: number;
  direction: 'in' | 'out';
  aiReplied: boolean;
  pending: boolean;
  mediaUrl?: string;
  mediaType?: 'image';
}

interface Conversation {
  jid: string;
  name: string;
  messages: WAMessage[];
  lastMsg: WAMessage;
  unread: number;
  hasPending: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const BASE = (import.meta as any).env?.BASE_URL?.replace(/\/$/, '') ?? '';
const getToken = () => localStorage.getItem('thanarah_access_token') ?? '';
const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  'Content-Type': 'application/json',
});

function fmtTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
}

function initials(name: string) {
  return name.trim().charAt(0).toUpperCase();
}

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: WAStatus }) {
  const cfg = {
    disconnected: { color: 'text-destructive',  bg: 'bg-destructive/10',  icon: WifiOff,       label: 'غير متصل' },
    connecting:   { color: 'text-yellow-600',   bg: 'bg-yellow-50',       icon: Loader2,       label: 'جارٍ الاتصال…' },
    qr_ready:     { color: 'text-blue-600',     bg: 'bg-blue-50',         icon: QrCode,        label: 'انتظار المسح' },
    connected:    { color: 'text-emerald-600',  bg: 'bg-emerald-50',      icon: CheckCircle2,  label: 'متصل' },
  }[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${cfg.color} ${cfg.bg}`}>
      <Icon className={`w-4 h-4 ${status === 'connecting' ? 'animate-spin' : ''}`} />
      {cfg.label}
    </span>
  );
}

// ── QR Panel ─────────────────────────────────────────────────────────────────
function QRPanel({ onConnect }: { onConnect: () => void }) {
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const sseRef = useRef<EventSource | null>(null);

  const startSSE = useCallback(() => {
    sseRef.current?.close();
    const es = new EventSource(`${BASE}/api/whatsapp/events?token=${encodeURIComponent(getToken())}`);
    sseRef.current = es;
    es.addEventListener('state', (e: MessageEvent) => {
      const d = JSON.parse(e.data);
      if (d.status === 'connected') onConnect();
    });
    es.addEventListener('qr', (e: MessageEvent) => {
      const d = JSON.parse(e.data);
      setQr(d.qrBase64);
    });
    es.onerror = () => es.close();
  }, [onConnect]);

  useEffect(() => () => sseRef.current?.close(), []);

  const handleActivate = async () => {
    setLoading(true); setQr(null);
    try {
      await fetch(`${BASE}/api/whatsapp/connect`, { method: 'POST', headers: authHeaders() });
      startSSE();
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const res = await fetch(`${BASE}/api/whatsapp/qr`, { headers: authHeaders() });
        if (res.ok) { const d = await res.json(); setQr(d.qrBase64); break; }
      }
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 py-10">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-bold">ربط واتساب بالنظام</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          افتح واتساب ← الإعدادات ← الأجهزة المرتبطة ← ربط جهاز ← امسح الباركود
        </p>
      </div>
      <AnimatePresence mode="wait">
        {qr ? (
          <motion.div key="qr"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="p-4 rounded-2xl border-2 border-primary/20 bg-white shadow-lg">
            <img src={qr} alt="WhatsApp QR" className="w-60 h-60 object-contain" />
          </motion.div>
        ) : (
          <motion.div key="ph" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="w-60 h-60 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 bg-muted/30">
            {loading
              ? <><Loader2 className="w-10 h-10 text-primary animate-spin" /><p className="text-sm text-muted-foreground">جارٍ التهيئة…</p></>
              : <><QrCode className="w-12 h-12 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">اضغط لتوليد الباركود</p></>
            }
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={handleActivate} disabled={loading}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
        {qr ? 'تحديث الباركود' : 'تفعيل الباركود'}
      </button>
    </motion.div>
  );
}

// ── Conversation list item ────────────────────────────────────────────────────
function ConvItem({ conv, selected, onClick }: {
  conv: Conversation; selected: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`w-full text-start px-3 py-3 rounded-xl flex items-center gap-3 transition-colors
        ${selected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/60'}`}>
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0
        ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
        {initials(conv.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="text-sm font-semibold text-foreground truncate">{conv.name}</span>
          <span className="text-[10px] text-muted-foreground shrink-0">{fmtTime(conv.lastMsg.timestamp)}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {conv.lastMsg.direction === 'out' && (
            <ChevronLeft className="w-3 h-3 text-muted-foreground shrink-0 rotate-180" />
          )}
          <span className="text-xs text-muted-foreground truncate">{conv.lastMsg.body}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {conv.hasPending && (
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[9px] font-medium">
            <Clock className="w-2.5 h-2.5" /> قيد الرد
          </span>
        )}
        {conv.unread > 0 && (
          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
            {conv.unread > 9 ? '9+' : conv.unread}
          </span>
        )}
      </div>
    </button>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ msg, onCancel }: { msg: WAMessage; onCancel: (jid: string) => void }) {
  const isOut = msg.direction === 'out';
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isOut ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold
        ${isOut && msg.aiReplied ? 'bg-violet-100 text-violet-700' : isOut ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground'}`}>
        {isOut && msg.aiReplied ? <Bot className="w-3.5 h-3.5" /> : isOut ? <User className="w-3.5 h-3.5" /> : initials(msg.fromName)}
      </div>
      <div className={`flex flex-col gap-1 max-w-[72%] ${isOut ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-muted-foreground">{msg.fromName}</span>
          {msg.aiReplied && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium flex items-center gap-0.5">
              <Bot className="w-2 h-2" /> AI
            </span>
          )}
          {msg.pending && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium flex items-center gap-0.5">
              <Clock className="w-2 h-2" /> قيد الرد
            </span>
          )}
        </div>
        {msg.mediaType === 'image' && msg.mediaUrl && (
          <img src={msg.mediaUrl} alt="صورة" className="rounded-xl max-w-[200px] max-h-[200px] object-cover border border-border" />
        )}
        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed
          ${isOut && msg.aiReplied ? 'bg-violet-600 text-white' : isOut ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
          dir="auto">
          {msg.body}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">{fmtTime(msg.timestamp)}</span>
          {msg.pending && (
            <button onClick={() => onCancel(msg.from)}
              className="text-[10px] text-destructive hover:underline flex items-center gap-0.5">
              <XCircle className="w-3 h-3" /> إلغاء الرد التلقائي
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Send toolbar modal ────────────────────────────────────────────────────────
type ToolMode = null | 'image' | 'link' | 'otp';

function SendToolbar({
  jid, onSent,
}: { jid: string; onSent: (body: string) => void }) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<ToolMode>(null);
  const [imgUrl, setImgUrl] = useState('');
  const [imgCaption, setImgCaption] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);

  const genOtp = () => setOtp(Math.floor(100000 + Math.random() * 900000).toString());

  const sendText = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await fetch(`${BASE}/api/whatsapp/send`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ jid, text: text.trim() }),
      });
      onSent(text.trim());
      setText('');
    } finally { setBusy(false); }
  };

  const sendImage = async () => {
    if (!imgUrl.trim()) return;
    setBusy(true);
    try {
      await fetch(`${BASE}/api/whatsapp/send-image`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ jid, imageUrl: imgUrl.trim(), caption: imgCaption }),
      });
      onSent(imgCaption ? `🖼️ ${imgCaption}` : '🖼️ صورة');
      setImgUrl(''); setImgCaption(''); setMode(null);
    } finally { setBusy(false); }
  };

  const sendLink = async () => {
    if (!linkUrl.trim()) return;
    const msg = linkLabel.trim() ? `${linkLabel.trim()}\n${linkUrl.trim()}` : linkUrl.trim();
    setBusy(true);
    try {
      await fetch(`${BASE}/api/whatsapp/send`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ jid, text: msg }),
      });
      onSent(msg);
      setLinkUrl(''); setLinkLabel(''); setMode(null);
    } finally { setBusy(false); }
  };

  const sendOtp = async () => {
    if (!otp.trim()) return;
    const msg = `🔐 رمز التحقق الخاص بك هو:\n\n*${otp}*\n\nصالح لمدة 10 دقائق. لا تشاركه مع أحد.`;
    setBusy(true);
    try {
      await fetch(`${BASE}/api/whatsapp/send`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ jid, text: msg }),
      });
      onSent(`🔐 ${otp}`);
      setOtp(''); setMode(null);
    } finally { setBusy(false); }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); }
  };

  return (
    <div className="border-t border-border bg-card">
      {/* Tool panels */}
      <AnimatePresence>
        {mode === 'image' && (
          <motion.div key="img" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pt-3 pb-2 flex flex-col gap-2 border-b border-border bg-blue-50/60">
              <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                <Image className="w-3.5 h-3.5" /> إرسال صورة برابط
              </p>
              <input value={imgUrl} onChange={e => setImgUrl(e.target.value)} placeholder="رابط الصورة https://..." dir="ltr"
                className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <input value={imgCaption} onChange={e => setImgCaption(e.target.value)} placeholder="تعليق اختياري…"
                className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <div className="flex gap-2">
                <button onClick={sendImage} disabled={busy || !imgUrl.trim()}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors">
                  {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} إرسال
                </button>
                <button onClick={() => setMode(null)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors">إلغاء</button>
              </div>
            </div>
          </motion.div>
        )}
        {mode === 'link' && (
          <motion.div key="link" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pt-3 pb-2 flex flex-col gap-2 border-b border-border bg-violet-50/60">
              <p className="text-xs font-semibold text-violet-700 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5" /> إرسال رابط
              </p>
              <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://thanarah.com/..." dir="ltr"
                className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <input value={linkLabel} onChange={e => setLinkLabel(e.target.value)} placeholder="نص الرابط (اختياري)…"
                className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <div className="flex gap-2">
                <button onClick={sendLink} disabled={busy || !linkUrl.trim()}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold disabled:opacity-50 hover:bg-violet-700 transition-colors">
                  {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} إرسال
                </button>
                <button onClick={() => setMode(null)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors">إلغاء</button>
              </div>
            </div>
          </motion.div>
        )}
        {mode === 'otp' && (
          <motion.div key="otp" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pt-3 pb-2 flex flex-col gap-2 border-b border-border bg-amber-50/60">
              <p className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" /> رمز التحقق OTP
              </p>
              <div className="flex gap-2">
                <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="123456" maxLength={8} dir="ltr"
                  className="flex-1 text-sm px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono tracking-widest text-center text-lg" />
                <button onClick={genOtp} className="px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">سيُرسل بصيغة: 🔐 رمز التحقق الخاص بك هو: <strong>{otp || 'XXXXXX'}</strong></p>
              <div className="flex gap-2">
                <button onClick={sendOtp} disabled={busy || !otp.trim()}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold disabled:opacity-50 hover:bg-amber-700 transition-colors">
                  {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} إرسال
                </button>
                <button onClick={() => setMode(null)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors">إلغاء</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input row */}
      <div className="flex items-end gap-2 p-3">
        {/* Quick tools */}
        <div className="flex gap-1 shrink-0">
          <button onClick={() => setMode(mode === 'image' ? null : 'image')}
            title="إرسال صورة"
            className={`p-2 rounded-lg transition-colors ${mode === 'image' ? 'bg-blue-100 text-blue-600' : 'hover:bg-muted text-muted-foreground'}`}>
            <Image className="w-4 h-4" />
          </button>
          <button onClick={() => setMode(mode === 'link' ? null : 'link')}
            title="إرسال رابط"
            className={`p-2 rounded-lg transition-colors ${mode === 'link' ? 'bg-violet-100 text-violet-600' : 'hover:bg-muted text-muted-foreground'}`}>
            <Link2 className="w-4 h-4" />
          </button>
          <button onClick={() => setMode(mode === 'otp' ? null : 'otp')}
            title="رمز تحقق"
            className={`p-2 rounded-lg transition-colors ${mode === 'otp' ? 'bg-amber-100 text-amber-600' : 'hover:bg-muted text-muted-foreground'}`}>
            <Hash className="w-4 h-4" />
          </button>
        </div>

        {/* Text area */}
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder="اكتب رسالة… (Enter للإرسال، Shift+Enter لسطر جديد)"
          dir="auto"
          className="flex-1 resize-none text-sm px-3 py-2 rounded-xl border border-border bg-muted/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors max-h-28"
          style={{ fieldSizing: 'content' } as any}
        />

        {/* Send button */}
        <button onClick={sendText} disabled={busy || !text.trim()}
          className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WhatsAppAdmin() {
  const [status, setStatus]       = useState<WAStatus>('disconnected');
  const [phone, setPhone]         = useState<string | null>(null);
  const [messages, setMessages]   = useState<WAMessage[]>([]);
  const [pendingCount, setPending] = useState(0);
  const [selectedJid, setSelectedJid] = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const sseRef  = useRef<EventSource | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Group messages into conversations
  const conversations = useMemo<Conversation[]>(() => {
    const map = new Map<string, WAMessage[]>();
    for (const m of messages) {
      const key = m.from;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    const convs: Conversation[] = [];
    map.forEach((msgs, jid) => {
      const sorted = [...msgs].sort((a, b) => a.timestamp - b.timestamp);
      const inMsgs = sorted.filter(m => m.direction === 'in');
      convs.push({
        jid,
        name: msgs.find(m => m.direction === 'in')?.fromName ?? jid.split('@')[0],
        messages: sorted,
        lastMsg: sorted[sorted.length - 1],
        unread: inMsgs.filter(m => m.pending).length,
        hasPending: msgs.some(m => m.pending),
      });
    });
    return convs
      .sort((a, b) => b.lastMsg.timestamp - a.lastMsg.timestamp)
      .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  }, [messages, search]);

  const activeConv = useMemo(
    () => conversations.find(c => c.jid === selectedJid) ?? null,
    [conversations, selectedJid],
  );

  // Scroll to bottom when active conversation changes
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [selectedJid, activeConv?.messages.length]);

  const loadState = useCallback(async () => {
    const res = await fetch(`${BASE}/api/whatsapp/state`, { headers: authHeaders() });
    if (!res.ok) return;
    const d = await res.json();
    setStatus(d.status); setPhone(d.phone ?? null); setPending(d.pendingCount ?? 0);
    setMessages(d.messages ?? []);
  }, []);

  const startSSE = useCallback(() => {
    sseRef.current?.close();
    const es = new EventSource(`${BASE}/api/whatsapp/events?token=${encodeURIComponent(getToken())}`);
    sseRef.current = es;
    es.addEventListener('state', (e: MessageEvent) => {
      const d = JSON.parse(e.data);
      setStatus(d.status); setPhone(d.phone ?? null); setPending(d.pendingCount ?? 0);
    });
    es.addEventListener('message', (e: MessageEvent) => {
      const msg = JSON.parse(e.data) as WAMessage;
      setMessages(prev => {
        const exists = prev.find(m => m.id === msg.id);
        if (exists) return prev.map(m => m.id === msg.id ? msg : m);
        // Auto-select if it's the first message from this contact
        setSelectedJid(sj => sj ?? msg.from);
        return [msg, ...prev].slice(0, 200);
      });
    });
    es.onerror = () => {};
  }, []);

  useEffect(() => { loadState(); startSSE(); return () => sseRef.current?.close(); }, [loadState, startSSE]);

  const handleConnected = useCallback(() => { setStatus('connected'); loadState(); }, [loadState]);

  const handleDisconnect = async () => {
    await fetch(`${BASE}/api/whatsapp/disconnect`, { method: 'POST', headers: authHeaders() });
    setStatus('disconnected'); setPhone(null); setMessages([]); setSelectedJid(null);
  };

  const handleCancelReply = async (jid: string) => {
    await fetch(`${BASE}/api/whatsapp/cancel-reply`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify({ jid }),
    });
    setMessages(prev => prev.map(m => m.from === jid && m.pending ? { ...m, pending: false } : m));
  };

  const handleSent = useCallback((body: string) => {
    loadState(); // refresh to pick up the new outbound message
  }, [loadState]);

  return (
    <AdminShell>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">ربط النظام بواتساب</h1>
            <p className="text-sm text-muted-foreground">
              {status === 'connected' && phone ? `+${phone} · ${pendingCount} قيد الرد` : 'مساعد ثناره يرد تلقائياً على العملاء'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          {status === 'connected' && (
            <button onClick={handleDisconnect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-sm hover:bg-destructive/5 transition-colors">
              <WifiOff className="w-4 h-4" /> قطع
            </button>
          )}
          <button onClick={loadState} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Not connected */}
      {status !== 'connected' && status !== 'connecting' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <QRPanel onConnect={handleConnected} />
        </div>
      )}

      {status === 'connecting' && (
        <div className="bg-card border border-border rounded-2xl p-16 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">جارٍ الاتصال بواتساب…</p>
        </div>
      )}

      {/* Connected — conversation UI */}
      {status === 'connected' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden flex h-[calc(100vh-220px)] min-h-[520px]">

          {/* Sidebar — conversation list */}
          <div className="w-72 border-e border-border flex flex-col shrink-0">
            {/* Sidebar header */}
            <div className="p-3 border-b border-border">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/60">
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="بحث في المحادثات…"
                  className="flex-1 text-sm bg-transparent focus:outline-none" />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground py-10">
                  <MessageSquare className="w-10 h-10 opacity-20" />
                  <p className="text-xs text-center">لا توجد محادثات بعد</p>
                </div>
              ) : conversations.map(conv => (
                <ConvItem key={conv.jid} conv={conv}
                  selected={selectedJid === conv.jid}
                  onClick={() => setSelectedJid(conv.jid)} />
              ))}
            </div>

            {/* Connected status bar */}
            <div className="p-3 border-t border-border bg-emerald-50/60">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                  <PhoneCall className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-emerald-800">متصل</p>
                  <p className="text-[10px] text-emerald-600">+{phone}</p>
                </div>
                <div className="ms-auto">
                  <span className="flex items-center gap-0.5 text-[10px] text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full font-medium">
                    <Bot className="w-2.5 h-2.5" /> AI نشط
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat view */}
          <div className="flex-1 flex flex-col min-w-0">
            {!activeConv ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <MessageSquare className="w-14 h-14 opacity-15" />
                <div className="text-center">
                  <p className="font-medium text-sm">اختر محادثة</p>
                  <p className="text-xs mt-1 opacity-70">اضغط على اسم العميل من القائمة</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-card">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {initials(activeConv.name)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{activeConv.name}</p>
                    <p className="text-[11px] text-muted-foreground" dir="ltr">{activeConv.jid}</p>
                  </div>
                  {activeConv.hasPending && (
                    <span className="ms-auto flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full font-medium">
                      <Clock className="w-3 h-3" /> الذكاء الاصطناعي سيرد الآن
                    </span>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                  {activeConv.messages.map(msg => (
                    <Bubble key={msg.id} msg={msg} onCancel={handleCancelReply} />
                  ))}
                  <div ref={bottomRef} />
                </div>

                {/* Input toolbar */}
                <SendToolbar jid={activeConv.jid} onSent={handleSent} />
              </>
            )}
          </div>
        </div>
      )}

      {/* How it works — only when disconnected */}
      {status === 'disconnected' && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: MessageSquare, color: 'bg-blue-50 text-blue-600 border-blue-200',    step: '1', title: 'تصل رسالة من العميل',     desc: 'يستقبل النظام الرسالة على رقم واتساب العمل' },
            { icon: Clock,         color: 'bg-yellow-50 text-yellow-600 border-yellow-200', step: '2', title: 'مساعد ثناره يرد فوراً', desc: 'ردّ ذكي فوري بناءً على بيانات ثناره الكاملة' },
            { icon: Bot,           color: 'bg-violet-50 text-violet-600 border-violet-200', step: '3', title: 'أو ترد أنت يدوياً',     desc: 'أرسل نصاً أو صورة أو رابطاً أو رمز تحقق' },
          ].map(item => (
            <div key={item.step} className={`border rounded-xl p-4 flex gap-3 ${item.color}`}>
              <div className="shrink-0 w-7 h-7 rounded-full bg-white/70 flex items-center justify-center font-bold text-sm">
                {item.step}
              </div>
              <div>
                <p className="font-semibold text-sm">{item.title}</p>
                <p className="text-xs mt-0.5 opacity-80">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
