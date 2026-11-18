/**
 * SlideRenderer — maps section slugs to rich, animated Arabic slides.
 * Each section has curated content matching the Thanarah presentation document.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { FadeIn, C, ChapterBadge, DarkPanel, Card, stagger, fadeUp, ThanarahIcon } from './shared';

// ─── Design tokens ────────────────────────────────────────────────────────────
const GOLD   = '#A07820';
const ACCENT = '#E8F0EC';
const BG     = '#F7F5F1';

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function SlideHero({ chapter, ar, en }: { chapter: string; ar: string; en?: string }) {
  return (
    <FadeIn>
      <ChapterBadge ar={chapter} en={chapter} />
      <h1 dir="rtl" className="text-xl sm:text-2xl md:text-3xl xl:text-4xl font-bold leading-[1.25] tracking-tight mb-3"
        style={{ color: C.ink, whiteSpace: 'pre-line' }}>
        {ar}
      </h1>
      {en && (
        <p className="text-sm sm:text-base font-medium" style={{ color: C.muted }}>{en}</p>
      )}
    </FadeIn>
  );
}

// Responsive grid classes — explicit strings so Tailwind v4 includes them
const COL_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5',
};

function ItemGrid({ items, columns = 2 }: { items: { icon?: string; ar: string; sub?: string }[]; columns?: number }) {
  const cls = COL_CLASS[columns] ?? 'grid-cols-2';
  return (
    <motion.div variants={stagger} initial="hidden" animate="show"
      className={`grid gap-2 md:gap-3 mt-4 md:mt-5 ${cls}`}>
      {items.map((item, i) => (
        <motion.div key={i} variants={fadeUp}
          dir="rtl"
          className="rounded-xl p-3 md:p-4 flex items-start gap-2"
          style={{ background: ACCENT, border: `1px solid ${C.soft}50` }}>
          {item.icon && (
            <span className="text-lg md:text-xl mt-0.5 shrink-0">{item.icon}</span>
          )}
          <div>
            <div className="font-bold text-xs md:text-sm" style={{ color: C.ink }}>{item.ar}</div>
            {item.sub && <div className="text-xs mt-0.5" style={{ color: C.muted }}>{item.sub}</div>}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function FlowList({ steps }: { steps: string[] }) {
  return (
    <div className="space-y-3 mt-8">
      {steps.map((step, i) => (
        <motion.div key={i}
          dir="rtl"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-4 rounded-xl px-5 py-3.5"
          style={{ background: i % 2 === 0 ? ACCENT : C.white, border: `1px solid ${C.soft}40` }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: C.primary, color: C.white }}>
            {i + 1}
          </div>
          <span className="font-medium" style={{ color: C.ink }}>{step}</span>
        </motion.div>
      ))}
    </div>
  );
}

function SplitComparison({ left, right, leftTitle, rightTitle }:
  { left: string[]; right: string[]; leftTitle: string; rightTitle: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mt-8">
      <div className="rounded-2xl overflow-hidden">
        <div className="px-5 py-3 text-center font-bold text-sm"
          style={{ background: '#E53E3E', color: 'white' }}>{leftTitle}</div>
        <div className="space-y-2 p-4" style={{ background: '#FFF5F5', border: '1px solid #FED7D7', borderTop: 'none', borderRadius: '0 0 1rem 1rem' }}>
          {left.map((item, i) => (
            <div key={i} dir="rtl" className="flex items-center gap-2 text-sm py-1"
              style={{ color: '#742A2A' }}>
              <span style={{ color: '#E53E3E' }}>✕</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl overflow-hidden">
        <div className="px-5 py-3 text-center font-bold text-sm"
          style={{ background: C.primary, color: 'white' }}>{rightTitle}</div>
        <div className="space-y-2 p-4" style={{ background: ACCENT, border: `1px solid ${C.soft}60`, borderTop: 'none', borderRadius: '0 0 1rem 1rem' }}>
          {right.map((item, i) => (
            <div key={i} dir="rtl" className="flex items-center gap-2 text-sm py-1"
              style={{ color: C.dark }}>
              <span style={{ color: C.primary }}>✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NumberStat({ value, label }: { value: string; label: string }) {
  return (
    <motion.div variants={fadeUp}
      dir="rtl"
      className="rounded-2xl p-6 text-center"
      style={{ background: C.dark, color: C.white }}>
      <div className="text-4xl font-bold mb-2" style={{ color: C.soft }}>{value}</div>
      <div className="text-sm font-medium" style={{ color: `${C.soft}cc` }}>{label}</div>
    </motion.div>
  );
}

// ─── Section: Introduction ─────────────────────────────────────────────────────
function SlideIntroduction() {
  const pillars = [
    { ar: 'الرعاية',    sub: 'Care',           icon: '🏥' },
    { ar: 'الإدارة',    sub: 'Management',      icon: '📊' },
    { ar: 'الذكاء',     sub: 'Intelligence',    icon: '🤖' },
    { ar: 'التواصل',    sub: 'Communication',   icon: '💬' },
    { ar: 'التشغيل',    sub: 'Operations',      icon: '⚙️' },
    { ar: 'النمو',      sub: 'Growth',          icon: '📈' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="الفصل الأول — البداية والتهيئة"
        ar={'ثناره —\nمستقبل الرعاية\nمن منظومة واحدة'} />
      <FadeIn delay={0.15}>
        <DarkPanel className="text-center">
          <ThanarahIcon size={48} />
          <p className="text-2xl md:text-3xl font-bold mt-4" style={{ color: C.white }}>
            حين تتكامل التقنية، تبدأ رعاية أفضل.
          </p>
          <p className="mt-3 text-sm font-medium tracking-widest uppercase" style={{ color: `${C.soft}bb` }}>
            When technology integrates, better care begins.
          </p>
        </DarkPanel>
      </FadeIn>
      <FadeIn delay={0.2}>
        <h2 dir="rtl" className="text-xl font-bold mb-4" style={{ color: C.primary }}>ستة محاور</h2>
        <ItemGrid items={pillars} columns={3} />
      </FadeIn>
    </div>
  );
}

// ─── Section: Problem ─────────────────────────────────────────────────────────
function SlideProblem() {
  const systems = [
    { ar: 'برنامج حجوزات', icon: '📅' }, { ar: 'ملفات طبية', icon: '🗂' },
    { ar: 'محاسبة', icon: '💰' }, { ar: 'مخزون', icon: '📦' },
    { ar: 'موقع إلكتروني', icon: '🌐' }, { ar: 'تطبيق جوال', icon: '📱' },
    { ar: 'واتساب', icon: '💬' }, { ar: 'نظام موظفين', icon: '👥' },
    { ar: 'CRM', icon: '🔗' }, { ar: 'نظام تسويق', icon: '📣' },
    { ar: 'بريد إلكتروني', icon: '✉️' }, { ar: 'دعم فني', icon: '🛠' },
  ];
  const losses = [
    { ar: 'خسارة الوقت',           sub: 'الموظفون يدخلون البيانات أكثر من مرة',            icon: '⏱' },
    { ar: 'خسارة الإيرادات',       sub: 'رسائل وحجوزات غير مكتملة تتحول إلى فرص ضائعة',  icon: '💸' },
    { ar: 'خسارة البيانات',        sub: 'المعلومة موزعة بين أكثر من نظام',                 icon: '🔀' },
    { ar: 'خسارة تجربة المريض',   sub: 'المريض يتنقل بين واتساب وموقع واتصال ودفع منفصل', icon: '😔' },
    { ar: 'خسارة القرار',          sub: 'الإدارة لا ترى الصورة الكاملة لحظيًا',            icon: '📉' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="الفصل الثاني — لماذا وُجدت ثناره؟"
        ar="المنشأة الطبية الحديثة\nتعمل عبر أنظمة كثيرة…\nلكنها لا تعمل كمنظومة واحدة."
        en="Too many systems. Zero integration." />
      <FadeIn delay={0.1}>
        <h2 dir="rtl" className="text-lg font-bold mb-4" style={{ color: C.primary }}>الأنظمة المنفصلة</h2>
        <ItemGrid items={systems} columns={4} />
      </FadeIn>
      <FadeIn delay={0.2}>
        <h2 dir="rtl" className="text-lg font-bold mb-4" style={{ color: '#E53E3E' }}>خمسة أنواع من الخسائر</h2>
        <ItemGrid items={losses} columns={1} />
      </FadeIn>
    </div>
  );
}

// ─── Section: Solution ────────────────────────────────────────────────────────
function SlideSolution() {
  const steps = [
    'اختر الباقة وأضف الخدمات التي تحتاجها',
    'ادفع وأدخل بيانات منشأتك',
    'استلم نظامك وخصص هويتك',
    'اربط موقعك وواتسابك وطبيقك',
    'أدر منشأتك وراقب النمو',
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="الفصل الثالث — ما هي ثناره؟"
        ar="ثناره — البنية الرقمية\nالكاملة للمنشأة الطبية"
        en="The complete digital operating system for healthcare." />
      <FadeIn delay={0.1}>
        <DarkPanel>
          <p dir="rtl" className="text-xl font-bold leading-relaxed" style={{ color: C.white }}>
            ثناره هي منصة تشغيل رقمي متكاملة للقطاع الطبي، تجمع{' '}
            <span style={{ color: C.soft }}>إدارة المنشأة</span>،{' '}
            <span style={{ color: C.soft }}>تجربة المريض</span>،{' '}
            <span style={{ color: C.soft }}>المواقع</span>،{' '}
            <span style={{ color: C.soft }}>التطبيقات</span>،{' '}
            <span style={{ color: C.soft }}>الاتصالات</span> والذكاء الاصطناعي{' '}
            داخل <span style={{ color: GOLD }}>منظومة واحدة</span>.
          </p>
          <div className="mt-6 flex flex-col gap-2" dir="rtl">
            {['ليست برنامج عيادة فقط.', 'ليست منشئ مواقع فقط.', 'ليست أداة حجز فقط.'].map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <span style={{ color: '#E53E3E' }}>✕</span>
                <span className="text-sm" style={{ color: `${C.soft}cc` }}>{t}</span>
              </div>
            ))}
          </div>
        </DarkPanel>
      </FadeIn>
      <FadeIn delay={0.2}>
        <h2 dir="rtl" className="text-lg font-bold mb-2" style={{ color: C.primary }}>من الاشتراك إلى التشغيل في خطوات</h2>
        <FlowList steps={steps} />
      </FadeIn>
    </div>
  );
}

// ─── Section: Ecosystem ───────────────────────────────────────────────────────
function SlideEcosystem() {
  const modules = [
    { ar: 'Customer Portal',   sub: 'بوابة العميل',      icon: '🏠' },
    { ar: 'Smart Clinic',      sub: 'العيادة الذكية',    icon: '🏥' },
    { ar: 'Website Builder',   sub: 'منشئ المواقع',      icon: '🌐' },
    { ar: 'Applications',      sub: 'التطبيقات',          icon: '📱' },
    { ar: 'WhatsApp AI',       sub: 'مساعد واتساب',       icon: '💬' },
    { ar: 'CRM & ERP',         sub: 'الإدارة والموارد',  icon: '📊' },
    { ar: 'Accounting',        sub: 'المحاسبة',           icon: '💰' },
    { ar: 'Analytics',         sub: 'التحليلات',          icon: '📈' },
    { ar: 'AI Intelligence',   sub: 'الذكاء الاصطناعي',  icon: '🤖' },
    { ar: 'Security',          sub: 'الأمان',             icon: '🛡' },
    { ar: 'Integrations',      sub: 'التكاملات',          icon: '🔗' },
    { ar: 'Support',           sub: 'الدعم الفني',        icon: '🛠' },
  ];
  const clients = [
    { ar: 'عيادات الأسنان', icon: '🦷' }, { ar: 'المجمعات الطبية', icon: '🏥' },
    { ar: 'المستشفيات', icon: '🏨' }, { ar: 'المختبرات', icon: '🧪' },
    { ar: 'مراكز الأشعة', icon: '📡' }, { ar: 'العلاج الطبيعي', icon: '💪' },
    { ar: 'التجميل الطبي', icon: '✨' }, { ar: 'سلاسل العيادات', icon: '🔗' },
    { ar: 'اليوم الواحد', icon: '🏃' }, { ar: 'شركات التشغيل', icon: '⚙️' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="الفصل الثالث — المنظومة"
        ar="Thanarah Core\nوحوله كل ما تحتاجه" />
      <FadeIn delay={0.1}>
        <h2 dir="rtl" className="text-lg font-bold mb-4" style={{ color: C.primary }}>وحدات المنظومة</h2>
        <ItemGrid items={modules} columns={3} />
      </FadeIn>
      <FadeIn delay={0.2}>
        <h2 dir="rtl" className="text-lg font-bold mb-4" style={{ color: C.primary }}>تخدم</h2>
        <ItemGrid items={clients} columns={5} />
      </FadeIn>
    </div>
  );
}

// ─── Section: Customer Journey ────────────────────────────────────────────────
function SlideCustomerJourney() {
  const steps = [
    { ar: 'زيارة موقع ثناره',         sub: 'واجهة فاخرة بخلفية أوف وايت' },
    { ar: 'التعرف الذكي على الاحتياج',  sub: 'أسئلة ذكية تقترح الباقة المناسبة' },
    { ar: 'اختيار الباقة',             sub: 'Lite · Pro · Infinity · Customize' },
    { ar: 'إضافة الخدمات الإضافية',    sub: 'تطبيق، واتساب، بريد مؤسسي، وأكثر' },
    { ar: 'الدفع عبر جيديا',           sub: 'آمن ومعتمد، بدون تخزين بيانات البطاقة' },
    { ar: 'إنشاء البيئة تلقائيًا',     sub: 'Tenant · Subdomain · هوية · وحدات' },
    { ar: 'لوحة التحكم',              sub: 'إدارة كاملة من مكان واحد' },
    { ar: 'الدعم والتطوير المستمر',    sub: 'طلبات تعديل، تذاكر، فريق داخلي' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="الفصل الخامس — رحلة العميل"
        ar="من أول نقرة\nإلى منشأة طبية رقمية متكاملة" />
      <FadeIn delay={0.1}>
        <FlowList steps={steps.map(s => s.ar)} />
      </FadeIn>
      <FadeIn delay={0.2}>
        <DarkPanel className="text-center">
          <p dir="rtl" className="text-xl font-bold" style={{ color: C.white }}>
            من الاشتراك إلى تشغيل منشأة طبية رقمية متكاملة{' '}
            <span style={{ color: C.soft }}>داخل تجربة واحدة.</span>
          </p>
        </DarkPanel>
      </FadeIn>
    </div>
  );
}

// ─── Section: Plans ───────────────────────────────────────────────────────────
function SlidePlans() {
  const plans = [
    { name: 'Lite', ar: 'الأساسي', sub: 'للمنشآت الصغيرة التي تحتاج أساس التشغيل', color: '#6B7280' },
    { name: 'Pro',  ar: 'الاحترافي', sub: 'للعيادات النامية والفروع المتعددة', color: C.primary },
    { name: 'Infinity', ar: 'اللا محدود', sub: 'للمنشآت التي تحتاج معظم قدرات المنظومة', color: C.dark },
    { name: 'Customize', ar: 'المخصص', sub: 'للمستشفيات والمجموعات والمشاريع الخاصة', color: GOLD },
  ];
  const addons = [
    { ar: 'تطبيق مخصص', icon: '📱' }, { ar: 'دومين خاص', icon: '🌐' },
    { ar: 'بريد مؤسسي', icon: '✉️' }, { ar: 'WhatsApp AI', icon: '💬' },
    { ar: 'تقارير متقدمة', icon: '📊' }, { ar: 'تكاملات دفع', icon: '💳' },
    { ar: 'تدريب موظفين', icon: '🎓' }, { ar: 'تطوير مخصص', icon: '⚙️' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="الفصل الخامس — الباقات"
        ar="باقة لكل حجم\nولكل احتياج" />
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plans.map((p, i) => (
            <motion.div key={i} variants={fadeUp}
              className="rounded-2xl p-6"
              style={{ background: p.color, color: 'white' }}>
              <div className="text-2xl font-bold mb-1">{p.name}</div>
              <div className="text-base font-bold opacity-90 mb-2">{p.ar}</div>
              <div className="text-sm opacity-75">{p.sub}</div>
            </motion.div>
          ))}
        </div>
      </FadeIn>
      <FadeIn delay={0.2}>
        <h2 dir="rtl" className="text-lg font-bold mb-4" style={{ color: C.primary }}>الإضافات</h2>
        <ItemGrid items={addons} columns={4} />
      </FadeIn>
    </div>
  );
}

// ─── Section: Smart Clinic ────────────────────────────────────────────────────
function SlideSmartClinic() {
  const modules = [
    { ar: 'لوحة القيادة الطبية',  sub: 'مرضى، حجوزات، أطباء، غرف، تنبيهات AI',  icon: '🎯' },
    { ar: 'ملف المريض الكامل',    sub: 'تاريخ طبي، وصفات، أشعة، مدفوعات',       icon: '📋' },
    { ar: 'المواعيد الذكية',      sub: 'يومي، أسبوعي، شهري، بالطبيب والفرع',    icon: '📅' },
    { ar: 'الفواتير والتحصيل',    sub: 'دفعات جزئية، أقساط، استرداد، تقارير',   icon: '💰' },
    { ar: 'نظام الأسنان',         sub: 'Dental Chart تفاعلي مع التاريخ الكامل',  icon: '🦷' },
    { ar: 'المخزون والمشتريات',   sub: 'تنبيهات تلقائية، موردون، جرد',           icon: '📦' },
    { ar: 'التأمين',              sub: 'موافقات، مطالبات، تتبع الرفض',            icon: '🛡' },
    { ar: 'الموظفون والحضور',     sub: 'QR Login، Wallet Pass، ورديات',          icon: '👥' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="الفصل السادس — النظام الطبي"
        ar="العيادة الذكية —\nكل شيء في منظومة واحدة" />
      <FadeIn delay={0.1}>
        <ItemGrid items={modules} columns={2} />
      </FadeIn>
    </div>
  );
}

// ─── Section: Website Builder ─────────────────────────────────────────────────
function SlideWebsiteBuilder() {
  const features = [
    { ar: 'سحب وإفلات بدون كود',   icon: '🖱' },
    { ar: 'مكتبة قوالب طبية',      icon: '🎨' },
    { ar: 'حجز متكامل مع النظام',  icon: '📅' },
    { ar: 'دفع إلكتروني مباشر',    icon: '💳' },
    { ar: 'SEO محسّن',              icon: '🔍' },
    { ar: 'نشر فوري + Subdomain',   icon: '🚀' },
    { ar: 'إنشاء بالذكاء الاصطناعي', icon: '🤖' },
    { ar: 'بريد مؤسسي مدمج',       icon: '✉️' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="الفصل السابع — الموقع الذكي"
        ar="موقعك الطبي\nيُنشأ خلال دقائق" />
      <FadeIn delay={0.1}>
        <DarkPanel dir="rtl">
          <p className="text-lg font-bold" style={{ color: C.white }}>
            العميل يكتب:{' '}
            <span style={{ color: C.soft }}>
              «أنشئ موقعًا لعيادة أسنان راقية في الرياض، بهوية هادئة»
            </span>
          </p>
          <p className="mt-3 text-sm" style={{ color: `${C.soft}99` }}>
            النظام يقترح: هيكل الموقع · الألوان · الصفحات · المحتوى · CTAs
          </p>
        </DarkPanel>
      </FadeIn>
      <FadeIn delay={0.2}>
        <h2 dir="rtl" className="text-lg font-bold mb-4" style={{ color: C.primary }}>مميزات منشئ المواقع</h2>
        <ItemGrid items={features} columns={4} />
      </FadeIn>
    </div>
  );
}

// ─── Section: WhatsApp AI ─────────────────────────────────────────────────────
function SlideWhatsappAI() {
  const conversation = [
    { role: 'patient', text: 'عندكم ابتسامة هوليوود؟' },
    { role: 'ai', text: 'نعم، تتوفر عدة خيارات بعد تقييم الطبيب. أستطيع عرض أقرب موعد للاستشارة.' },
    { role: 'patient', text: 'متى أقرب موعد الأسبوع القادم؟' },
    { role: 'ai', text: 'متاح الثلاثاء 2:00 م أو الأربعاء 11:00 ص. أيهما يناسبك؟' },
    { role: 'patient', text: 'الثلاثاء 2:00 م' },
    { role: 'ai', text: '✅ تم حجز موعدك. سيصلك تأكيد ورابط الدفع الآن.' },
  ];
  const capabilities = [
    { ar: 'تدريب على بيانات المنشأة', icon: '🧠' },
    { ar: 'حجز المواعيد تلقائيًا', icon: '📅' },
    { ar: 'الدفع داخل المحادثة', icon: '💳' },
    { ar: 'تحويل بشري ذكي', icon: '👤' },
    { ar: 'إضافة لـ CRM لحظيًا', icon: '🔗' },
    { ar: 'متاح 24/7', icon: '🕐' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="الفصل الثامن — WhatsApp AI"
        ar="مساعد واتساب\nيحجز ويدفع ويخدم" />
      <FadeIn delay={0.1}>
        <div className="rounded-2xl overflow-hidden" style={{ background: '#ECF5EC', border: `1px solid ${C.soft}50` }}>
          <div className="px-5 py-3 flex items-center gap-3" style={{ background: '#1A7020' }}>
            <span className="text-white text-lg">💬</span>
            <span className="text-white font-bold text-sm">عيادة الابتسامة الذهبية</span>
          </div>
          <div className="p-4 space-y-3">
            {conversation.map((msg, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.12 }}
                dir="rtl"
                className={`flex ${msg.role === 'patient' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-2xl px-4 py-2 max-w-[75%] text-sm`}
                  style={{
                    background: msg.role === 'patient' ? '#D9FDD3' : C.white,
                    color: C.ink,
                  }}>
                  {msg.role === 'ai' && (
                    <div className="text-[10px] font-bold mb-1" style={{ color: C.primary }}>🤖 ثناره AI</div>
                  )}
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </FadeIn>
      <FadeIn delay={0.2}>
        <ItemGrid items={capabilities} columns={3} />
      </FadeIn>
    </div>
  );
}

// ─── Section: Apps ────────────────────────────────────────────────────────────
function SlideApps() {
  const patientApp = [
    { ar: 'الحساب والملف الطبي', icon: '👤' },
    { ar: 'الحجوزات والمواعيد', icon: '📅' },
    { ar: 'الوصفات والنتائج',   icon: '💊' },
    { ar: 'الفواتير والدفع',    icon: '💳' },
    { ar: 'Wallet Pass + QR',   icon: '📲' },
    { ar: 'إشعارات ذكية',       icon: '🔔' },
  ];
  const pipeline = ['اسم التطبيق وشعاره', 'الألوان والصفحات', 'Build تلقائي', 'Submission لمتاجر', 'Publish'];
  return (
    <div className="space-y-8">
      <SlideHero chapter="الفصل التاسع — التطبيقات"
        ar="مصنع التطبيقات —\nمن الموقع إلى iOS وAndroid" />
      <FadeIn delay={0.1}>
        <h2 dir="rtl" className="text-lg font-bold mb-4" style={{ color: C.primary }}>App Factory</h2>
        <FlowList steps={pipeline} />
      </FadeIn>
      <FadeIn delay={0.2}>
        <h2 dir="rtl" className="text-lg font-bold mb-4" style={{ color: C.primary }}>تطبيق المريض</h2>
        <ItemGrid items={patientApp} columns={3} />
      </FadeIn>
    </div>
  );
}

// ─── Section: Internal Operations ────────────────────────────────────────────
function SlideInternalOperations() {
  const units = [
    { ar: 'العملاء والمنشآت',  icon: '🏢' }, { ar: 'الاشتراكات',   icon: '📋' },
    { ar: 'فريق المطورين',     icon: '👨‍💻' }, { ar: 'الدعم الفني',  icon: '🛠' },
    { ar: 'CRM والمبيعات',    icon: '📈' }, { ar: 'التسويق',       icon: '📣' },
    { ar: 'المحاسبة',          icon: '💰' }, { ar: 'الشركاء',       icon: '🤝' },
    { ar: 'الموارد البشرية',   icon: '👥' }, { ar: 'الأمان',        icon: '🛡' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="الفصل العاشر — إدارة شركة ثناره"
        ar="منصة الإدارة المركزية —\nCommand Center" />
      <FadeIn delay={0.1}>
        <DarkPanel className="text-center">
          <p dir="rtl" className="text-xl font-bold" style={{ color: C.white }}>
            ثناره تدير نفسها من نفس المنظومة.
          </p>
          <p className="mt-2 text-sm" style={{ color: `${C.soft}99` }}>
            Every unit. Every client. Every service — one command center.
          </p>
        </DarkPanel>
      </FadeIn>
      <FadeIn delay={0.2}>
        <ItemGrid items={units} columns={2} />
      </FadeIn>
    </div>
  );
}

// ─── Section: Architecture ────────────────────────────────────────────────────
function SlideArchitecture() {
  const layers = [
    { ar: 'المستخدمون والأجهزة',           icon: '📱' },
    { ar: 'الحماية الطرفية',               icon: '🛡' },
    { ar: 'تطبيقات الويب والجوال',         icon: '🌐' },
    { ar: 'API Gateway',                   icon: '🔀' },
    { ar: 'Authentication & Authorization', icon: '🔑' },
    { ar: 'Core Services + Tenant Layer',  icon: '⚙️' },
    { ar: 'MongoDB · Cache · Queue · Storage', icon: '🗄' },
    { ar: 'AI Gateway · Integrations',    icon: '🤖' },
    { ar: 'Monitoring · Audit · Backup',  icon: '📊' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="الفصل الثاني عشر — المعمارية التقنية"
        ar="بنية تقنية طبقية\nمحكمة وقابلة للتوسع" />
      <FadeIn delay={0.1}>
        <div className="space-y-2 mt-4">
          {layers.map((layer, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + i * 0.06, duration: 0.5 }}
              dir="rtl"
              className="flex items-center gap-4 rounded-xl px-5 py-3"
              style={{
                background: i === 0 || i === layers.length - 1 ? C.dark : i % 2 === 0 ? ACCENT : C.white,
                color: i === 0 || i === layers.length - 1 ? C.white : C.ink,
                border: `1px solid ${C.soft}30`,
              }}>
              <span className="text-xl">{layer.icon}</span>
              <span className="font-medium text-sm">{layer.ar}</span>
              {i < layers.length - 1 && (
                <span className="mr-auto text-xs" style={{ color: i === 0 ? C.soft : C.muted }}>↓</span>
              )}
            </motion.div>
          ))}
        </div>
      </FadeIn>
      <FadeIn delay={0.2}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { value: 'Multi-Tenant', label: 'بيانات معزولة لكل منشأة' },
            { value: 'MongoDB', label: 'قاعدة بيانات مرنة وقابلة للتوسع' },
            { value: '99.9%', label: 'هدف Uptime مع Auto Recovery' },
          ].map((s, i) => <NumberStat key={i} {...s} />)}
        </div>
      </FadeIn>
    </div>
  );
}

// ─── Section: Security ────────────────────────────────────────────────────────
function SlideSecurity() {
  const layers = [
    { ar: 'MFA — التحقق متعدد العوامل',  sub: 'كل جلسة محمية بطبقة ثانية',         icon: '🔐' },
    { ar: 'RBAC — الصلاحيات الدقيقة',   sub: 'كل مستخدم يرى ما يُسمح له فقط',     icon: '🔑' },
    { ar: 'Trusted Devices',             sub: 'أجهزة موثوقة، تنبيه فوري للجديدة',   icon: '📱' },
    { ar: 'Forensic Watermark',          sub: 'كل جلسة موسومة بهوية المستخدم',       icon: '💧' },
    { ar: 'Audit Logs',                  sub: 'سجل كامل لكل إجراء',                  icon: '📋' },
    { ar: 'Tenant Isolation',            sub: 'بيانات كل منشأة معزولة تمامًا',       icon: '🏰' },
    { ar: 'Signed URLs',                 sub: 'روابط مؤقتة وموقعة لكل ملف',          icon: '🔗' },
    { ar: 'Risk Scoring',                sub: 'تقييم آلي لسلوك المستخدم',             icon: '📊' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="الفصل الثالث عشر — الأمان"
        ar="طبقات حماية\nلا تراها — لكنها دائمًا موجودة" />
      <FadeIn delay={0.1}>
        <DarkPanel>
          <p dir="rtl" className="text-lg font-bold" style={{ color: C.white }}>
            فريق ثناره <span style={{ color: '#FC8181' }}>لا يدخل</span> إلى نظام العميل إلا بعد{' '}
            <span style={{ color: C.soft }}>موافقة صريحة، مقيدة بوقت وصلاحيات محددة.</span>
          </p>
        </DarkPanel>
      </FadeIn>
      <FadeIn delay={0.2}>
        <ItemGrid items={layers} columns={2} />
      </FadeIn>
    </div>
  );
}

// ─── Section: Business Model ──────────────────────────────────────────────────
function SlideBusinessModel() {
  const streams = [
    { ar: 'اشتراكات شهرية',     sub: 'Lite · Pro · Infinity',       icon: '🔄' },
    { ar: 'الإضافات',           sub: 'تطبيقات، واتساب، تقارير',     icon: '➕' },
    { ar: 'AI Usage',            sub: 'استهلاك الذكاء الاصطناعي',    icon: '🤖' },
    { ar: 'التطوير المخصص',     sub: 'مشاريع خاصة وتكاملات',        icon: '⚙️' },
    { ar: 'خدمات الإطلاق',      sub: 'إعداد، تدريب، تخصيص',        icon: '🚀' },
    { ar: 'Marketplace',         sub: 'قوالب، حلول، شركاء',         icon: '🏪' },
    { ar: 'عقود المؤسسات',      sub: 'مستشفيات وسلاسل',             icon: '🏢' },
    { ar: 'الأجهزة مستقبلًا',   sub: 'أجهزة طبية متصلة',            icon: '🔬' },
  ];
  const growth = ['Lite', 'Pro', 'فروع إضافية', 'AI', 'تطبيق', 'تقارير متقدمة', 'Enterprise'];
  return (
    <div className="space-y-8">
      <SlideHero chapter="الفصل الرابع عشر — نموذج الأعمال"
        ar="منصة تحقق الإيراد\nمن أكثر من مسار" />
      <FadeIn delay={0.1}>
        <h2 dir="rtl" className="text-lg font-bold mb-4" style={{ color: C.primary }}>مصادر الإيرادات</h2>
        <ItemGrid items={streams} columns={4} />
      </FadeIn>
      <FadeIn delay={0.2}>
        <h2 dir="rtl" className="text-lg font-bold mb-3" style={{ color: C.primary }}>نمو العميل داخل ثناره</h2>
        <div className="flex gap-2 items-center flex-wrap" dir="rtl">
          {growth.map((g, i) => (
            <React.Fragment key={i}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="rounded-full px-4 py-2 text-sm font-bold"
                style={{ background: i === growth.length - 1 ? C.dark : ACCENT, color: i === growth.length - 1 ? C.white : C.primary, border: `1px solid ${C.soft}50` }}>
                {g}
              </motion.div>
              {i < growth.length - 1 && <span style={{ color: C.muted }}>→</span>}
            </React.Fragment>
          ))}
        </div>
      </FadeIn>
    </div>
  );
}

// ─── Section: Market ──────────────────────────────────────────────────────────
function SlideMarket() {
  const regions = [
    { ar: 'الرياض', icon: '📍', phase: 'المرحلة الأولى' },
    { ar: 'جدة', icon: '📍', phase: 'المرحلة الأولى' },
    { ar: 'المنطقة الشرقية', icon: '📍', phase: 'المرحلة الأولى' },
    { ar: 'المملكة كاملة', icon: '🇸🇦', phase: 'المرحلة الثانية' },
    { ar: 'دول الخليج', icon: '🌍', phase: 'المرحلة الثالثة' },
    { ar: 'الأسواق العالمية', icon: '🌐', phase: 'المرحلة الرابعة' },
  ];
  const whySaudi = [
    { ar: 'تسارع التحول الرقمي', icon: '🚀' },
    { ar: 'نمو المنشآت الطبية', icon: '📈' },
    { ar: 'ارتفاع توقعات المرضى', icon: '⭐' },
    { ar: 'الحاجة للأتمتة', icon: '🤖' },
    { ar: 'بيئة دفع وتطبيقات ناضجة', icon: '💳' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="الفصل الخامس عشر — السوق والتوسع"
        ar="السوق السعودي\nنقطة الانطلاق لعالم أكبر" />
      <FadeIn delay={0.1}>
        <h2 dir="rtl" className="text-lg font-bold mb-4" style={{ color: C.primary }}>لماذا السعودية؟</h2>
        <ItemGrid items={whySaudi} columns={1} />
      </FadeIn>
      <FadeIn delay={0.2}>
        <h2 dir="rtl" className="text-lg font-bold mb-4" style={{ color: C.primary }}>خطة التوسع</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {regions.map((r, i) => (
            <motion.div key={i} variants={fadeUp}
              dir="rtl"
              className="rounded-xl p-4 text-center"
              style={{ background: ACCENT, border: `1px solid ${C.soft}50` }}>
              <div className="text-2xl mb-2">{r.icon}</div>
              <div className="font-bold text-sm" style={{ color: C.ink }}>{r.ar}</div>
              <div className="text-xs mt-1" style={{ color: C.muted }}>{r.phase}</div>
            </motion.div>
          ))}
        </div>
      </FadeIn>
    </div>
  );
}

// ─── Section: Competitive Advantages ─────────────────────────────────────────
function SlideCompetitiveAdvantages() {
  return (
    <div className="space-y-8">
      <SlideHero chapter="الفصل الرابع — الفرق عن السوق"
        ar="لماذا يصعب\nتقليد ثناره؟" />
      <FadeIn delay={0.1}>
        <SplitComparison
          leftTitle="السوق التقليدي"
          rightTitle="ثناره"
          left={['أنظمة منفصلة', 'بيانات موزعة', 'تطبيق مستقل', 'ذكاء اصطناعي شكلي', 'دعم من أكثر من جهة', 'تحديثات يدوية', 'صعوبة التوسع', 'تقارير متأخرة']}
          right={['منظومة مترابطة', 'بيانات موحدة', 'تطبيق مرتبط بالنظام', 'ذكاء داخل التشغيل', 'دعم مركزي', 'تحديثات مركزية', 'توسع حسب الباقة', 'رؤية لحظية']}
        />
      </FadeIn>
      <FadeIn delay={0.2}>
        <DarkPanel>
          <p dir="rtl" className="text-lg font-bold" style={{ color: C.white }}>
            المنافس يستطيع تقليد{' '}
            <span style={{ color: '#FC8181' }}>الواجهة</span>،
            {' '}لكنه لا يرى{' '}
            <span style={{ color: C.soft }}>البنية العميقة</span> خلفها.
          </p>
        </DarkPanel>
      </FadeIn>
    </div>
  );
}

// ─── Section: Roadmap ─────────────────────────────────────────────────────────
function SlideRoadmap() {
  const future = [
    { ar: 'Advanced Smart Clinic', icon: '🏥' },
    { ar: 'Marketplace', icon: '🏪' },
    { ar: 'App Factory Automation', icon: '🏭' },
    { ar: 'Digital Twin', icon: '🪞' },
    { ar: 'Autopilot', icon: '🤖' },
    { ar: 'Insurance Integrations', icon: '📋' },
    { ar: 'Device Integrations', icon: '🔬' },
    { ar: 'Enterprise Hospitals', icon: '🏨' },
    { ar: 'Developer Ecosystem', icon: '👨‍💻' },
    { ar: 'Global Expansion', icon: '🌐' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="خارطة الطريق"
        ar="المستقبل مبني\nعلى نفس الأساس" />
      <FadeIn delay={0.1}>
        <ItemGrid items={future} columns={2} />
      </FadeIn>
    </div>
  );
}

// ─── Section: Timeline ────────────────────────────────────────────────────────
function SlideTimeline() {
  const phases = [
    {
      month: 'الشهر الأول', color: C.primary,
      items: ['Presentation Portal', 'الهوية والمستخدمون', 'الدعوات والصلاحيات', 'الأساس الأمني', 'Architecture'],
    },
    {
      month: 'الشهر الثاني', color: C.dark,
      items: ['Customer Portal', 'الاشتراكات وجيديا', 'Tenant Provisioning', 'Smart Clinic MVP', 'الدعم الفني'],
    },
    {
      month: 'الشهر الثالث', color: GOLD,
      items: ['Website Builder MVP', 'WhatsApp AI Prototype', 'التقارير والنشر', 'المراقبة', 'Pilot Clinics'],
    },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="الخطة الزمنية"
        ar="ثلاثة أشهر\nمن الصفر إلى التشغيل" />
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {phases.map((phase, i) => (
            <motion.div key={i} variants={fadeUp}
              className="rounded-2xl overflow-hidden shadow-sm"
              style={{ border: `1px solid ${C.soft}40` }}>
              <div className="px-5 py-3 font-bold text-sm" style={{ background: phase.color, color: 'white' }}>
                {phase.month}
              </div>
              <div className="p-4 space-y-2" style={{ background: C.white }}>
                {phase.items.map((item, j) => (
                  <div key={j} dir="rtl" className="text-sm flex items-center gap-2"
                    style={{ color: C.ink }}>
                    <span style={{ color: phase.color }}>•</span>
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </FadeIn>
    </div>
  );
}

// ─── Section: Summary ─────────────────────────────────────────────────────────
function SlideSummary() {
  const nextSteps = [
    { role: 'للمستثمر', items: ['فتح النموذج المالي', 'حجز اجتماع', 'تسجيل الاهتمام'], icon: '💼', color: GOLD },
    { role: 'للشريك',   items: ['طلب شراكة', 'استكشاف التكامل', 'مشاركة بيانات التواصل'], icon: '🤝', color: C.primary },
    { role: 'للعميل',   items: ['طلب تجربة', 'اختيار باقة', 'حجز عرض توضيحي'], icon: '🏥', color: C.dark },
  ];
  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="text-center space-y-4">
          <ThanarahIcon size={48} />
          <h1 className="text-2xl md:text-3xl xl:text-4xl font-bold leading-tight" style={{ color: C.ink }}>
            نحن لا نبني نظامًا<br />
            <span style={{ color: C.primary }}>لإدارة العيادات.</span>
          </h1>
          <p className="text-2xl font-medium" style={{ color: C.muted }}>
            نحن نبني البنية الرقمية التي ستعمل من خلالها<br />
            المنشآت الطبية في المستقبل.
          </p>
          <div className="pt-4">
            <span className="text-3xl font-bold tracking-widest" style={{ color: C.primary }}>
              ثناره — تقنية تخدم الإنسان
            </span>
          </div>
        </div>
      </FadeIn>
      <FadeIn delay={0.2}>
        <h2 dir="rtl" className="text-lg font-bold mb-6" style={{ color: C.primary }}>الخطوة التالية</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {nextSteps.map((ns, i) => (
            <motion.div key={i} variants={fadeUp}
              className="rounded-2xl overflow-hidden">
              <div className="px-5 py-3 text-center font-bold" style={{ background: ns.color, color: 'white' }}>
                <span className="text-xl">{ns.icon}</span>
                <div className="text-sm mt-1">{ns.role}</div>
              </div>
              <div className="p-4 space-y-2" style={{ background: ACCENT, border: `1px solid ${C.soft}40`, borderTop: 'none', borderRadius: '0 0 1rem 1rem' }}>
                {ns.items.map((item, j) => (
                  <div key={j} dir="rtl" className="text-sm" style={{ color: C.ink }}>→ {item}</div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </FadeIn>
    </div>
  );
}

// ─── Generic fallback ─────────────────────────────────────────────────────────
function SlideGeneric({ titleAr, descriptionAr, order }: { titleAr: string; descriptionAr?: string; order: number }) {
  return (
    <div className="space-y-12">
      <FadeIn>
        <div className="text-[8rem] font-bold leading-none select-none"
          style={{ color: `${C.soft}40` }}>
          {String(order).padStart(2, '0')}
        </div>
        <h1 dir="rtl" className="text-5xl md:text-6xl font-bold leading-tight -mt-8"
          style={{ color: C.ink }}>{titleAr}</h1>
        {descriptionAr && (
          <p dir="rtl" className="text-xl mt-4 leading-relaxed" style={{ color: C.muted }}>
            {descriptionAr}
          </p>
        )}
      </FadeIn>
      <FadeIn delay={0.15}>
        <DarkPanel className="text-center">
          <ThanarahIcon size={36} />
          <p className="mt-3 text-base font-medium" style={{ color: `${C.soft}cc` }}>
            Thanarah — The Future of Healthcare Technology
          </p>
        </DarkPanel>
      </FadeIn>
    </div>
  );
}

// ─── Route map ────────────────────────────────────────────────────────────────
const SLIDE_MAP: Record<string, React.ComponentType<{ titleAr: string; descriptionAr?: string; order: number }>> = {
  'introduction':         () => <SlideIntroduction />,
  'problem':              () => <SlideProblem />,
  'solution':             () => <SlideSolution />,
  'ecosystem':            () => <SlideEcosystem />,
  'customer-journey':     () => <SlideCustomerJourney />,
  'plans':                () => <SlidePlans />,
  'smart-clinic':         () => <SlideSmartClinic />,
  'website-builder':      () => <SlideWebsiteBuilder />,
  'whatsapp-ai':          () => <SlideWhatsappAI />,
  'apps':                 () => <SlideApps />,
  'internal-operations':  () => <SlideInternalOperations />,
  'architecture':         () => <SlideArchitecture />,
  'security':             () => <SlideSecurity />,
  'business-model':       () => <SlideBusinessModel />,
  'market':               () => <SlideMarket />,
  'competitive-advantages': () => <SlideCompetitiveAdvantages />,
  'roadmap':              () => <SlideRoadmap />,
  'timeline':             () => <SlideTimeline />,
  'summary':              () => <SlideSummary />,
};

// ─── Main export ──────────────────────────────────────────────────────────────
interface SlideRendererProps {
  slug: string;
  titleAr: string;
  descriptionAr?: string;
  order: number;
}

export function SlideRenderer({ slug, titleAr, descriptionAr, order }: SlideRendererProps) {
  const Component = SLIDE_MAP[slug];
  if (Component) {
    return <Component titleAr={titleAr} descriptionAr={descriptionAr} order={order} />;
  }
  return <SlideGeneric titleAr={titleAr} descriptionAr={descriptionAr} order={order} />;
}
