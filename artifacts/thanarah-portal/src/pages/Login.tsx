import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useLogin, useForgotPassword } from '@workspace/api-client-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Form, FormControl, FormField, FormItem, FormMessage } from '../components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Loader2, ArrowRight, AlertCircle, CheckCircle2, Mail, Fingerprint, KeyRound, ShieldCheck, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  passkeySupported, hasStoredPasskey, getPasskeyDisplayName,
  registerPasskey, verifyPasskey,
} from '../utils/passkey';
import {
  storePasskeyRefresh, getPasskeyRefresh,
} from '../utils/pin';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
const forgotSchema = z.object({ email: z.string().email('Invalid email address') });

// ─── Side video panel ─────────────────────────────────────────────────────────

function LoginVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = 0.6;
    v.play().catch(() => {});
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#060f0a]">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 1.08 }}
        animate={revealed ? { opacity: 1, scale: 1.03 } : {}}
        transition={{ duration: 3.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <video
          ref={videoRef}
          autoPlay muted loop playsInline preload="auto"
          onCanPlay={() => setRevealed(true)}
          onLoadedMetadata={(e) => { (e.currentTarget as HTMLVideoElement).playbackRate = 0.6; }}
          style={{ width: '100%', height: '100%', objectFit: 'cover',
            filter: 'brightness(0.72) contrast(1.18) saturate(0.8) sepia(0.12)' }}
        >
          <source src={`${import.meta.env.BASE_URL}login-demo.webm`} type="video/webm" />
          <source src={`${import.meta.env.BASE_URL}login-demo.mov`} type="video/quicktime" />
        </video>
      </motion.div>

      <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 2,
        background: `radial-gradient(ellipse 90% 90% at 50% 50%, transparent 30%, rgba(4,12,8,0.55) 70%, rgba(4,12,8,0.92) 100%)`,
        pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 3,
        background: `linear-gradient(to bottom, rgba(6,15,10,0.88) 0%, transparent 22%, transparent 72%, rgba(6,15,10,0.92) 100%)`,
        pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 4,
        background: 'linear-gradient(135deg, rgba(15,61,51,0.38) 0%, transparent 60%, rgba(30,107,77,0.12) 100%)',
        mixBlendMode: 'multiply', pointerEvents: 'none' }} />
      <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04, pointerEvents: 'none', zIndex: 5 }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <motion.div aria-hidden initial={{ opacity: 1 }} animate={{ opacity: 0 }}
        transition={{ duration: 2.8, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{ position: 'absolute', inset: 0, background: '#060f0a', pointerEvents: 'none', zIndex: 6 }} />
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 2.0, ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-8 left-8" style={{ zIndex: 10 }}>
        <img src={`${import.meta.env.BASE_URL}logo-horizontal.png`} alt="Thanarah"
          className="h-7 object-contain brightness-0 invert" style={{ opacity: 0.7 }} />
      </motion.div>
      <motion.div aria-hidden initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1.4, delay: 2.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'absolute', bottom: 56, left: 32, width: 80, height: 1,
          background: 'linear-gradient(90deg, rgba(201,168,76,0.8), transparent)',
          transformOrigin: 'left center', zIndex: 10 }} />
    </div>
  );
}

// ─── Forgot-password dialog ───────────────────────────────────────────────────

function ForgotPasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, isRtl } = useLanguage();
  const [sent, setSent] = useState(false);
  const form = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });
  const { mutate: forgot, isPending } = useForgotPassword({ mutation: { onSuccess: () => setSent(true) } });
  useEffect(() => { if (open) { setSent(false); form.reset(); } }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md" dir={isRtl ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{t('forgotPasswordTitle')}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">{t('forgotPasswordDesc')}</DialogDescription>
        </DialogHeader>
        {sent ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
            <p className="font-semibold text-foreground">{t('resetLinkSent')}</p>
            <p className="text-sm text-muted-foreground">{t('resetLinkSentDesc')}</p>
            <Button variant="outline" className="w-full h-11 mt-2" onClick={onClose}>{t('cancel')}</Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(v => forgot({ data: { email: v.email } }))} className="space-y-4 pt-2">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <Label className="font-medium">{t('email')}</Label>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="name@example.com" className="h-11 ps-9" dir="ltr" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1 h-11" onClick={onClose}>{t('cancel')}</Button>
                <Button type="submit" className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('sendResetLink')}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── PIN pad ─────────────────────────────────────────────────────────────────

function PinPad({ onComplete, onCancel, isRtl }: {
  onComplete: (pin: string) => void;
  onCancel: () => void;
  isRtl: boolean;
}) {
  const [digits, setDigits] = useState<string[]>([]);
  const PIN_LENGTH = 4;

  const handleDigit = useCallback((d: string) => {
    setDigits(prev => {
      if (prev.length >= PIN_LENGTH) return prev;
      const next = [...prev, d];
      if (next.length === PIN_LENGTH) {
        // slight delay so user sees last dot fill before submit
        setTimeout(() => onComplete(next.join('')), 120);
      }
      return next;
    });
  }, [onComplete]);

  const handleDelete = () => setDigits(prev => prev.slice(0, -1));

  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div className="flex flex-col items-center gap-6" dir="ltr">
      {/* Dots */}
      <div className="flex gap-4 my-2">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ scale: digits.length > i ? 1.15 : 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={`w-4 h-4 rounded-full border-2 transition-colors duration-150 ${
              digits.length > i
                ? 'bg-primary border-primary'
                : 'border-border bg-transparent'
            }`}
          />
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
        {keys.map((k, i) => {
          if (k === '') return <div key={i} />;
          if (k === '⌫') return (
            <button
              key={i}
              onClick={handleDelete}
              className="h-14 rounded-xl bg-muted hover:bg-muted/80 active:scale-95 transition-all flex items-center justify-center text-muted-foreground"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
                <path d="M21 6H9l-7 6 7 6h12V6z"/>
              </svg>
            </button>
          );
          return (
            <button
              key={i}
              onClick={() => handleDigit(k)}
              className="h-14 rounded-xl bg-card border border-border hover:bg-accent active:scale-95 transition-all font-semibold text-xl text-foreground shadow-sm"
            >
              {k}
            </button>
          );
        })}
      </div>

      <button
        onClick={onCancel}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
      >
        {isRtl ? 'استخدام كلمة المرور' : 'Use password instead'}
      </button>
    </div>
  );
}

// ─── Quick-auth setup dialog (post-login) ─────────────────────────────────────

// Quick biometric setup after first login
function QuickAuthSetup({ open, onClose, refreshToken, userId, email, displayName }: {
  open: boolean; onClose: () => void; refreshToken: string;
  userId: string; email: string; displayName: string;
}) {
  const { isRtl } = useLanguage();
  const [done, setDone]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const supportsPasskey = passkeySupported();

  const handleBiometric = async () => {
    setLoading(true);
    const ok = await registerPasskey(userId, email, displayName);
    if (ok) { storePasskeyRefresh(refreshToken); setDone(true); }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm" dir={isRtl ? 'rtl' : 'ltr'}>
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div key="setup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <DialogHeader>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <DialogTitle className="text-center text-lg font-bold">
                  {isRtl ? 'تسريع الدخول القادم' : 'Speed up future logins'}
                </DialogTitle>
                <DialogDescription className="text-center text-sm text-muted-foreground">
                  {isRtl ? 'ادخل ببصمتك أو Face ID بدون كلمة مرور' : 'Sign in with biometrics next time'}
                </DialogDescription>
              </DialogHeader>
              {supportsPasskey ? (
                <button onClick={handleBiometric} disabled={loading}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-accent transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    {loading ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : <Fingerprint className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="text-start">
                    <p className="font-semibold text-sm text-foreground">{isRtl ? 'البصمة / Face ID' : 'Fingerprint / Face ID'}</p>
                    <p className="text-xs text-muted-foreground">{isRtl ? 'استخدم قفل الجهاز للدخول' : 'Use device biometrics'}</p>
                  </div>
                </button>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-2">
                  {isRtl ? 'جهازك لا يدعم البصمة' : 'Your device does not support biometrics'}
                </p>
              )}
              <button onClick={onClose} className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-1 transition-colors">
                {isRtl ? 'لاحقاً' : 'Maybe later'}
              </button>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4 space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <p className="font-bold text-foreground">{isRtl ? 'تم تفعيل البصمة!' : 'Biometric enabled!'}</p>
              <p className="text-sm text-muted-foreground">{isRtl ? 'يمكنك الدخول ببصمتك في المرات القادمة' : 'Quick login enabled for next time'}</p>
              <Button className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={onClose}>
                {isRtl ? 'متابعة' : 'Continue'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Login page ──────────────────────────────────────────────────────────

type LoginMode = 'email' | 'invite' | 'biometric' | 'mfa';

export default function Login() {
  const [, setLocation] = useLocation();
  const { login: authLogin, user, isLoading: authLoading } = useAuth();
  const { isRtl } = useLanguage();

  const hasPasskey  = hasStoredPasskey();
  const passkeyName = getPasskeyDisplayName();

  const defaultMode: LoginMode = hasPasskey ? 'biometric' : 'email';
  const [mode, setMode] = useState<LoginMode>(defaultMode);

  const [errorMsg, setErrorMsg]           = useState('');
  const [forgotOpen, setForgotOpen]       = useState(false);
  const [setupOpen, setSetupOpen]         = useState(false);
  const [bioLoading, setBioLoading]       = useState(false);
  const [inviteCode, setInviteCode]       = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [mfaCode, setMfaCode]             = useState('');
  const [mfaToken, setMfaToken]           = useState('');
  const [mfaLoading, setMfaLoading]       = useState(false);
  const [pendingTokens, setPendingTokens] = useState<{ accessToken: string; refreshToken: string; userId: string; email: string; displayName: string } | null>(null);
  const [pendingUser, setPendingUser]     = useState<any>(null);
  const [pendingRole, setPendingRole]     = useState('');

  // ── Redirect if already logged in ─────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && user) {
      if (['admin', 'owner', 'super_admin'].includes(user.role)) setLocation('/admin');
      else setLocation('/dashboard');
    }
  }, [user, authLoading, setLocation]);

  // ── Auto-trigger biometric on mount ───────────────────────────────────────
  useEffect(() => {
    if (mode === 'biometric' && hasPasskey) handleBiometric();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // ── After successful email+password login ──────────────────────────────────
  const afterEmailLogin = useCallback((data: any) => {
    // 1. 2FA required
    if (data.requiresMfa && data.mfaSessionToken) {
      setMfaToken(data.mfaSessionToken);
      setMfaCode('');
      setMode('mfa');
      return;
    }
    // 2. Offer biometric setup (first time)
    const needsSetup = !hasPasskey && passkeySupported();
    if (needsSetup) {
      setPendingUser(data.user);
      setPendingRole(data.user.role);
      setPendingTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        userId: data.user.id || data.user._id || '',
        email: data.user.email,
        displayName: data.user.displayName || data.user.fullName || data.user.email,
      });
      authLogin(data.user, { accessToken: data.accessToken, refreshToken: data.refreshToken });
      setSetupOpen(true);
    } else {
      authLogin(data.user, { accessToken: data.accessToken, refreshToken: data.refreshToken });
      doRedirect(data.user.role);
    }
  }, [hasPasskey, authLogin]); // eslint-disable-line react-hooks/exhaustive-deps

  const { mutate: loginMutate, isPending: loginPending } = useLogin({
    mutation: {
      onSuccess: afterEmailLogin,
      onError: (err: any) => {
        setErrorMsg(err?.data?.error || err?.message || 'Login failed');
      },
    },
  });

  const doRedirect = (role: string) => {
    if (['admin', 'owner', 'super_admin'].includes(role)) setLocation('/admin');
    else setLocation('/dashboard');
  };

  const onEmailSubmit = (values: z.infer<typeof loginSchema>) => {
    setErrorMsg('');
    loginMutate({ data: values });
  };

  // ── Invite code validate ───────────────────────────────────────────────────
  const handleInviteSubmit = async () => {
    const clean = inviteCode.trim().toUpperCase().replace(/\s/g, '');
    if (!clean) { setErrorMsg(isRtl ? 'أدخل كود الدعوة' : 'Enter your invite code'); return; }
    setErrorMsg('');
    setInviteLoading(true);
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
      const res  = await fetch(`${base}/api/invitations/validate-code/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || (isRtl ? 'كود غير صحيح أو منتهي الصلاحية' : 'Invalid or expired invite code'));
        return;
      }
      // Valid — go to invite acceptance page with code pre-filled
      setLocation(`/invite?code=${encodeURIComponent(clean)}`);
    } catch {
      setErrorMsg(isRtl ? 'حدث خطأ، حاول مرة أخرى' : 'Error occurred, please try again');
    } finally {
      setInviteLoading(false);
    }
  };

  // ── 2FA verify ────────────────────────────────────────────────────────────
  const handleMfaSubmit = async () => {
    const code = mfaCode.replace(/\s/g, '');
    if (code.length < 6) { setErrorMsg(isRtl ? 'أدخل الرمز المكوّن من 6 أرقام' : 'Enter the 6-digit code'); return; }
    setErrorMsg('');
    setMfaLoading(true);
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
      const res  = await fetch(`${base}/api/auth/mfa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfaSessionToken: mfaToken, code }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || (isRtl ? 'رمز خاطئ' : 'Wrong code')); return; }
      authLogin(data.user, { accessToken: data.accessToken, refreshToken: data.refreshToken });
      doRedirect(data.user.role);
    } catch {
      setErrorMsg(isRtl ? 'حدث خطأ، حاول مرة أخرى' : 'Error occurred, please try again');
    } finally {
      setMfaLoading(false);
    }
  };

  // ── Biometric verify ───────────────────────────────────────────────────────
  const handleBiometric = async () => {
    setBioLoading(true);
    setErrorMsg('');
    try {
      const ok = await verifyPasskey();
      if (!ok) throw new Error('biometric failed');
      const refreshToken = getPasskeyRefresh();
      if (!refreshToken) throw new Error('no stored refresh');
      const base = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
      const res  = await fetch(`${base}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) throw new Error('refresh failed');
      const data = await res.json();
      const meRes = await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${data.accessToken}` } });
      if (!meRes.ok) throw new Error('me failed');
      const userProfile = await meRes.json();
      authLogin(userProfile, { accessToken: data.accessToken, refreshToken: data.refreshToken });
      doRedirect(userProfile.role);
    } catch (e: any) {
      if (!String(e).includes('biometric failed')) {
        setErrorMsg(isRtl ? 'انتهت الجلسة، أعد تسجيل الدخول بكلمة المرور' : 'Session expired. Use your password.');
        setMode('email');
      } else {
        setErrorMsg('');
      }
    }
    setBioLoading(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (authLoading) return null;

  // Hide tabs during MFA challenge
  const showTabs = mode !== 'mfa';

  return (
    <div className="min-h-screen flex" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Video panel — desktop only */}
      <div className="hidden lg:block lg:w-1/2 xl:w-[55%] relative">
        <LoginVideo />
      </div>

      {/* Login panel */}
      <div className="flex-1 min-h-screen bg-background flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute top-[40%] -left-[20%] w-[60%] h-[60%] rounded-full bg-secondary/10 blur-[100px]" />
        </div>

        <header className="p-6 flex justify-between items-center relative z-10">
          <img src={`${import.meta.env.BASE_URL}logo-horizontal.png`} alt="Thanarah"
            className="h-7 object-contain lg:hidden"
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div className="hidden lg:block" />
          <LanguageSwitcher />
        </header>

        <main className="flex-1 flex items-center justify-center p-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-md"
          >
            <div className="bg-card border border-border rounded-2xl shadow-xl shadow-black/5 p-8 md:p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-medium-green to-secondary" />

              {/* Logo + title */}
              <div className="mb-6 text-center">
                <div className="flex items-center justify-center mx-auto mb-4">
                  <img src={`${import.meta.env.BASE_URL}logo-icon.png`} alt="Thanarah"
                    className="w-12 h-12 object-contain"
                    onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  {mode === 'mfa'
                    ? (isRtl ? 'التحقق الثنائي' : 'Two-Factor Verification')
                    : (isRtl ? 'تسجيل الدخول' : 'Sign in')}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {mode === 'mfa'
                    ? (isRtl ? 'أدخل رمز التحقق من تطبيق المصادقة' : 'Enter the code from your authenticator app')
                    : (isRtl ? 'سجّل دخولك للوصول إلى البوابة التقديمية.' : 'Sign in to access the presentation portal.')}
                </p>
              </div>

              {/* Mode tabs — hidden during MFA challenge */}
              {showTabs && (
                <div className="flex gap-1 mb-5 p-1 bg-muted rounded-xl">
                  <button
                    onClick={() => { setErrorMsg(''); if (hasPasskey) { setMode('biometric'); handleBiometric(); } else setMode('biometric'); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${mode === 'biometric' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    {isRtl ? 'البصمة' : 'Biometric'}
                  </button>
                  <button
                    onClick={() => { setErrorMsg(''); setMode('invite'); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${mode === 'invite' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    {isRtl ? 'كود الدعوة' : 'Invite Code'}
                  </button>
                  <button
                    onClick={() => { setErrorMsg(''); setMode('email'); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${mode === 'email' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {isRtl ? 'كلمة مرور' : 'Password'}
                  </button>
                </div>
              )}

              {/* Error */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2 text-destructive">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium">{errorMsg}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">

                {/* ── Email/password ────────────────────────────────── */}
                {mode === 'email' && (
                  <motion.div key="email" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onEmailSubmit)} className="space-y-5">
                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem>
                            <Label className="text-foreground font-medium">{isRtl ? 'البريد الإلكتروني' : 'Email'}</Label>
                            <FormControl>
                              <Input placeholder="name@example.com" className="h-12 bg-background/50" dir="ltr" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="password" render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between items-center">
                              <Label className="text-foreground font-medium">{isRtl ? 'كلمة المرور' : 'Password'}</Label>
                              <button type="button" className="text-xs text-primary font-medium hover:underline" onClick={() => setForgotOpen(true)}>
                                {isRtl ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                              </button>
                            </div>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" className="h-12 bg-background/50" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <Button type="submit"
                          className="w-full h-12 text-base font-semibold mt-2 bg-primary hover:bg-primary/90 text-primary-foreground group"
                          disabled={loginPending}>
                          {loginPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <span className="flex items-center gap-2">
                              {isRtl ? 'تسجيل الدخول' : 'Sign in'}
                              {!isRtl && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                            </span>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </motion.div>
                )}

                {/* ── Invite code ───────────────────────────────────── */}
                {mode === 'invite' && (
                  <motion.div key="invite" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/15">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <KeyRound className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{isRtl ? 'كود الدعوة' : 'Invite Code'}</p>
                        <p className="text-xs text-muted-foreground">{isRtl ? 'مثال: ABCD-1234' : 'e.g. ABCD-1234'}</p>
                      </div>
                    </div>
                    <Input
                      dir="ltr"
                      placeholder="ABCD-1234"
                      className="h-14 text-center text-xl font-mono tracking-widest uppercase bg-background/50"
                      value={inviteCode}
                      onChange={e => setInviteCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleInviteSubmit()}
                    />
                    <Button
                      onClick={handleInviteSubmit}
                      disabled={inviteLoading || !inviteCode.trim()}
                      className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {inviteLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <span className="flex items-center gap-2">
                          <ArrowRight className="w-4 h-4" />
                          {isRtl ? 'تفعيل الدعوة' : 'Activate Invite'}
                        </span>
                      )}
                    </Button>
                  </motion.div>
                )}

                {/* ── 2FA / MFA ─────────────────────────────────────── */}
                {mode === 'mfa' && (
                  <motion.div key="mfa" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="space-y-4">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <Input
                      dir="ltr"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      value={mfaCode}
                      onChange={e => { setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrorMsg(''); }}
                      className="h-16 text-center text-3xl font-mono tracking-[0.4em] bg-background/50"
                      onKeyDown={e => e.key === 'Enter' && handleMfaSubmit()}
                      autoFocus
                    />
                    <Button
                      onClick={handleMfaSubmit}
                      disabled={mfaLoading || mfaCode.length < 6}
                      className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {mfaLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" />
                          {isRtl ? 'تحقق والدخول' : 'Verify & Sign in'}
                        </span>
                      )}
                    </Button>
                    <button onClick={() => { setMode('email'); setErrorMsg(''); }}
                      className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {isRtl ? 'رجوع لتسجيل الدخول' : 'Back to sign in'}
                    </button>
                  </motion.div>
                )}

                {/* ── Biometric ─────────────────────────────────────── */}
                {mode === 'biometric' && (
                  <motion.div key="biometric" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="flex flex-col items-center gap-4 py-6">
                    {!hasPasskey ? (
                      <>
                        <div className="w-20 h-20 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center">
                          <Fingerprint className="w-9 h-9 text-muted-foreground/50" />
                        </div>
                        <div className="text-center space-y-1">
                          <p className="font-semibold text-foreground text-sm">
                            {isRtl ? 'البصمة غير مُفعَّلة' : 'Biometric not enabled'}
                          </p>
                          <p className="text-xs text-muted-foreground max-w-[220px]">
                            {isRtl ? 'سجّل دخولك بكلمة المرور أولاً لتفعيل البصمة' : 'Sign in with password first to enable biometric'}
                          </p>
                        </div>
                        <button onClick={() => { setErrorMsg(''); setMode('email'); }}
                          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
                          {isRtl ? 'تسجيل الدخول بكلمة المرور' : 'Use password instead'}
                        </button>
                      </>
                    ) : (
                      <>
                        <motion.button onClick={handleBiometric} whileTap={{ scale: 0.95 }} disabled={bioLoading}
                          className="w-20 h-20 rounded-full bg-primary/10 hover:bg-primary/20 border-2 border-primary/20 flex items-center justify-center transition-colors">
                          {bioLoading ? <Loader2 className="w-9 h-9 text-primary animate-spin" /> : <Fingerprint className="w-9 h-9 text-primary" />}
                        </motion.button>
                        <div className="text-center">
                          <p className="font-semibold text-foreground text-sm">
                            {bioLoading ? (isRtl ? 'في انتظار المصادقة…' : 'Waiting…') : (isRtl ? 'المس المستشعر أو انظر إلى الكاميرا' : 'Touch sensor or look at camera')}
                          </p>
                          {passkeyName && <p className="text-xs text-muted-foreground mt-1">{passkeyName}</p>}
                        </div>
                        <button onClick={() => { setErrorMsg(''); setMode('email'); }}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                          {isRtl ? 'استخدام كلمة المرور' : 'Use password instead'}
                        </button>
                      </>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-4">
              <a href="/visit-request" className="hover:text-primary transition-colors font-medium border-b border-transparent hover:border-primary pb-0.5">
                {isRtl ? 'طلب زيارة' : 'Request a Visit'}
              </a>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span className="opacity-60">v1.0.0</span>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Dialogs */}
      <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} />
      {pendingTokens && pendingUser && (
        <QuickAuthSetup
          open={setupOpen}
          onClose={() => { setSetupOpen(false); doRedirect(pendingRole); }}
          refreshToken={pendingTokens.refreshToken}
          userId={pendingTokens.userId}
          email={pendingTokens.email}
          displayName={pendingTokens.displayName}
        />
      )}
    </div>
  );
}
