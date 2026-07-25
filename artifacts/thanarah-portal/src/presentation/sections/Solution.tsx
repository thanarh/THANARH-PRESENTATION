/**
 * Section: Solution — ما هي ثناره؟
 * © 2026 Thanarah Team
 */
import React from 'react';
import { motion } from 'framer-motion';
import { C, ChapterBadge, FadeIn, DarkPanel, stagger, fadeUp, ThanarahIcon } from '../shared';

const COMPONENTS = [
  { ar: 'منصة العميل',        en: 'Client Platform',       icon: '👤' },
  { ar: 'نظام المنشأة',       en: 'Facility System',       icon: '🏥' },
  { ar: 'الموقع الإلكتروني',  en: 'Website Builder',       icon: '🌐' },
  { ar: 'التطبيقات',           en: 'Mobile Apps',           icon: '📱' },
  { ar: 'WhatsApp AI',        en: 'WhatsApp AI',           icon: '💬' },
  { ar: 'CRM',                 en: 'CRM',                   icon: '🤝' },
  { ar: 'ERP والمحاسبة',      en: 'ERP & Accounting',      icon: '📊' },
  { ar: 'إدارة الموظفين',     en: 'Staff Management',      icon: '👥' },
  { ar: 'التسويق والتحليل',   en: 'Marketing & Analytics', icon: '📈' },
  { ar: 'مركز التكاملات',     en: 'Integrations Hub',      icon: '🔗' },
  { ar: 'مركز الأمان',        en: 'Security Center',       icon: '🔐' },
  { ar: 'النشر والتطوير',     en: 'Deployment',            icon: '🚀' },
];

const JOURNEY = [
  { ar: 'اشترك',              en: 'Subscribe' },
  { ar: 'أدخل بياناتك',       en: 'Enter data' },
  { ar: 'خصص هويتك',          en: 'Customize' },
  { ar: 'استلم نظامك',        en: 'Receive system' },
  { ar: 'فعّل موقعك',          en: 'Launch website' },
  { ar: 'اربط واتساب',         en: 'Connect WhatsApp' },
  { ar: 'أطلق تطبيقك',        en: 'Launch app' },
  { ar: 'أدر منشأتك',          en: 'Manage' },
  { ar: 'راقب نموك',           en: 'Track growth' },
];

export default function Solution() {
  return (
    <div className="space-y-20">
      <FadeIn>
        <ChapterBadge ar="الفصل الثاني: ما هي ثناره؟" en="Chapter II — What is Thanarah?" />
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6" style={{ color: C.ink }}>
          ليست برنامج عيادة.<br />
          <span style={{ color: C.primary }}>ثناره هي البنية الرقمية الكاملة.</span>
        </h1>
        <p className="text-xl max-w-2xl" style={{ color: C.muted }}>
          Not a clinic app, not a website builder, not a booking tool.<br />
          <strong style={{ color: C.ink }}>Thanarah is the complete digital infrastructure for medical facilities.</strong>
        </p>
      </FadeIn>

      {/* Core + ecosystem */}
      <FadeIn delay={0.1}>
        <div className="flex justify-center mb-6">
          <div className="rounded-2xl px-8 py-4 flex items-center gap-3 shadow-xl"
            style={{ background: C.dark }}>
            <ThanarahIcon size={32} />
            <div>
              <div className="text-lg font-bold" style={{ color: C.white }}>Thanarah Core</div>
              <div className="text-xs" style={{ color: C.soft }}>النواة المركزية — البنية الموحدة</div>
            </div>
          </div>
        </div>
        <div className="flex justify-center mb-4">
          <div className="w-px h-8" style={{ background: C.soft }} />
        </div>
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {COMPONENTS.map(comp => (
            <motion.div key={comp.en} variants={fadeUp}
              className="rounded-xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform"
              style={{ background: C.white, border: '1px solid #E5E2DC' }}>
              <span className="text-xl shrink-0">{comp.icon}</span>
              <div>
                <div className="text-sm font-bold" style={{ color: C.ink }}>{comp.ar}</div>
                <div className="text-[10px]" style={{ color: C.muted }}>{comp.en}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </FadeIn>

      {/* Journey */}
      <FadeIn delay={0.15}>
        <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: C.ink }}>
          من الفكرة إلى منشأة طبية رقمية متكاملة
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-9 gap-3">
          {JOURNEY.map((step, i) => (
            <motion.div key={step.en}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.07 }}
              className="flex flex-col items-center gap-2 text-center">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                style={{
                  background: i === JOURNEY.length - 1 ? C.dark : C.primary,
                  color: C.white,
                }}>
                {i + 1}
              </div>
              <div className="text-xs font-bold" style={{ color: C.ink }}>{step.ar}</div>
              <div className="text-[9px]" style={{ color: C.muted }}>{step.en}</div>
            </motion.div>
          ))}
        </div>
      </FadeIn>

      {/* Statement */}
      <FadeIn delay={0.3}>
        <DarkPanel className="text-center">
          <ThanarahIcon size={40} />
          <p className="text-xl md:text-2xl font-bold mt-6 leading-relaxed" style={{ color: C.white }}>
            من الفكرة إلى منشأة طبية رقمية متكاملة<br />
            <span style={{ color: C.soft }}>داخل تجربة واحدة.</span>
          </p>
          <p className="mt-3" style={{ color: `${C.soft}aa` }}>
            From idea to fully integrated digital medical facility — inside a single experience.
          </p>
        </DarkPanel>
      </FadeIn>
    </div>
  );
}
