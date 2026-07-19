import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useValidateInvitationToken, useAcceptInvitation } from '@workspace/api-client-react';
import { useLanguage } from '../context/LanguageContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormMessage } from '../components/ui/form';
import { Loader2, ArrowRight, Mail, User, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const acceptSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  acceptedTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the confidentiality agreement"
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function InviteAccept() {
  const { token } = useParams();
  const [, setLocation] = useLocation();
  const { isRtl } = useLanguage();
  const [errorMsg, setErrorMsg] = useState('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: validation, isLoading, isError } = useValidateInvitationToken(token || '', { query: { enabled: !!token, retry: false } as any });

  const form = useForm<z.infer<typeof acceptSchema>>({
    resolver: zodResolver(acceptSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
      acceptedTerms: false,
    },
  });

  const { mutate: acceptInvite, isPending } = useAcceptInvitation({
    mutation: {
      onSuccess: () => {
        setLocation('/login');
      },
      onError: (err: any) => {
        setErrorMsg(err.error || 'Failed to accept invitation');
      }
    }
  });

  const onSubmit = (values: z.infer<typeof acceptSchema>) => {
    if (!token) return;
    setErrorMsg('');
    acceptInvite({ 
      data: { 
        token, 
        password: values.password, 
        acceptedTerms: values.acceptedTerms 
      } 
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !validation) {
    setLocation('/invite/expired');
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <img src="/logo-icon.png" alt="Thanarah" className="w-8 h-8 dark:invert" onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Welcome to Thanarah</h1>
          <p className="text-muted-foreground">Please set up your account to access the portal.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-xl shadow-black/5 p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />

          {/* Invitation Details */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{validation.inviteeName}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{validation.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-primary font-medium capitalize">{validation.role} Access</span>
            </div>
          </div>
          
          {errorMsg && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-foreground font-medium">Create Password</Label>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-foreground font-medium">Confirm Password</Label>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="acceptedTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-6 bg-background">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className={isRtl ? 'ml-3' : ''}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <Label className="font-semibold text-sm">Confidentiality Agreement</Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        I acknowledge that the information presented in this portal is strictly confidential and proprietary to Thanarah. I agree not to share, copy, or distribute this information.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              {form.formState.errors.acceptedTerms && (
                <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.acceptedTerms.message}</p>
              )}
              
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold mt-6 bg-primary hover:bg-primary/90 text-primary-foreground group"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Accept & Continue
                    {!isRtl && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                  </span>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </motion.div>
    </div>
  );
}
