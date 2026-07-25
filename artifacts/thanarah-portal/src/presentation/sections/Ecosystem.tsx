/**
 * Section: Ecosystem — منظومة ثناره التفاعلية
 * © 2026 Thanarah Team
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C, ChapterBadge, FadeIn, ThanarahIcon } from '../shared';

const MODULES = [
  { id: 'client',   ar: 'منصة العميل',       en: 'Client Platform',    icon: '👤', angle: -90,
    desc: 'بوابة العرض التقديمي الآمنة. دعوات شخصية، صلاحيات دقيقة، علامات مائية جنائية.' },
  { id: 'clinic',   ar: 'نظام المنشأة',      en: 'Facility System',    icon: '🏥', angle: -30,
    desc: 'نظام تشغيل طبي شامل: مواعيد، ملفات مرضى، أطباء، فواتير، مخزون، تأمين.' },
  { id: 'website',  ar: 'الموقع الإلكتروني', en: 'Website Builder',    icon: '🌐', angle: 30,
    desc: 'بناء مواقع طبية ذكية بالذكاء الاصطناعي. نشر فوري، دومين خاص، SSL، ربط حجوزات.' },
  { id: 'app',      ar: 'التطبيقات',          en: 'Mobile Apps',        icon: '📱', angle: 90,
    desc: 'iOS وAndroid وPWA. تطبيق مستقل لكل منشأة بهويتها الخاصة، دون برمجة منفصلة.' },
  { id: 'whatsapp', ar: 'WhatsApp AI',       en: 'WhatsApp AI',        icon: '💬', angle: 150,
    desc: 'مساعد ذكي يحجز، يردّ، ويتابع 24/7. ضوابط صارمة: لا تشخيص، لا وصف علاج.' },
  { id: 'ai',       ar: 'الذكاء الاصطناعي',  en: 'AI Engine',          icon: '🧠', angle: 210,
    desc: 'طبقة ذكاء اصطناعي مدمجة في كل الأنظمة: تحليل، اقتراح، أتمتة، تحسين مستمر.' },
];

export default function Ecosystem() {
  const [active, setActive] = useState<string | null>(null);
  const activeModule = MODULES.find(m => m.id === active);

  return (
    <div className="space-y-16">
      <FadeIn>
        <ChapterBadge ar="منظومة ثناره" en="Thanarah Ecosystem" />
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4" style={{ color: C.ink }}>
          كوكب رقمي متكامل
        </h1>
        <p className="text-xl" style={{ color: C.muted }}>
          اضغط على أي وحدة لاستكشافها — Tap any module to explore it.
        </p>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="relative flex items-center justify-center" style={{ height: 500 }}>
          {/* Orbit rings */}
          {[170, 200, 230].map(r => (
            <div key={r} className="absolute rounded-full pointer-events-none"
              style={{ width: r * 2, height: r * 2, border: `1px solid ${C.soft}28` }} />
          ))}

          {/* Core button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActive(null)}
            className="absolute z-20 w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-2xl"
            style={{ background: C.dark }}>
            <ThanarahIcon size={38} />
            <span className="text-[9px] font-bold mt-1.5 tracking-widest" style={{ color: C.soft }}>CORE</span>
          </motion.button>

          {/* Module buttons */}
          {MODULES.map((mod, i) => {
            const rad = mod.angle * (Math.PI / 180);
            const r = 190;
            const isActive = active === mod.id;
            return (
              <motion.button
                key={mod.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1, x: Math.cos(rad) * r, y: Math.sin(rad) * r }}
                transition={{ duration: 0.9, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActive(isActive ? null : mod.id)}
                className="absolute w-28 rounded-2xl py-3 px-2 text-center shadow-md"
                style={{
                  background: isActive ? C.primary : C.white,
                  border: `2px solid ${isActive ? C.primary : `${C.soft}60`}`,
                  color: isActive ? C.white : C.ink,
                  zIndex: 10,
                }}>
                <div className="text-2xl mb-1">{mod.icon}</div>
                <div className="text-xs font-bold leading-tight">{mod.ar}</div>
                <div className="text-[9px] mt-0.5" style={{ color: isActive ? C.soft : C.muted }}>{mod.en}</div>
              </motion.button>
            );
          })}
        </div>
      </FadeIn>

      {/* Detail panel */}
      <AnimatePresence mode="wait">
        {activeModule ? (
          <motion.div
            key={activeModule.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl p-6 flex items-start gap-4"
            style={{ background: C.dark }}>
            <span className="text-4xl shrink-0">{activeModule.icon}</span>
            <div>
              <h3 className="text-xl font-bold mb-1" style={{ color: C.white }}>{activeModule.ar}</h3>
              <p className="text-sm font-medium" style={{ color: C.soft }}>{activeModule.en}</p>
              <p className="text-base mt-3 leading-relaxed" style={{ color: `${C.white}dd` }}>{activeModule.desc}</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-4 text-sm"
            style={{ color: C.muted }}>
            اضغط على أي وحدة لعرض تفاصيلها — Click any module above
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
