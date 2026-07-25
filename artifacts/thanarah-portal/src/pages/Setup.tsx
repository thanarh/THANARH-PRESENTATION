import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useSetupOwner } from '@workspace/api-client-react';
import { useLanguage } from '../context/LanguageContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Form, FormControl, FormField, FormItem, FormMessage } from '../components/ui/form';
import { Loader2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const setupSchema = z.object({
  setupKey: z.string().min(1, 'Setup key is required'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Setup() {
  const [location, setLocation] = useLocation();
  const { t, isRtl } = useLanguage();
  const [errorMsg, setErrorMsg] = useState('');

  const form = useForm<z.infer<typeof setupSchema>>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      setupKey: '',
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const { mutate: setup, isPending } = useSetupOwner({
    mutation: {
      onSuccess: () => {
        setLocation('/login');
      },
      onError: (err: any) => {
        setErrorMsg(err.error || 'Setup failed. The key may be invalid or already used.');
      }
    }
  });

  const onSubmit = (values: z.infer<typeof setupSchema>) => {
    setErrorMsg('');
    const { confirmPassword, ...data } = values;
    setup({ data });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
            <ShieldCheck className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Initial System Setup</h1>
          <p className="text-muted-foreground">Create the master owner account. This can only be done once.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-xl shadow-black/5 p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
          
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
                name="setupKey"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-foreground font-medium">Setup Key</Label>
                    <FormControl>
                      <Input type="password" placeholder="Provided by system administrator" className="h-11 font-mono text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-foreground font-medium">Full Name</Label>
                    <FormControl>
                      <Input placeholder="John Doe" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-foreground font-medium">Email Address</Label>
                    <FormControl>
                      <Input placeholder="admin@thanarah.com" className="h-11" {...field} />
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
                    <Label className="text-foreground font-medium">Master Password (min 12 chars)</Label>
                    <FormControl>
                      <Input type="password" placeholder="••••••••••••" className="h-11" {...field} />
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
                      <Input type="password" placeholder="••••••••••••" className="h-11" {...field} />
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
                    Initialize System
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
