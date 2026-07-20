import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useCreateVisitRequest } from '@workspace/api-client-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Form, FormControl, FormField, FormItem, FormMessage } from '../components/ui/form';
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const visitSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email(),
  reason: z.string().min(10),
  visitorType: z.string().min(1),
});

// ─── Saudi phone input ────────────────────────────────────────────────────────
function SaudiPhoneInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div
      className="flex items-center h-11 rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 overflow-hidden"
      dir="ltr"
    >
      {/* Flag + prefix */}
      <div className="flex items-center gap-1.5 px-3 border-r border-input bg-muted/40 h-full shrink-0">
        <span className="text-base leading-none">🇸🇦</span>
        <span className="text-sm font-medium text-foreground">+966</span>
      </div>
      {/* Number field — always LTR */}
      <input
        type="tel"
        dir="ltr"
        value={value}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
          onChange(digits);
        }}
        placeholder={placeholder ?? '5X XXX XXXX'}
        className="flex-1 h-full px-3 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VisitRequest() {
  const [, setLocation] = useLocation();
  const { t, isRtl } = useLanguage();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof visitSchema>>({
    resolver: zodResolver(visitSchema),
    defaultValues: { fullName: '', phone: '', email: '', reason: '', visitorType: '' },
  });

  const { mutate: createRequest, isPending } = useCreateVisitRequest({
    mutation: { onSuccess: () => setIsSuccess(true) },
  });

  const onSubmit = (values: z.infer<typeof visitSchema>) => {
    // prepend +966
    createRequest({ data: { ...values, phone: `+966${values.phone}` } });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Decorative blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[50%] -left-[20%] w-[50%] h-[50%] rounded-full bg-secondary/8 blur-[100px]" />
      </div>

      <header className="p-6 flex justify-between items-center relative z-10">
        <button
          onClick={() => setLocation('/login')}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {t('backToLogin')}
        </button>
        <LanguageSwitcher />
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative z-10 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mx-auto mb-5">
              <img
                src={`${import.meta.env.BASE_URL}logo-icon.png`}
                alt="Thanarah"
                className="w-10 h-10 object-contain"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{t('visitRequestTitle')}</h1>
            <p className="text-muted-foreground">{t('visitRequestDesc')}</p>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-xl shadow-black/5 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-medium-green to-secondary" />

            {isSuccess ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t('requestSubmitted')}</h2>
                <p className="text-muted-foreground">{t('requestSubmittedDesc')}</p>
                <Button
                  onClick={() => setLocation('/login')}
                  variant="outline"
                  className="w-full h-12 mt-4"
                >
                  {t('returnToLogin')}
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                  {/* Full name */}
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="text-foreground font-medium">{t('fullName')}</Label>
                        <FormControl>
                          <Input placeholder={t('fullNamePlaceholder')} className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email + Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <Label className="text-foreground font-medium">{t('emailAddress')}</Label>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="name@company.com"
                              className="h-11"
                              dir="ltr"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <Label className="text-foreground font-medium">{t('phoneNumber')}</Label>
                          <FormControl>
                            <SaudiPhoneInput
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Visitor type */}
                  <FormField
                    control={form.control}
                    name="visitorType"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="text-foreground font-medium">{t('visitorType')}</Label>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder={t('visitorTypePlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="investor">{t('investor')}</SelectItem>
                            <SelectItem value="partner">{t('strategicPartner')}</SelectItem>
                            <SelectItem value="client">{t('medicalClient')}</SelectItem>
                            <SelectItem value="other">{t('other')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Reason */}
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="text-foreground font-medium">{t('reason')}</Label>
                        <FormControl>
                          <Textarea
                            placeholder={t('reasonPlaceholder')}
                            className="min-h-[100px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold mt-6 bg-primary hover:bg-primary/90 text-primary-foreground group"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        {t('submitRequest')}
                        {!isRtl && (
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        )}
                      </span>
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
