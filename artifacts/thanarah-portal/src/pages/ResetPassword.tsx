import React, { useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useResetPassword } from '@workspace/api-client-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Form, FormControl, FormField, FormItem, FormMessage } from '../components/ui/form';
import { Loader2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const resetSchema = z.object({
  password: z.string().min(8),
  confirm: z.string().min(8),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { t, isRtl } = useLanguage();
  const search = useSearch();
  const token = new URLSearchParams(search).get('token') ?? '';
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirm: '' },
  });

  const { mutate: reset, isPending } = useResetPassword({
    mutation: {
      onSuccess: () => setSuccess(true),
      onError: (err: any) => setErrorMsg(err.error || t('invalidOrExpiredToken')),
    },
  });

  const onSubmit = (values: z.infer<typeof resetSchema>) => {
    setErrorMsg('');
    reset({ data: { token, password: values.password } });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Decorative blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <header className="p-6 flex justify-end items-center relative z-10">
        <LanguageSwitcher />
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="bg-card border border-border rounded-2xl shadow-xl shadow-black/5 p-8 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-medium-green to-secondary" />

            {success ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t('passwordResetSuccess')}</h2>
                <Button
                  className="w-full h-12 mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => setLocation('/login')}
                >
                  {t('login')}
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-8 text-center">
                  <div className="flex items-center justify-center mx-auto mb-5">
                    <ShieldCheck className="w-10 h-10 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">{t('resetPasswordTitle')}</h1>
                </div>

                {errorMsg && (
                  <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{errorMsg}</p>
                  </div>
                )}

                {!token && (
                  <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{t('invalidOrExpiredToken')}</p>
                  </div>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <Label className="font-medium">{t('newPassword')}</Label>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" className="h-12 bg-background/50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirm"
                      render={({ field }) => (
                        <FormItem>
                          <Label className="font-medium">{t('confirmPassword')}</Label>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" className="h-12 bg-background/50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={isPending || !token}
                    >
                      {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : t('resetPassword')}
                    </Button>
                  </form>
                </Form>
              </>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
