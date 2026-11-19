import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { AlertCircle, Loader2, Mail, Phone, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';

type InviteInfo = {
  inviteeName: string;
  email: string | null;
  phone: string | null;
  role: string;
  expiresAt: string;
  inviterName: string;
  otpAvailable: boolean;
  otpResendIn: number;
};

function readInviteToken(): string {
  const token = window.location.hash.slice(1).trim();
  if (token) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  return token;
}

export default function InviteActivation() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const token = useMemo(readInviteToken, []);
  const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [sending, setSending] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`${apiBase}/api/invitations/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'رابط الدعوة غير صالح');
        if (!cancelled) {
          const info = data as InviteInfo;
          setInvite(info);
          setOtpSent(Boolean(info.otpAvailable));
          setCooldown(info.otpResendIn || 0);
        }
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'تعذّر التحقق من الدعوة');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [apiBase, token]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown(value => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const sendOtp = async () => {
    setError('');
    setSending(true);
    try {
      const response = await fetch(`${apiBase}/api/invitations/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.retryAfterSeconds) setCooldown(data.retryAfterSeconds);
        throw new Error(data.error || 'تعذّر إرسال رمز التحقق');
      }
      setOtpSent(true);
      setCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر إرسال رمز التحقق');
    } finally {
      setSending(false);
    }
  };

  const acceptInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(otp)) {
      setError('أدخل رمز التحقق المكوّن من 6 أرقام');
      return;
    }
    if (!acceptedTerms) {
      setError('يجب الموافقة على اتفاقية السرية');
      return;
    }
    if (invite?.email && password.length < 8) {
      setError('أدخل كلمة مرور من 8 أحرف على الأقل لتسجيل الدخول بالبريد');
      return;
    }

    setAccepting(true);
    try {
      const response = await fetch(`${apiBase}/api/invitations/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          otp,
          ...(invite?.email ? { password } : {}),
          acceptedTerms,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذّر تفعيل الحساب');
      if (!data.accessToken || !data.refreshToken || !data.user) {
        throw new Error('اكتمل التفعيل لكن تعذّر بدء الجلسة. حاول تسجيل الدخول.');
      }
      login(data.user, { accessToken: data.accessToken, refreshToken: data.refreshToken });
      setLocation('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تفعيل الحساب');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10" dir="rtl">
      <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-amber-200/20 blur-3xl" />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-lg flex-col justify-center">
        <header className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <img src="/logo-icon.png" alt="" className="h-7 w-7" onError={event => { event.currentTarget.style.display = 'none'; }} />
          </div>
          <p className="text-xs font-bold tracking-[0.18em] text-primary">ثناره</p>
          <h1 className="mt-2 text-2xl font-extrabold text-foreground">تفعيل الدعوة</h1>
          <p className="mt-2 text-sm text-muted-foreground">افتح الرابط الذي وصلك على واتساب، ثم أكّد رقم جوالك.</p>
        </header>

        <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-xl shadow-black/5 sm:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <span className="text-sm">نتحقق من الدعوة…</span>
            </div>
          ) : !token ? (
            <div className="py-4 text-center">
              <AlertCircle className="mx-auto h-9 w-9 text-amber-500" />
              <p className="mt-4 font-bold text-foreground">افتح رابط الدعوة الذي وصلك على واتساب</p>
              <p className="mt-2 text-sm text-muted-foreground">لا حاجة إلى كود دعوة. سيصلك رمز تحقق بعد فتح الرابط.</p>
            </div>
          ) : !invite ? (
            <div className="py-4 text-center">
              <AlertCircle className="mx-auto h-9 w-9 text-destructive" />
              <p className="mt-4 font-bold text-foreground">{error || 'رابط الدعوة غير صالح'}</p>
              <p className="mt-2 text-sm text-muted-foreground">اطلب من المسؤول إرسال دعوة جديدة.</p>
            </div>
          ) : (
            <>
              <div className="mb-6 rounded-2xl bg-muted/50 p-4">
                <p className="font-bold text-foreground">مرحباً {invite.inviteeName}</p>
                <p className="mt-1 text-xs text-muted-foreground">الدعوة من {invite.inviterName}</p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {invite.phone || 'رقم الدعوة'}</span>
                  {invite.email && <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {invite.email}</span>}
                  <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> {invite.role}</span>
                </div>
              </div>

              {error && (
                <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!otpSent ? (
                <Button type="button" className="h-12 w-full gap-2 text-base" onClick={sendOtp} disabled={sending || cooldown > 0}>
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Phone className="h-4 w-4" />}
                  {cooldown > 0 ? `انتظر ${cooldown} ثانية لإعادة الإرسال` : 'أرسل رمز التحقق على واتساب'}
                </Button>
              ) : (
                <form onSubmit={acceptInvite} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-otp">رمز التحقق</Label>
                    <Input
                      id="invite-otp"
                      value={otp}
                      onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="••••••"
                      className="h-12 text-center font-mono text-xl tracking-[0.35em]"
                      aria-label="رمز التحقق المرسل على واتساب"
                    />
                    <p className="text-xs text-muted-foreground">أدخل الرمز الذي وصل إلى رقم الجوال المدعو.</p>
                  </div>

                  {invite.email && (
                    <div className="space-y-2">
                      <Label htmlFor="invite-password">كلمة مرور للدخول بالبريد</Label>
                      <Input
                        id="invite-password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        placeholder="8 أحرف على الأقل"
                        className="h-11"
                      />
                    </div>
                  )}

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-4 text-sm">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={event => setAcceptedTerms(event.target.checked)}
                      className="mt-1 h-4 w-4 accent-primary"
                    />
                    <span>
                      <span className="font-semibold text-foreground">أوافق على اتفاقية السرية</span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                        أتعهد بعدم مشاركة محتوى البوابة أو نسخه أو توزيعه.
                      </span>
                    </span>
                  </label>

                  <Button type="submit" className="h-12 w-full text-base" disabled={accepting}>
                    {accepting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'تحقق وادخل إلى البوابة'}
                  </Button>

                  <button
                    type="button"
                    className="w-full text-center text-sm font-medium text-primary disabled:text-muted-foreground"
                    disabled={sending || cooldown > 0}
                    onClick={sendOtp}
                  >
                    {cooldown > 0 ? `إعادة الإرسال بعد ${cooldown} ثانية` : 'أعد إرسال الرمز'}
                  </button>
                </form>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
