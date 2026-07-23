import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AdminShell } from '../../components/AdminShell';
import {
  Wifi, WifiOff, QrCode, RefreshCw, Loader2, MessageSquare,
  Bot, User, XCircle, Send, PhoneCall, CheckCircle2, Clock
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
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const BASE = (import.meta as any).env?.BASE_URL?.replace(/\/$/, '') ?? '';
const getToken = () => localStorage.getItem('thanarah_access_token') ?? '';
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' });

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

function TimeAgo({ ts }: { ts: number }) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = Math.round((Date.now() - ts) / 1000);
      if (diff < 60) setLabel(`منذ ${diff}ث`);
      else if (diff < 3600) setLabel(`منذ ${Math.floor(diff / 60)}د`);
      else setLabel(fmtTime(ts));
    };
    update();
    const t = setInterval(update, 5000);
    return () => clearInterval(t);
  }, [ts]);
  return <span className="text-xs text-muted-foreground">{label}</span>;
}

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: WAStatus }) {
  const cfg = {
    disconnected: { color: 'text-destructive',      bg: 'bg-destructive/10',     icon: WifiOff,    label: 'غير متصل' },
    connecting:   { color: 'text-yellow-600',        bg: 'bg-yellow-50',          icon: Loader2,    label: 'جارٍ الاتصال…' },
    qr_ready:     { color: 'text-blue-600',          bg: 'bg-blue-50',            icon: QrCode,     label: 'انتظار المسح' },
    connected:    { color: 'text-emerald-600',        bg: 'bg-emerald-50',         icon: CheckCircle2, label: 'متصل' },
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
  const [status, setStatus] = useState<WAStatus>('disconnected');
  const sseRef = useRef<EventSource | null>(null);

  const startSSE = useCallback(() => {
    if (sseRef.current) sseRef.current.close();
    const url = `${BASE}/api/whatsapp/events`;
    // Append token as query param for SSE (can't set headers on EventSource)
    const es = new EventSource(`${url}?token=${encodeURIComponent(getToken())}`);
    sseRef.current = es;

    es.addEventListener('state', (e: MessageEvent) => {
      const d = JSON.parse(e.data);
      setStatus(d.status);
      if (d.status === 'connected') onConnect();
    });
    es.addEventListener('qr', (e: MessageEvent) => {
      const d = JSON.parse(e.data);
      setQr(d.qrBase64);
    });
    es.onerror = () => es.close();
  }, [onConnect]);

  useEffect(() => {
    return () => sseRef.current?.close();
  }, []);

  const handleActivate = async () => {
    setLoading(true);
    setQr(null);
    try {
      await fetch(`${BASE}/api/whatsapp/connect`, { method: 'POST', headers: authHeaders() });
      startSSE();
      // Poll for QR
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const res = await fetch(`${BASE}/api/whatsapp/qr`, { headers: authHeaders() });
        if (res.ok) { const d = await res.json(); setQr(d.qrBase64); break; }
      }
    } finally {
      setLoading(false);
    }
  };

  if (status === 'connected') return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 py-8">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-bold text-foreground">ربط واتساب بالنظام</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          افتح واتساب على هاتفك ← الإعدادات ← الأجهزة المرتبطة ← ربط جهاز ← امسح الباركود
        </p>
      </div>

      <AnimatePresence mode="wait">
        {qr ? (
          <motion.div key="qr"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="p-4 rounded-2xl border-2 border-primary/20 bg-white shadow-lg"
          >
            <img src={qr} alt="WhatsApp QR Code" className="w-64 h-64 object-contain" />
          </motion.div>
        ) : (
          <motion.div key="placeholder"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="w-64 h-64 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 bg-muted/30"
          >
            {loading ? (
              <><Loader2 className="w-10 h-10 text-primary animate-spin" /><p className="text-sm text-muted-foreground">جارٍ التهيئة…</p></>
            ) : (
              <><QrCode className="w-12 h-12 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">اضغط الزر لتوليد الباركود</p></>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        <button
          onClick={handleActivate}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
          {qr ? 'تحديث الباركود' : 'تفعيل الباركود'}
        </button>
      </div>

      <p className="text-xs text-muted-foreground text-center max-w-xs">
        بعد الربط، سيرد مساعد ثناره الذكي تلقائياً على رسائل العملاء خلال دقيقة واحدة
      </p>
    </motion.div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, onCancel }: { msg: WAMessage; onCancel: (jid: string) => void }) {
  const isOut = msg.direction === 'out';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isOut ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold
        ${isOut && msg.aiReplied ? 'bg-violet-100 text-violet-700' : isOut ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground'}`}>
        {isOut && msg.aiReplied ? <Bot className="w-4 h-4" /> : isOut ? <User className="w-4 h-4" /> : msg.fromName.charAt(0).toUpperCase()}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col gap-1 max-w-[75%] ${isOut ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{msg.fromName}</span>
          {msg.aiReplied && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
              <Bot className="w-2.5 h-2.5" /> AI
            </span>
          )}
          {msg.pending && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
              <Clock className="w-2.5 h-2.5" /> 60ث
            </span>
          )}
        </div>

        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed
          ${isOut && msg.aiReplied ? 'bg-violet-600 text-white' : isOut ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
          dir="auto"
        >
          {msg.body}
        </div>

        <div className="flex items-center gap-2">
          <TimeAgo ts={msg.timestamp} />
          {msg.pending && (
            <button
              onClick={() => onCancel(msg.from)}
              className="text-[10px] text-destructive hover:underline flex items-center gap-0.5"
            >
              <XCircle className="w-3 h-3" /> إلغاء الرد التلقائي
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WhatsAppAdmin() {
  const [status, setStatus]   = useState<WAStatus>('disconnected');
  const [phone, setPhone]     = useState<string | null>(null);
  const [messages, setMessages] = useState<WAMessage[]>([]);
  const [pendingCount, setPending] = useState(0);
  const sseRef = useRef<EventSource | null>(null);

  // Load initial state
  const loadState = useCallback(async () => {
    const res = await fetch(`${BASE}/api/whatsapp/state`, { headers: authHeaders() });
    if (!res.ok) return;
    const d = await res.json();
    setStatus(d.status);
    setPhone(d.phone);
    setPending(d.pendingCount ?? 0);
    setMessages(d.messages ?? []);
  }, []);

  // SSE for real-time updates
  const startSSE = useCallback(() => {
    sseRef.current?.close();
    const es = new EventSource(`${BASE}/api/whatsapp/events?token=${encodeURIComponent(getToken())}`);
    sseRef.current = es;

    es.addEventListener('state', (e: MessageEvent) => {
      const d = JSON.parse(e.data);
      setStatus(d.status);
      setPhone(d.phone ?? null);
      setPending(d.pendingCount ?? 0);
    });
    es.addEventListener('message', (e: MessageEvent) => {
      const msg = JSON.parse(e.data) as WAMessage;
      setMessages(prev => [msg, ...prev].slice(0, 200));
    });
    es.onerror = () => {}; // silent
  }, []);

  useEffect(() => {
    loadState();
    startSSE();
    return () => sseRef.current?.close();
  }, [loadState, startSSE]);

  const handleConnected = useCallback(() => {
    setStatus('connected');
    loadState();
  }, [loadState]);

  const handleDisconnect = async () => {
    await fetch(`${BASE}/api/whatsapp/disconnect`, { method: 'POST', headers: authHeaders() });
    setStatus('disconnected');
    setPhone(null);
    setMessages([]);
  };

  const handleCancelReply = async (jid: string) => {
    await fetch(`${BASE}/api/whatsapp/cancel-reply`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ jid }),
    });
    setMessages(prev => prev.map(m => m.from === jid && m.pending ? { ...m, pending: false } : m));
  };

  return (
    <AdminShell>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">ربط النظام بواتساب</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              مساعد ثناره الذكي يرد على العملاء تلقائياً بعد دقيقة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          {status === 'connected' && (
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-sm hover:bg-destructive/5 transition-colors"
            >
              <WifiOff className="w-4 h-4" /> قطع الاتصال
            </button>
          )}
        </div>
      </div>

      {/* Connected info bar */}
      <AnimatePresence>
        {status === 'connected' && phone && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <PhoneCall className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">واتساب متصل ✓</p>
              <p className="text-xs text-emerald-600">رقم الهاتف: +{phone}</p>
            </div>
            <div className="ms-auto text-right">
              <p className="text-xs text-emerald-600">انتظار رد تلقائي</p>
              <p className="text-sm font-bold text-emerald-800">{pendingCount} محادثة</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* QR / Status panel */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 flex flex-col items-center">
          {status !== 'connected' ? (
            <QRPanel onConnect={handleConnected} />
          ) : (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <p className="font-bold text-foreground">النظام مربوط</p>
                <p className="text-sm text-muted-foreground mt-1">
                  مساعد ثناره يراقب الرسائل ويرد تلقائياً
                </p>
              </div>
              <div className="w-full p-3 rounded-xl bg-violet-50 border border-violet-200 text-center">
                <Bot className="w-6 h-6 text-violet-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-violet-700">مساعد ثناره AI</p>
                <p className="text-xs text-violet-600 mt-1">
                  يرد بعد 60 ثانية إن لم يتجاوب الفريق
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Messages feed */}
        <div className="lg:col-span-3 bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground text-sm">المحادثات الأخيرة</span>
              {messages.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {messages.length}
                </span>
              )}
            </div>
            <button onClick={loadState} className="p-1 rounded-lg hover:bg-muted transition-colors">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px] max-h-[600px]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <MessageSquare className="w-12 h-12 opacity-20" />
                <p className="text-sm">
                  {status === 'connected'
                    ? 'لا توجد رسائل بعد — سيظهر هنا كل شيء'
                    : 'اربط واتساب أولاً لرؤية الرسائل'}
                </p>
              </div>
            ) : (
              messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} onCancel={handleCancelReply} />
              ))
            )}
          </div>

          {/* How AI works legend */}
          <div className="p-3 border-t border-border bg-muted/30">
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 inline-block" />
                رسالة واردة
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                رد يدوي من الفريق
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-violet-600 inline-block" />
                رد ذكاء اصطناعي تلقائي
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-yellow-600" />
                انتظار 60 ثانية
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: MessageSquare, color: 'bg-blue-50 text-blue-600 border-blue-200', step: '1', title: 'تصل رسالة من العميل', desc: 'يستقبل النظام الرسالة على رقم واتساب العمل' },
          { icon: Clock,         color: 'bg-yellow-50 text-yellow-600 border-yellow-200', step: '2', title: 'انتظار دقيقة كاملة', desc: 'إذا لم يرد أحد من الفريق خلال 60 ثانية' },
          { icon: Bot,           color: 'bg-violet-50 text-violet-600 border-violet-200', step: '3', title: 'مساعد ثناره يرد تلقائياً', desc: 'بالعربي أو الإنجليزي — بناءً على بيانات ثناره الكاملة' },
        ].map(item => (
          <motion.div key={item.step}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Number(item.step) * 0.1 }}
            className={`border rounded-xl p-4 flex gap-3 ${item.color}`}
          >
            <div className="shrink-0 w-8 h-8 rounded-full bg-white/70 flex items-center justify-center font-bold text-sm">
              {item.step}
            </div>
            <div>
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-xs mt-0.5 opacity-80">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </AdminShell>
  );
}
