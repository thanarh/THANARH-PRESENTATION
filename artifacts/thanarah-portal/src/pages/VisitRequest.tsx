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
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(8, 'Valid phone number required'),
  email: z.string().email('Invalid email address'),
  reason: z.string().min(10, 'Please provide more details about your visit'),
  visitorType: z.string().min(1, 'Please select a visitor type'),
});

export default function VisitRequest() {
  const [, setLocation] = useLocation();
  const { t, isRtl } = useLanguage();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof visitSchema>>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      reason: '',
      visitorType: '',
    },
  });

  const { mutate: createRequest, isPending } = useCreateVisitRequest({
    mutation: {
      onSuccess: () => {
        setIsSuccess(true);
      }
    }
  });

  const onSubmit = (values: z.infer<typeof visitSchema>) => {
    createRequest({ data: values });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <header className="p-6 flex justify-between items-center relative z-10">
        <button onClick={() => setLocation('/login')} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          Back to Login
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Request Access</h1>
            <p className="text-muted-foreground">Submit a request to visit the Thanarah Presentation Portal.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-xl shadow-black/5 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
            
            {isSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Request Submitted</h2>
                <p className="text-muted-foreground mb-8">
                  Your visit request has been successfully submitted. Our team will review your application and contact you soon.
                </p>
                <Button onClick={() => setLocation('/login')} variant="outline" className="w-full h-12">
                  Return to Login
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <Label className="text-foreground font-medium">Email Address</Label>
                          <FormControl>
                            <Input type="email" placeholder="name@company.com" className="h-11" {...field} />
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
                          <Label className="text-foreground font-medium">Phone Number</Label>
                          <FormControl>
                            <Input placeholder="+1 234 567 8900" className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="visitorType"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="text-foreground font-medium">I am a...</Label>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select visitor type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="investor">Potential Investor</SelectItem>
                            <SelectItem value="partner">Strategic Partner</SelectItem>
                            <SelectItem value="client">Medical Client (Clinic/Hospital)</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="text-foreground font-medium">Reason for Visit</Label>
                        <FormControl>
                          <Textarea 
                            placeholder="Please tell us why you'd like to view the presentation portal..." 
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
                        Submit Request
                        {!isRtl && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
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
