import React from 'react';
import { Link } from 'wouter';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Watermark } from '../components/Watermark';
import { SessionTimer } from '../components/SessionTimer';
import { Play, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PresentationHome() {
  const { t, isRtl } = useLanguage();
  const { user } = useAuth();

  const modules = [
    { id: 'clinic', nameAr: 'العيادة الذكية', nameEn: 'Smart Clinic', color: 'bg-primary/10 text-primary border-primary/20' },
    { id: 'ai', nameAr: 'واتساب الذكاء الاصطناعي', nameEn: 'WhatsApp AI', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
    { id: 'website', nameAr: 'منشئ المواقع', nameEn: 'Website Builder', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    { id: 'apps', nameAr: 'تطبيقات الجوال', nameEn: 'Mobile Apps', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
    { id: 'crm', nameAr: 'إدارة العلاقات', nameEn: 'CRM System', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
    { id: 'erp', nameAr: 'تخطيط الموارد', nameEn: 'ERP System', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
    { id: 'security', nameAr: 'الأمان المتقدم', nameEn: 'Advanced Security', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
    { id: 'analytics', nameAr: 'التحليلات الذكية', nameEn: 'Smart Analytics', color: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <Watermark />
      <SessionTimer />
      
      {/* Header */}
      <header className="absolute top-0 w-full p-6 z-20 flex justify-between items-center">
        <Link href="/dashboard">
          <button className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors bg-card/50 backdrop-blur px-4 py-2 rounded-full border border-border">
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {t('dashboard')}
          </button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        
        {/* Animated Orbiting Ecosystem */}
        <div className="relative w-full max-w-2xl aspect-square max-h-[60vh] mb-12 flex items-center justify-center">
          
          {/* Central Logo */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-32 h-32 md:w-48 md:h-48 bg-card rounded-full shadow-2xl flex items-center justify-center z-20 border border-border"
          >
            <img src="/logo-icon.png" alt="Thanarah" className="w-16 h-16 md:w-24 md:h-24 object-contain dark:invert" onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<span class="text-3xl font-bold text-primary">T</span>');
            }} />
          </motion.div>

          {/* Orbit Rings */}
          <div className="absolute inset-0 border border-muted-foreground/10 rounded-full scale-[0.6]" />
          <div className="absolute inset-0 border border-muted-foreground/10 rounded-full scale-[0.8]" />
          <div className="absolute inset-0 border border-muted-foreground/10 rounded-full scale-[1.0]" />

          {/* Orbiting Modules */}
          {modules.map((mod, i) => {
            const angle = (i * (360 / modules.length)) * (Math.PI / 180);
            const radius = 140 + (i % 2 === 0 ? 0 : 60); // Stagger distances
            const delay = i * 0.1;
            
            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, x: 0, y: 0 }}
                animate={{ 
                  opacity: 1,
                  x: Math.cos(angle) * radius,
                  y: Math.sin(angle) * radius
                }}
                transition={{ duration: 1, delay, ease: "easeOut" }}
                className={`absolute w-32 px-3 py-2 rounded-xl border text-center text-xs font-bold shadow-sm backdrop-blur-md z-10 ${mod.color}`}
              >
                {isRtl ? mod.nameAr : mod.nameEn}
              </motion.div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          className="text-center max-w-lg mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            {isRtl ? 'نظام ثناره الطبي الشامل' : 'Thanarah Unified Medical System'}
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            {isRtl 
              ? 'مستقبل إدارة الرعاية الصحية في منصة واحدة متكاملة.' 
              : 'The future of healthcare management in one integrated platform.'}
          </p>
          
          <Link href="/presentation/introduction">
            <button className="h-14 px-10 rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-3 mx-auto">
              <Play className="w-5 h-5 fill-current" />
              {t('startPresentation')}
            </button>
          </Link>
        </motion.div>

      </main>

      {/* Decorative background gradient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
      </div>
    </div>
  );
}
