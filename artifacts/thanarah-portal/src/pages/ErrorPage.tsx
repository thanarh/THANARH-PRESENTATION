import React from 'react';
import { useLocation } from 'wouter';
import { ShieldAlert, Clock, Ban, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';

export default function ErrorPage({ type }: { type: 'expired' | 'revoked' | 'denied' }) {
  const [, setLocation] = useLocation();

  const content = {
    expired: {
      icon: Clock,
      title: 'Invitation Expired',
      description: 'Your invitation link has expired. Please contact the administrator to request a new invitation.',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    },
    revoked: {
      icon: Ban,
      title: 'Access Revoked',
      description: 'Your invitation to the portal has been revoked by the administrator.',
      color: 'text-destructive',
      bg: 'bg-destructive/10'
    },
    denied: {
      icon: ShieldAlert,
      title: 'Access Denied',
      description: 'You do not have permission to view this content or perform this action.',
      color: 'text-destructive',
      bg: 'bg-destructive/10'
    }
  };

  const { icon: Icon, title, description, color, bg } = content[type];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-card border border-border rounded-2xl p-8 md:p-10 text-center shadow-xl shadow-black/5"
      >
        <div className={`w-20 h-20 rounded-full ${bg} flex items-center justify-center mx-auto mb-6`}>
          <Icon className={`w-10 h-10 ${color}`} />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">{title}</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          {description}
        </p>
        <Button 
          onClick={() => setLocation('/login')} 
          variant="outline" 
          className="w-full h-12 flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Login
        </Button>
      </motion.div>
    </div>
  );
}
