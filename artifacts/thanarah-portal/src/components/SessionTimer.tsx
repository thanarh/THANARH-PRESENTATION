import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLogout } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SessionTimer() {
  const { user, logout: authLogout } = useAuth();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const { mutate: performLogout } = useLogout();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user?.sessionExpiresAt) return;

    const expiresAt = new Date(user.sessionExpiresAt).getTime();
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        performLogout(undefined, {
          onSettled: () => {
            authLogout();
            setLocation('/login');
          }
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [user, performLogout, authLogout, setLocation]);

  if (!user || timeLeft === null) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft < 300; // Less than 5 minutes

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-md border ${
          isWarning 
            ? 'bg-destructive/10 border-destructive/20 text-destructive' 
            : 'bg-card/80 border-border text-muted-foreground'
        } z-[999]`}
      >
        <Clock className="w-4 h-4" />
        <span className="font-mono text-sm font-medium">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
