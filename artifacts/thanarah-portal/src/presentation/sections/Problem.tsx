/**
 * Section: Problem — المشكلة
 * © 2026 Thanarah Team
 */
import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { C, ChapterBadge, FadeIn, DarkPanel, stagger, fadeUp } from '../shared';

const SYSTEMS = [
  { ar: 'نظام الحجوزات',    en: 'Booking System' },
  { ar: 'الملفات الطبية',   en: 'Medical Records' },
  { ar: 'المحاسبة',          en: 'Accounting' },
  { ar: 'الموقع الإلكتروني',en: 'Website' },
  { ar: 'تطبيق الجوال',     en: 'Mobile App' },
  { ar: 'واتساب يدوي',      en: 'Manual WhatsApp' },
  { ar: 'إدارة الموظفين',   en: 'HR System' },
  { ar: 'نظام التسويق',     en: 'Marketing' },
  { ar: 'تقارير منفصلة',    en: 'Reports' },
  { ar: 'دعم متعدد',         en: 'Multiple Vendors' },
];

const LOSSES = [
  { ar: 'وقت الموظفين',      en: 'Staff Time',            icon: '⏱' },
  { ar: 'فقدان البيانات',    en: 'Data Loss',             icon: '💾' },
  { ar: 'حجوزات ضائعة',     en: 'Lost Bookings',         icon: '📅' },
  { ar: 'تجربة متقطعة',     en: 'Fragmented Experience', icon: '👤' },
  { ar: 'قرارات بلا صورة',  en: 'Blind Decisions',       icon: '📊' },
];

const CHAIN = [
  { ar: 'رسالة لم تُجب',  en: 'Unanswered message' },
  { ar: 'حجز لم يتم',     en: 'Missed booking' },
  { ar: 'مريض لم يأتِ',   en: 'Patient no-show' },
  { ar: 'إيراد ضائع',     en: 'Lost revenue' },
];

export default function Problem() {
  const chaosRef = useRef(null);
  const chaosInView = useInView(chaosRef, { once: true, margin: '-60px' });

  return (
    <div className="space-y-20">
      <FadeIn>
        <ChapterBadge ar="المشكلة" en="The Problem" />
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4" style={{ color: C.ink }}>
          العالم الطبي اليوم
        </h1>
        <p className="text-xl" style={{ color: C.muted }}>
          The Medical World Today — Fragmented by Default
        </p>
      </FadeIn>

      {/* Chaos visual */}
      <FadeIn delay={0.1}>
        <div className="rounded-2xl p-8 relative overflow-hidden"
          style={{ background: C.bg, border: '1px solid #E5E2DC' }}>
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl shadow-lg flex flex-col items-center justify-center"
              style={{ background: C.white, border: `2px solid ${C.soft}` }}>
              <span className="text-3xl">🏥</span>
              <span className="text-[10px] font-bold mt-1" style={{ color: C.dark }}>المنشأة</span>
            </div>
          </div>
          <motion.div
            ref={chaosRef}
            variants={stagger}
            initial="hidden"
            animate={chaosInView ? 'show' : 'hidden'}
            className="grid grid-cols-2 md:grid-cols-5 gap-3"
          >
            {SYSTEMS.map((sys, i) => (
              <motion.div key={sys.en} variants={fadeUp}
                className="rounded-xl p-3 text-center relative"
                style={{
                  background: C.white,
                  border: '1px dashed #D1C9BE',
                  transform: `rotate(${(i % 2 === 0 ? 1 : -1) * (i * 0.7)}deg)`,
                }}>
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="text-xs font-bold" style={{ color: C.ink }}>{sys.ar}</div>
                <div className="text-[9px] mt-0.5" style={{ color: C.muted }}>{sys.en}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </FadeIn>

      {/* Core statement */}
      <FadeIn delay={0.15}>
        <DarkPanel className="text-center">
          <p className="text-2xl md:text-4xl font-bold leading-tight" style={{ color: C.white }}>
            المشكلة ليست نقص الأنظمة،<br />
            <span style={{ color: C.soft }}>بل غياب المنظومة.</span>
          </p>
          <p className="mt-4" style={{ color: `${C.soft}aa` }}>
            The problem is not a lack of systems — it's the absence of an ecosystem.
          </p>
        </DarkPanel>
      </FadeIn>

      {/* Cost of fragmentation */}
      <FadeIn delay={0.1}>
        <h2 className="text-2xl font-bold mb-6" style={{ color: C.ink }}>تكلفة التشتت</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {LOSSES.map((l, i) => (
            <motion.div key={l.en}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.09 }}
              className="rounded-2xl p-5 text-center"
              style={{ background: C.white, border: '1px solid #E5E2DC' }}>
              <div className="text-3xl mb-3">{l.icon}</div>
              <div className="text-sm font-bold" style={{ color: C.ink }}>{l.ar}</div>
              <div className="text-xs mt-1" style={{ color: C.muted }}>{l.en}</div>
            </motion.div>
          ))}
        </div>
      </FadeIn>

      {/* Chain reaction */}
      <FadeIn delay={0.2}>
        <div className="rounded-2xl p-6"
          style={{ background: `${C.soft}30`, border: `1px solid ${C.soft}` }}>
          <h3 className="font-bold mb-4 text-xs uppercase tracking-widest"
            style={{ color: C.primary }}>سلسلة الخسارة — The Loss Chain</h3>
          <div className="flex flex-wrap items-center gap-3">
            {CHAIN.map((step, i) => (
              <React.Fragment key={step.en}>
                <div className="rounded-xl px-4 py-2.5 text-center shadow-sm"
                  style={{ background: C.white }}>
                  <div className="text-sm font-bold" style={{ color: C.ink }}>{step.ar}</div>
                  <div className="text-xs" style={{ color: C.muted }}>{step.en}</div>
                </div>
                {i < CHAIN.length - 1 && (
                  <span className="text-xl font-bold" style={{ color: C.primary }}>→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Pivotal question */}
      <FadeIn delay={0.3}>
        <div className="rounded-3xl py-16 px-8 text-center"
          style={{ background: C.dark }}>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            className="text-2xl md:text-4xl font-bold mb-8" style={{ color: C.white }}>
            ماذا لو لم تحتج المنشأة الطبية<br />
            إلا إلى <span style={{ color: C.soft }}>منظومة واحدة؟</span>
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-5xl md:text-8xl font-bold" style={{ color: C.soft }}>
            ثناره
          </motion.p>
        </div>
      </FadeIn>
    </div>
  );
}
