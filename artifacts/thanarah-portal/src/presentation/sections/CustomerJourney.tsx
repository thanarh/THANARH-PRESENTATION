/**
 * Section: Customer Journey — رحلة العميل
 * © 2026 Thanarah Team
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { C, ChapterBadge, FadeIn, DarkPanel, stagger, fadeUp } from '../shared';

const STEPS = [
  { ar: 'اكتشاف ثناره',          en: 'Discover',          icon: '🔍', desc: 'الموقع الرسمي — التعريف، الباقات، طلب عرض' },
  { ar: 'اختيار الباقة',          en: 'Choose Plan',       icon: '📦', desc: 'Lite / Pro / Infinity / Custom' },
  { ar: 'إضافة الإضافات',         en: 'Add-ons',           icon: '🛍', desc: 'تطبيق، بريد، تكاملات، WhatsApp AI' },
  { ar: 'الدفع (جيديا)',           en: 'Payment',           icon: '💳', desc: 'بوابة دفع آمنة — لا يُحفظ رقم البطاقة' },
  { ar: 'تشغيل آلي فوري',         en: 'Auto Provisioning', icon: '⚙️', desc: 'Tenant، Subdomain، هوية، DB، موقع' },
  { ar: 'لوحة تحكم متكاملة',      en: 'Dashboard Ready',   icon: '📊', desc: 'كل أنظمة المنشأة في مكان واحد' },
];

const PLANS = [
  { name: 'Lite',     color: C.soft,    textColor: C.dark,
    features: ['نظام عيادة أساسي', 'موقع إلكتروني', 'حجوزات', 'دعم أساسي'] },
  { name: 'Pro',      color: C.primary, textColor: C.white,
    features: ['كل Lite +', 'فروع متعددة', 'WhatsApp AI', 'تقارير متقدمة', 'تطبيق مريض'] },
  { name: 'Infinity', color: C.dark,    textColor: C.white,
    features: ['كل Pro +', 'AI Autopilot', 'تطبيق مخصص', 'ERP كامل', 'تكاملات مفتوحة'] },
  { name: 'Custom',   color: '#6D28D9', textColor: C.white,
    features: ['باقة مؤسسية', 'مستشفيات وسلاسل', 'تخصيص كامل', 'SLA مضمون'] },
];

const PROVISION_STEPS = [
  'إنشاء حساب المنشأة', 'تخصيص Tenant', 'إنشاء Subdomain',
  'ربط الهوية', 'تهيئة قاعدة البيانات', 'تجهيز الموقع',
  'تفعيل النظام الطبي', 'إعداد البريد', 'تسليم النظام',
];

export default function CustomerJourney() {
  const [activePlan, setActivePlan] = useState(1);

  return (
    <div className="space-y-20">
      <FadeIn>
        <ChapterBadge ar="الفصل الرابع: رحلة العميل" en="Chapter IV — Customer Journey" />
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4" style={{ color: C.ink }}>
          من الاكتشاف إلى التشغيل
        </h1>
        <p className="text-xl" style={{ color: C.muted }}>
          From discovery to a fully operational digital medical facility — seamlessly.
        </p>
      </FadeIn>

      {/* Journey steps */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {STEPS.map((step, i) => (
            <motion.div key={step.en}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex flex-col items-center text-center gap-2">
              <div className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center shadow-md"
                style={{
                  background: i === STEPS.length - 1 ? C.dark : C.white,
                  border: `2px solid ${C.soft}70`,
                }}>
                <span className="text-2xl">{step.icon}</span>
                <span className="text-[9px] font-bold mt-1 px-1"
                  style={{ color: i === STEPS.length - 1 ? C.white : C.ink }}>{step.ar}</span>
              </div>
              <div className="text-[9px]" style={{ color: C.muted }}>{step.desc}</div>
            </motion.div>
          ))}
        </div>
      </FadeIn>

      {/* Plans */}
      <FadeIn delay={0.1}>
        <h2 className="text-2xl font-bold mb-6" style={{ color: C.ink }}>الباقات — Plans</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PLANS.map((plan, i) => (
            <motion.button key={plan.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActivePlan(i)}
              className="rounded-2xl p-5 text-right transition-all"
              style={{
                background: activePlan === i ? plan.color : C.white,
                border: `2px solid ${activePlan === i ? plan.color : '#E5E2DC'}`,
                color: activePlan === i ? plan.textColor : C.ink,
              }}>
              <div className="text-xl font-bold mb-3">{plan.name}</div>
              <ul className="space-y-1.5">
                {plan.features.map(f => (
                  <li key={f} className="text-xs flex items-center gap-1.5">
                    <span style={{ color: activePlan === i ? C.soft : C.primary }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </motion.button>
          ))}
        </div>
      </FadeIn>

      {/* Auto-provisioning */}
      <FadeIn delay={0.2}>
        <DarkPanel>
          <h3 className="text-base font-bold mb-6 text-center" style={{ color: C.soft }}>
            بعد الدفع — ثناره تبني بيئتك الرقمية فوراً
          </h3>
          <div className="space-y-2">
            {PROVISION_STEPS.map((step, i) => (
              <motion.div key={step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.07 }}
                className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ background: C.primary, color: C.white }}>{i + 1}</div>
                <div className="text-sm" style={{ color: C.white }}>{step}</div>
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: `${C.dark}80` }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${100 - i * 9}%` }}
                    transition={{ delay: 0.5 + i * 0.08, duration: 0.7 }}
                    className="h-full rounded-full"
                    style={{ background: C.soft }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 text-center rounded-xl py-2.5" style={{ background: C.primary }}>
            <code className="text-sm font-mono font-bold" style={{ color: C.white }}>
              lola.thanarah.com ✓ Ready
            </code>
          </div>
        </DarkPanel>
      </FadeIn>
    </div>
  );
}
