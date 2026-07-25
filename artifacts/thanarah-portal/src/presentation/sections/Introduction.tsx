/**
 * Section: Introduction — تجربة ثناره
 * © 2026 Thanarah Team
 */
import React from 'react';
import { motion } from 'framer-motion';
import { C, ChapterBadge, ThanarahIcon, FadeIn, DarkPanel, stagger, fadeUp } from '../shared';

const PILLARS = [
  { ar: 'الرعاية',   en: 'Care' },
  { ar: 'الإدارة',   en: 'Management' },
  { ar: 'الذكاء',    en: 'Intelligence' },
  { ar: 'التواصل',   en: 'Communication' },
  { ar: 'التشغيل',   en: 'Operations' },
  { ar: 'النمو',     en: 'Growth' },
];

export default function Introduction() {
  return (
    <div className="space-y-20">
      {/* Hero */}
      <FadeIn>
        <ChapterBadge ar="الفصل الأول: لماذا ثناره؟" en="Chapter I — Why Thanarah?" />
        <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6"
          style={{ color: C.ink }}>
          ثناره —<br />
          <span style={{ color: C.primary }}>مستقبل الرعاية</span><br />
          يبدأ من منظومة واحدة.
        </h1>
        <p className="text-xl md:text-2xl font-medium max-w-2xl leading-relaxed"
          style={{ color: C.muted }}>
          Thanarah — One Ecosystem for the Future of Healthcare.
        </p>
      </FadeIn>

      {/* Ecosystem visual */}
      <FadeIn delay={0.2}>
        <div className="relative flex items-center justify-center" style={{ height: 420 }}>
          {/* Orbit rings */}
          {[160, 210, 260].map(r => (
            <div key={r} className="absolute rounded-full pointer-events-none"
              style={{ width: r * 2, height: r * 2, border: `1px solid ${C.soft}35` }} />
          ))}

          {/* Core */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-2xl"
            style={{ background: C.dark }}
          >
            <ThanarahIcon size={44} />
            <span className="text-[10px] font-bold mt-1.5 tracking-widest"
              style={{ color: C.soft }}>CORE</span>
          </motion.div>

          {/* Pillars */}
          {PILLARS.map((p, i) => {
            const angle = (i * 60 - 90) * (Math.PI / 180);
            const r = 185;
            return (
              <motion.div
                key={p.en}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: Math.cos(angle) * r,
                  y: Math.sin(angle) * r,
                }}
                transition={{ duration: 1, delay: 0.4 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="absolute px-4 py-2.5 rounded-xl text-center shadow-md"
                style={{ background: C.white, border: `1px solid ${C.soft}70` }}
              >
                <div className="text-sm font-bold" style={{ color: C.primary }}>{p.ar}</div>
                <div className="text-[10px] font-medium mt-0.5" style={{ color: C.muted }}>{p.en}</div>
              </motion.div>
            );
          })}
        </div>
      </FadeIn>

      {/* Statement */}
      <FadeIn delay={0.3}>
        <DarkPanel className="text-center">
          <p className="text-2xl md:text-3xl font-bold leading-relaxed" style={{ color: C.white }}>
            حين تتكامل التقنية،<br />
            <span style={{ color: C.soft }}>تبدأ رعاية أفضل.</span>
          </p>
          <p className="mt-4 text-base" style={{ color: `${C.soft}cc` }}>
            When technology integrates, better care begins.
          </p>
        </DarkPanel>
      </FadeIn>

      {/* Pillars grid */}
      <FadeIn delay={0.1}>
        <motion.div variants={stagger} initial="hidden" animate="show"
          className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {PILLARS.map((p, i) => (
            <motion.div key={p.en} variants={fadeUp}
              className="rounded-2xl p-5 text-center border"
              style={{ background: `${C.soft}20`, borderColor: `${C.soft}60` }}>
              <div className="text-2xl font-bold mb-1" style={{ color: C.primary }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="text-base font-bold" style={{ color: C.ink }}>{p.ar}</div>
              <div className="text-xs mt-0.5" style={{ color: C.muted }}>{p.en}</div>
            </motion.div>
          ))}
        </motion.div>
      </FadeIn>
    </div>
  );
}
