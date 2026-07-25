import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '../context/LanguageContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormMessage } from '../components/ui/form';
import { Loader2, ArrowRight, Mail, User, ShieldCheck, AlertCircle, KeyRound, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Saudi phone input ────────────────────────────────────────────────────────

function SaudiPhoneInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className="flex items-center h-11 rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 overflow-hidden"
      dir="ltr"
    >
      <div className="flex items-center gap-1.5 px-3 border-r border-input bg-muted/40 h-full shrink-0">
        <span className="text-base leading-none">🇸🇦</span>
        <span className="text-sm font-medium text-foreground">+966</span>
      </div>
      <input
        type="tel"
        dir="ltr"
        inputMode="numeric"
        value={value}
        onChange={e => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
          onChange(digits);
        }}
        placeholder="5X XXX XXXX"
        className="flex-1 h-full px-3 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

// ─── Step 1: enter code ──────────────────────────────────────────────────────

const codeSchema = z.object({
  code: z.string().min(4, 'الكود قصير جداً').max(20),
});

// ─── Step 2: set password + phone ────────────────────────────────────────────

const acceptSchema = z.object({
  phone: z
    .string()
    .min(9, 'رقم الجوال يجب أن يكون 9 أرقام')
    .max(9, 'رقم الجوال يجب أن يكون 9 أرقام')
    .regex(/^5\d{8}$/, 'رقم الجوال يجب أن يبدأ بـ 5'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  confirmPassword: z.string(),
  acceptedTerms: z.boolean().refine(val => val === true, {
    message: 'يجب الموافقة على اتفاقية السرية',
  }),
}).refine(d => d.password === d.confirmPassword, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirmPassword'],
});

type InviteInfo = {
  inviteCode: string;
  inviteeName: string;
  email: string;
  role: string;
  expiresAt: string;
  inviterName: string;
};

export default function InviteAccept() {
  const [, setLocation] = useLocation();
  const { isRtl } = useLanguage();

  const [step, setStep] = useState<'code' | 'password'>('code');
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [acceptError, setAcceptError] = useState('');
  const [acceptLoading, setAcceptLoading] = useState(false);

  // ── Step 1 form ──
  const codeForm = useForm<z.infer<typeof codeSchema>>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' },
  });

  const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

  const onValidateCode = async (values: z.infer<typeof codeSchema>) => {
    setCodeError('');
    setCodeLoading(true);
    try {
      const clean = values.code.toUpperCase().replace(/\s/g, '');
      const res = await fetch(`${apiBase}/api/invitations/validate-code/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok) {
        setCodeError(data.error || 'كود غير صحيح');
        return;
      }
      setInvite(data as InviteInfo);
      setStep('password');
    } catch {
      setCodeError('حدث خطأ، حاول مرة أخرى');
    } finally {
      setCodeLoading(false);
    }
  };

  // ── Step 2 form ──
  const acceptForm = useForm<z.infer<typeof acceptSchema>>({
    resolver: zodResolver(acceptSchema),
    defaultValues: { phone: '', password: '', confirmPassword: '', acceptedTerms: false },
  });

  const onAccept = async (values: z.infer<typeof acceptSchema>) => {
    if (!invite) return;
    setAcceptError('');
    setAcceptLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/invitations/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode: invite.inviteCode,
          password: values.password,
          acceptedTerms: values.acceptedTerms,
          phone: `+966${values.phone}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAcceptError(data.error || 'حدث خطأ، حاول مرة أخرى');
        return;
      }
      setLocation('/login');
    } catch {
      setAcceptError('حدث خطأ، حاول مرة أخرى');
    } finally {
      setAcceptLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden"
      dir="rtl"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <AnimatePresence mode="wait">
        {step === 'code' ? (
          <motion.div
            key="step-code"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            className="w-full max-w-md relative z-10"
          >
            {/* Logo / brand */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <img
                  src="/logo-icon.png"
                  alt="Thanarah"
                  className="w-8 h-8 dark:invert"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1">أهلاً بك في ثناره</h1>
              <p className="text-muted-foreground text-sm">أدخل كود الدعوة الذي وصلك على بريدك الإلكتروني</p>
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-xl shadow-black/5 p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary rounded-t-2xl" />

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <KeyRound className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">كود الدعوة</p>
                  <p className="text-xs text-muted-foreground">مثال: ABCD-1234</p>
                </div>
              </div>

              {codeError && (
                <div className="mb-5 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{codeError}</p>
                </div>
              )}

              <Form {...codeForm}>
                <form onSubmit={codeForm.handleSubmit(onValidateCode)} className="space-y-4">
                  <FormField
                    control={codeForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="text-foreground font-medium">كود الدعوة</Label>
                        <FormControl>
                          <Input
                            placeholder="ABCD-1234"
                            className="h-12 text-center text-xl font-mono tracking-widest uppercase"
                            {...field}
                            onChange={e => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={codeLoading}
                  >
                    {codeLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4" />
                        التحقق من الكود
                      </span>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step-password"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            className="w-full max-w-md relative z-10"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <img
                  src="/logo-icon.png"
                  alt="Thanarah"
                  className="w-8 h-8 dark:invert"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1">مرحباً {invite?.inviteeName}</h1>
              <p className="text-muted-foreground text-sm">تمت الدعوة من قِبل {invite?.inviterName}</p>
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-xl shadow-black/5 p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary rounded-t-2xl" />

              {/* Invite info */}
              <div className="mb-6 p-4 bg-muted/50 rounded-xl space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{invite?.inviteeName}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{invite?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="text-primary font-medium capitalize">{invite?.role} Access</span>
                </div>
              </div>

              {acceptError && (
                <div className="mb-5 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{acceptError}</p>
                </div>
              )}

              <Form {...acceptForm}>
                <form onSubmit={acceptForm.handleSubmit(onAccept)} className="space-y-4">
                  {/* Phone */}
                  <FormField
                    control={acceptForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="text-foreground font-medium flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          رقم الجوال
                        </Label>
                        <FormControl>
                          <SaudiPhoneInput value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Password */}
                  <FormField
                    control={acceptForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="text-foreground font-medium">كلمة المرور</Label>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={acceptForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="text-foreground font-medium">تأكيد كلمة المرور</Label>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={acceptForm.control}
                    name="acceptedTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start gap-3 rounded-xl border p-4 mt-4 bg-background">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <Label className="font-semibold text-sm">اتفاقية السرية</Label>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            أقر بأن المعلومات المقدمة في هذه البوابة سرية وخاصة بثناره، وأتعهد بعدم مشاركتها أو نسخها أو توزيعها.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  {acceptForm.formState.errors.acceptedTerms && (
                    <p className="text-sm font-medium text-destructive">
                      {acceptForm.formState.errors.acceptedTerms.message}
                    </p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-12"
                      onClick={() => { setStep('code'); setAcceptError(''); }}
                    >
                      رجوع
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={acceptLoading}
                    >
                      {acceptLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        'قبول الدعوة'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
