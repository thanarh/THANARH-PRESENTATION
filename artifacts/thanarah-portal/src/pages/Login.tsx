import React, { useState, useRef, useEffect } from 'react';
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '../components/ui/dialog';
import { Loader2, ArrowRight, AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// ─── Side video panel ─────────────────────────────────────────────────────────
function LoginVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = 2;
    v.play().catch(() => {});
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0d1f15]">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        className="absolute inset-0 w-full h-full object-cover"
        onLoadedMetadata={(e) => {
          (e.currentTarget as HTMLVideoElement).playbackRate = 2;
        }}
      >
        <source src={`${import.meta.env.BASE_URL}login-demo.webm`} type="video/webm" />
        <source src={`${import.meta.env.BASE_URL}login-demo.mov`} type="video/quicktime" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/60" />
      <div className="absolute bottom-8 left-8 z-10">
        <img
          src={`${import.meta.env.BASE_URL}logo-horizontal.png`}
          alt="Thanarah"
          className="h-7 object-contain opacity-80 brightness-0 invert"
        />
      </div>
    </div>
  );
}

// ─── Forgot-password dialog ───────────────────────────────────────────────────
function ForgotPasswordDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t, isRtl } = useLanguage();
  const [sent, setSent] = useState(false);

  const form = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const { mutate: forgot, isPending } = useForgotPassword({
    mutation: {
      onSuccess: () => setSent(true),
    },
  });

  const onSubmit = (values: z.infer<typeof forgotSchema>) => {
    forgot({ data: { email: values.email } });
  };

  // reset state when re-opened
  useEffect(() => {
    if (open) { setSent(false); form.reset(); }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="max-w-md"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {t('forgotPasswordTitle')}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t('forgotPasswordDesc')}
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
            <p className="font-semibold text-foreground">{t('resetLinkSent')}</p>
            <p className="text-sm text-muted-foreground">{t('resetLinkSentDesc')}</p>
            <Button variant="outline" className="w-full h-11 mt-2" onClick={onClose}>
              {t('cancel')}
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Label className="font-medium">{t('email')}</Label>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="name@example.com"
                          className="h-11 ps-9"
                          dir="ltr"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={onClose}
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={isPending}
                >
                  {isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : t('sendResetLink')}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Login page ──────────────────────────────────────────────────────────
export default function Login() {
  const [, setLocation] = useLocation();
  const { login: authLogin } = useAuth();
  const { t, isRtl } = useLanguage();
  const [errorMsg, setErrorMsg] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const { mutate: login, isPending } = useLogin({
    mutation: {
      onSuccess: (data: any) => {
        authLogin(data.user);
        if (['admin', 'owner', 'superadmin'].includes(data.user.role)) {
          setLocation('/admin');
        } else {
          setLocation('/dashboard');
        }
      },
      onError: (err: any) => {
        setErrorMsg(err.error || 'Login failed');
      },
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    setErrorMsg('');
    login({ data: values });
  };

  return (
    <div className="min-h-screen flex" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Video panel — desktop only ── */}
      <div className="hidden lg:block lg:w-1/2 xl:w-[55%] relative">
        <LoginVideo />
      </div>

      {/* ── Login panel ── */}
      <div className="flex-1 min-h-screen bg-background flex flex-col relative overflow-hidden">

        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute top-[40%] -left-[20%] w-[60%] h-[60%] rounded-full bg-secondary/10 blur-[100px]" />
        </div>

        {/* Header */}
        <header className="p-6 flex justify-between items-center relative z-10">
          <img
            src={`${import.meta.env.BASE_URL}logo-horizontal.png`}
            alt="Thanarah"
            className="h-7 object-contain lg:hidden"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="hidden lg:block" />
          <LanguageSwitcher />
        </header>

        {/* Form */}
        <main className="flex-1 flex items-center justify-center p-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-md"
          >
            <div className="bg-card border border-border rounded-2xl shadow-xl shadow-black/5 p-8 md:p-10 relative overflow-hidden">
              {/* accent line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-medium-green to-secondary" />

              {/* Logo icon — no background wrapper */}
              <div className="mb-8 text-center">
                <div className="flex items-center justify-center mx-auto mb-6">
                  <img
                    src={`${import.meta.env.BASE_URL}logo-icon.png`}
                    alt="Thanarah"
                    className="w-12 h-12 object-contain"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">{t('login')}</h1>
                <p className="text-muted-foreground text-sm">
                  {isRtl
                    ? 'سجّل دخولك للوصول إلى البوابة التقديمية.'
                    : 'Sign in to access the presentation portal.'}
                </p>
              </div>

              {errorMsg && (
                <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{errorMsg}</p>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="text-foreground font-medium">{t('email')}</Label>
                        <FormControl>
                          <Input
                            placeholder="name@example.com"
                            className="h-12 bg-background/50"
                            dir="ltr"
                            data-testid="input-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <Label className="text-foreground font-medium">{t('password')}</Label>
                          <button
                            type="button"
                            className="text-xs text-primary font-medium hover:underline"
                            onClick={() => setForgotOpen(true)}
                          >
                            {t('forgotPassword')}
                          </button>
                        </div>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="h-12 bg-background/50"
                            data-testid="input-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold mt-4 bg-primary hover:bg-primary/90 text-primary-foreground group"
                    disabled={isPending}
                    data-testid="button-submit-login"
                  >
                    {isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        {t('login')}
                        {!isRtl && (
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        )}
                      </span>
                    )}
                  </Button>
                </form>
              </Form>
            </div>

            <div className="mt-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-4">
              <a
                href="/visit-request"
                className="hover:text-primary transition-colors font-medium border-b border-transparent hover:border-primary pb-0.5"
              >
                {t('visitRequest')}
              </a>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span className="opacity-60">v1.0.0</span>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Forgot password dialog */}
      <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
}
