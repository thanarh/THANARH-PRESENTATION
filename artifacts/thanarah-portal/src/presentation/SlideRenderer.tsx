/**
 * SlideRenderer — maps section slugs to rich, animated Arabic slides.
 * Each section has curated content matching the Thanarah presentation document.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { FadeIn, C, ChapterBadge, DarkPanel, stagger, fadeUp, ThanarahIcon } from './shared';

// ─── Design tokens ────────────────────────────────────────────────────────────
const ACCENT = '#E8F0EC';

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
  const tones = [
    { background: '#E0EEE4', foreground: '#17533E' },
    { background: '#F6E5D7', foreground: '#744E34' },
    { background: '#E9E8F0', foreground: '#4C526D' },
    { background: '#F4EDCF', foreground: '#6E5B2D' },
  ];
  return (
    <motion.div variants={stagger} initial="hidden" animate="show"
      className={`grid gap-3 md:gap-4 mt-4 md:mt-6 ${cls}`}>
      {items.map((item, i) => (
        <motion.div key={i} variants={fadeUp}
          dir="rtl"
          className="rounded-2xl p-4 md:p-5 flex items-start gap-3 transition-transform duration-300 hover:-translate-y-1"
          style={{ background: tones[i % tones.length].background, border: '1px solid rgba(255,255,255,0.72)' }}>
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[10px] font-extrabold tracking-wide"
            style={{ background: 'rgba(255,255,255,0.68)', color: tones[i % tones.length].foreground }}>
            {String(i + 1).padStart(2, '0')}
          </span>
          <div>
            <div className="font-extrabold text-sm md:text-base" style={{ color: tones[i % tones.length].foreground }}>{item.ar}</div>
            {item.sub && <div className="text-xs md:text-sm mt-1 leading-relaxed" style={{ color: C.muted }}>{item.sub}</div>}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function FlowList({ steps }: { steps: string[] }) {
  return (
    <div className="space-y-3 mt-5">
      {steps.map((step, i) => (
        <motion.div key={i}
          dir="rtl"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-4 rounded-2xl px-4 py-3.5"
          style={{ background: i % 2 === 0 ? '#E0EEE4' : C.white, border: '1px solid rgba(30,107,77,0.08)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0"
            style={{ background: i % 2 === 0 ? C.primary : '#F6E5D7', color: i % 2 === 0 ? C.white : '#744E34' }}>
            {String(i + 1).padStart(2, '0')}
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

// ─── Section: Introduction ─────────────────────────────────────────────────────
function SlideIntroduction() {
  const pillars = [
    { ar: 'إدارة العيادة', sub: 'العمليات اليومية' },
    { ar: 'تجربة المريض', sub: 'من التواصل إلى الموعد' },
    { ar: 'الحضور الرقمي', sub: 'مواقع وتطبيقات' },
    { ar: 'التواصل', sub: 'قنوات مترابطة' },
  ];
  return (
    <div className="space-y-6 md:space-y-8">
      <SlideHero chapter="البداية"
        ar={'عيادتك،\nكلّها معًا.'} />
      <FadeIn delay={0.15}>
        <DarkPanel className="relative overflow-hidden text-center md:text-right">
          <div aria-hidden="true" className="absolute -left-12 -top-20 h-56 w-56 rounded-full bg-white/5" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <p className="text-xl md:text-2xl font-extrabold" style={{ color: C.white }}>
                ثناره تجمع تفاصيل العيادة في مكان واحد.
              </p>
              <p className="mt-2 text-sm md:text-base" style={{ color: `${C.soft}dd` }}>
                إدارة، تواصل، وحضور رقمي — بلا تكرار للشرح.
              </p>
            </div>
            <ThanarahIcon size={48} />
          </div>
        </DarkPanel>
      </FadeIn>
      <FadeIn delay={0.2}>
        <h2 dir="rtl" className="text-base font-bold mb-1" style={{ color: C.primary }}>أربع ركائز، تجربة واحدة</h2>
        <ItemGrid items={pillars} columns={4} />
      </FadeIn>
    </div>
  );
}

// ─── Section: Problem ─────────────────────────────────────────────────────────
function SlideProblem() {
  const systems = [
    { ar: 'الحجوزات والملفات' },
    { ar: 'الإدارة والمدفوعات' },
    { ar: 'الموقع والتطبيق' },
    { ar: 'التواصل مع المرضى' },
  ];
  const losses = [
    { ar: 'وقت أكثر في التنقل بين الأنظمة' },
    { ar: 'بيانات موزعة يصعب جمعها' },
    { ar: 'رحلة مريض غير مترابطة' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="المشكلة"
        ar="أدوات كثيرة،\nوتجربة واحدة تحتاج أن تترابط." />
      <FadeIn delay={0.1}>
        <h2 dir="rtl" className="text-base font-bold mb-1" style={{ color: C.primary }}>ما يحتاجه الفريق يومياً</h2>
        <ItemGrid items={systems} columns={4} />
      </FadeIn>
      <FadeIn delay={0.2}>
        <h2 dir="rtl" className="text-base font-bold mb-1" style={{ color: C.primary }}>حين تبقى الأدوات منفصلة</h2>
        <ItemGrid items={losses} columns={3} />
      </FadeIn>
    </div>
  );
}

// ─── Section: Solution ────────────────────────────────────────────────────────
function SlideSolution() {
  const steps = [
    'اختر الخدمات المناسبة لمنشأتك',
    'خصص الهوية والبيانات',
    'اربط أدوات التواصل والحجز',
    'أدر العمل من لوحة واحدة',
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="الحل"
        ar="منظومة رقمية\nتعمل مع العيادة." />
      <FadeIn delay={0.1}>
        <DarkPanel>
          <p dir="rtl" className="text-xl md:text-2xl font-extrabold leading-relaxed" style={{ color: C.white }}>
            إدارة المنشأة وتجربة المريض والحضور الرقمي —{' '}
            <span style={{ color: C.soft }}>ضمن منظومة ثناره.</span>
          </p>
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
    { ar: 'إدارة العيادة', sub: 'المهام اليومية' },
    { ar: 'تجربة المريض', sub: 'التواصل والحجوزات' },
    { ar: 'الموقع والتطبيق', sub: 'الحضور الرقمي' },
    { ar: 'المساندة الذكية', sub: 'واتساب وتكاملات' },
  ];
  const clients = [
    { ar: 'العيادات' },
    { ar: 'المجمعات الطبية' },
    { ar: 'المجموعات الطبية' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="المنظومة"
        ar="كل أدوات العيادة،\nفي منظومة واحدة." />
      <FadeIn delay={0.1}>
        <h2 dir="rtl" className="text-base font-bold mb-1" style={{ color: C.primary }}>أربع مساحات مترابطة</h2>
        <ItemGrid items={modules} columns={4} />
      </FadeIn>
      <FadeIn delay={0.2}>
        <h2 dir="rtl" className="text-base font-bold mb-1" style={{ color: C.primary }}>مصممة للمنشآت الطبية</h2>
        <ItemGrid items={clients} columns={3} />
      </FadeIn>
    </div>
  );
}

// ─── Section: Customer Journey ────────────────────────────────────────────────
function SlideCustomerJourney() {
  const steps = [
    { ar: 'تحديد احتياج المنشأة' },
    { ar: 'اختيار الخدمات والهوية' },
    { ar: 'ربط الموقع وقنوات التواصل' },
    { ar: 'إدارة العمل من لوحة واحدة' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="رحلة الاستخدام"
        ar="من الاحتياج،\nإلى تجربة رقمية مترابطة." />
      <FadeIn delay={0.1}>
        <FlowList steps={steps.map(s => s.ar)} />
      </FadeIn>
      <FadeIn delay={0.2}>
        <DarkPanel className="text-center">
          <p dir="rtl" className="text-lg md:text-xl font-extrabold" style={{ color: C.white }}>
            خطوات واضحة، ومنظومة تنمو مع احتياج المنشأة.
          </p>
        </DarkPanel>
      </FadeIn>
    </div>
  );
}

// ─── Section: Plans ───────────────────────────────────────────────────────────
function SlidePlans() {
  const plans = [
    { name: 'Lite', ar: 'الأساسي', sub: 'بداية عملية للعيادة', color: '#E0EEE4' },
    { name: 'Pro',  ar: 'الاحترافي', sub: 'للنمو والفروع المتعددة', color: '#F6E5D7' },
    { name: 'Infinity', ar: 'المتكامل', sub: 'لمنظومة أوسع', color: '#E9E8F0' },
    { name: 'Customize', ar: 'المخصص', sub: 'احتياج خاص أو مؤسسي', color: '#F4EDCF' },
  ];
  const addons = [
    { ar: 'موقع وهوية رقمية' },
    { ar: 'تطبيق للمنشأة' },
    { ar: 'واتساب وتواصل' },
    { ar: 'تكاملات وتقارير' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="الباقات"
        ar="باقة تناسب\nاحتياج منشأتك." />
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plans.map((p, i) => (
            <motion.div key={i} variants={fadeUp}
              className="rounded-2xl p-6"
              style={{ background: p.color, color: C.dark }}>
              <div className="text-xl font-extrabold mb-1">{p.name}</div>
              <div className="text-sm font-bold mb-2">{p.ar}</div>
              <div className="text-sm opacity-75">{p.sub}</div>
            </motion.div>
          ))}
        </div>
      </FadeIn>
      <FadeIn delay={0.2}>
        <h2 dir="rtl" className="text-base font-bold mb-1" style={{ color: C.primary }}>أضف ما تحتاجه فقط</h2>
        <ItemGrid items={addons} columns={4} />
      </FadeIn>
    </div>
  );
}

// ─── Section: Smart Clinic ────────────────────────────────────────────────────
function SlideSmartClinic() {
  const modules = [
    { ar: 'المواعيد والمرضى', sub: 'عرض وإدارة العمل اليومي' },
    { ar: 'ملف المريض', sub: 'المعلومات الطبية المرتبطة بالرعاية' },
    { ar: 'الفواتير والتحصيل', sub: 'متابعة المدفوعات من مكان واحد' },
    { ar: 'الفريق والمخزون', sub: 'تنظيم الموارد والمهام' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="العيادة الذكية"
        ar="مساحة عمل واحدة،\nليوم عيادة أسهل." />
      <FadeIn delay={0.1}>
        <ItemGrid items={modules} columns={2} />
      </FadeIn>
    </div>
  );
}

// ─── Section: Website Builder ─────────────────────────────────────────────────
function SlideWebsiteBuilder() {
  const features = [
    { ar: 'قوالب للمنشآت الطبية' },
    { ar: 'حجز مرتبط بالخدمات' },
    { ar: 'محتوى وهوية قابلة للتخصيص' },
    { ar: 'أدوات إنشاء ذكية' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="الموقع"
        ar="حضور رقمي،\nيعكس هوية منشأتك." />
      <FadeIn delay={0.1}>
        <DarkPanel dir="rtl">
          <p className="text-lg font-bold" style={{ color: C.white }}>
            موقع طبي مرتبط بخدمات المنشأة{' '}
            <span style={{ color: C.soft }}>وبطريقة عملها.</span>
          </p>
          <p className="mt-3 text-sm" style={{ color: `${C.soft}cc` }}>
            الهوية، الصفحات، والحجز — ضمن تجربة واحدة.
          </p>
        </DarkPanel>
      </FadeIn>
      <FadeIn delay={0.2}>
        <h2 dir="rtl" className="text-base font-bold mb-1" style={{ color: C.primary }}>الموقع جزء من المنظومة</h2>
        <ItemGrid items={features} columns={4} />
      </FadeIn>
    </div>
  );
}

// ─── Section: WhatsApp AI ─────────────────────────────────────────────────────
function SlideWhatsappAI() {
  const conversation = [
    { role: 'patient', text: 'أرغب في حجز موعد.' },
    { role: 'ai', text: 'يسعدنا مساعدتك. أي خدمة تحتاج؟' },
    { role: 'patient', text: 'استشارة.' },
    { role: 'ai', text: 'يمكنني متابعة طلب الموعد معك.' },
  ];
  const capabilities = [
    { ar: 'ردود مرتبطة بخدمات المنشأة' },
    { ar: 'متابعة طلبات المواعيد' },
    { ar: 'تحويل المحادثة للفريق' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="واتساب"
        ar="تواصل أسهل،\nمن القناة التي يعرفها المريض." />
      <FadeIn delay={0.1}>
        <div className="rounded-2xl overflow-hidden" style={{ background: '#ECF5EC', border: `1px solid ${C.soft}50` }}>
          <div className="px-5 py-3 flex items-center gap-3" style={{ background: '#1A7020' }}>
            <span className="text-white text-lg">💬</span>
            <span className="text-white font-bold text-sm">محادثة مع ثناره</span>
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
    { ar: 'الملف والخدمات' },
    { ar: 'المواعيد والحجوزات' },
    { ar: 'الإشعارات' },
    { ar: 'الدفع والفواتير' },
  ];
  const pipeline = ['حدد الهوية', 'خصص تجربة التطبيق', 'اربطه بخدمات المنشأة'];
  return (
    <div className="space-y-8">
      <SlideHero chapter="التطبيقات"
        ar="تجربة المنشأة،\nفي متناول المريض." />
      <FadeIn delay={0.1}>
        <h2 dir="rtl" className="text-base font-bold mb-1" style={{ color: C.primary }}>تخصيص تجربة التطبيق</h2>
        <FlowList steps={pipeline} />
      </FadeIn>
      <FadeIn delay={0.2}>
        <h2 dir="rtl" className="text-base font-bold mb-1" style={{ color: C.primary }}>تطبيق المريض</h2>
        <ItemGrid items={patientApp} columns={3} />
      </FadeIn>
    </div>
  );
}

// ─── Section: Internal Operations ────────────────────────────────────────────
function SlideInternalOperations() {
  const units = [
    { ar: 'المنشآت والعملاء' },
    { ar: 'الاشتراكات والخدمات' },
    { ar: 'الدعم والتطوير' },
    { ar: 'الشركاء والتكاملات' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="إدارة المنظومة"
        ar="تشغيل ومساندة،\nمن لوحة واحدة." />
      <FadeIn delay={0.1}>
        <DarkPanel className="text-center">
          <p dir="rtl" className="text-xl font-bold" style={{ color: C.white }}>
            لوحة واحدة لمتابعة خدمات ثناره والمنشآت.
          </p>
          <p className="mt-2 text-sm" style={{ color: `${C.soft}99` }}>
            خدمات المنشآت، في مساحة عمل مترابطة.
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
    { ar: 'واجهة الاستخدام' },
    { ar: 'خدمات العيادة' },
    { ar: 'البيانات والصلاحيات' },
    { ar: 'التكاملات والمتابعة' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="كيف تعمل المنظومة"
        ar="طبقات واضحة،\nتجربة واحدة." />
      <FadeIn delay={0.1}>
        <ItemGrid items={layers} columns={4} />
      </FadeIn>
    </div>
  );
}

// ─── Section: Security ────────────────────────────────────────────────────────
function SlideSecurity() {
  const layers = [
    { ar: 'صلاحيات حسب الدور', sub: 'ما يراه كل مستخدم يناسب مهمته' },
    { ar: 'وصول حسب القسم', sub: 'تحديد ما يمكن فتحه' },
    { ar: 'مدة للجلسة', sub: 'إدارة وقت الدخول' },
    { ar: 'سجل وهوية مرئية', sub: 'تتبع الاستخدام داخل العرض' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="الخصوصية والتحكم"
        ar="وصول مضبوط،\nومتابعة واضحة." />
      <FadeIn delay={0.1}>
        <DarkPanel>
          <p dir="rtl" className="text-lg font-bold" style={{ color: C.white }}>
            الصلاحيات والجلسات وسجل الاستخدام تساعد على حماية الوصول.
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
    { ar: 'الباقات', sub: 'اختر مستوى الخدمة' },
    { ar: 'الإضافات', sub: 'أضف وحدات حسب الحاجة' },
    { ar: 'التخصيص', sub: 'حلول للمتطلبات الخاصة' },
  ];
  const growth = ['الخدمات الأساسية', 'إضافات', 'فروع', 'تخصيص'];
  return (
    <div className="space-y-8">
      <SlideHero chapter="الباقات والخدمات"
        ar="ابدأ بما تحتاجه،\nوتوسّع عند الحاجة." />
      <FadeIn delay={0.1}>
        <ItemGrid items={streams} columns={3} />
      </FadeIn>
      <FadeIn delay={0.2}>
        <h2 dir="rtl" className="text-base font-bold mb-3" style={{ color: C.primary }}>مساحة النمو</h2>
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
  const market = [
    { ar: 'العيادات' },
    { ar: 'المجمعات الطبية' },
    { ar: 'المجموعات متعددة الفروع' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="لمن صُممت ثناره؟"
        ar="منشآت طبية،\nباحتياجات مختلفة." />
      <FadeIn delay={0.1}>
        <ItemGrid items={market} columns={3} />
      </FadeIn>
    </div>
  );
}

// ─── Section: Competitive Advantages ─────────────────────────────────────────
function SlideCompetitiveAdvantages() {
  return (
    <div className="space-y-8">
      <SlideHero chapter="ما الذي يجمعه النظام؟"
        ar="رحلة مترابطة،\nبدلاً من أدوات متفرقة." />
      <FadeIn delay={0.1}>
        <SplitComparison
          leftTitle="أدوات متفرقة"
          rightTitle="ثناره"
          left={['إدارة موزعة', 'بيانات متفرقة', 'تواصل منفصل', 'تجربة غير موحدة']}
          right={['لوحة واحدة', 'سياق مترابط', 'قنوات متصلة', 'تجربة متناسقة']}
        />
      </FadeIn>
    </div>
  );
}

// ─── Section: Roadmap ─────────────────────────────────────────────────────────
function SlideRoadmap() {
  const future = [
    { ar: 'تطوير أدوات العيادة' },
    { ar: 'تحسين تجربة المريض' },
    { ar: 'توسيع التكاملات' },
    { ar: 'تطوير الموقع والتطبيق' },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="مجالات التطوير"
        ar="تتطور المنظومة،\nمع احتياج المنشأة." />
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
      month: 'التأسيس', color: '#E0EEE4',
      items: ['الهوية والبيانات', 'الصلاحيات', 'الخدمات الأساسية'],
    },
    {
      month: 'التشغيل', color: '#F6E5D7',
      items: ['إدارة العمل', 'الحجز والتواصل', 'مساندة الفريق'],
    },
    {
      month: 'التوسع', color: '#E9E8F0',
      items: ['موقع وتطبيق', 'تكاملات إضافية', 'خدمات حسب الحاجة'],
    },
  ];
  return (
    <div className="space-y-8">
      <SlideHero chapter="مراحل العمل"
        ar="خطوات واضحة،\nمن دون وعود زمنية غير مؤكدة." />
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {phases.map((phase, i) => (
            <motion.div key={i} variants={fadeUp}
              className="rounded-2xl overflow-hidden shadow-sm"
              style={{ border: `1px solid ${C.soft}40` }}>
              <div className="px-5 py-3 font-bold text-sm" style={{ background: phase.color, color: C.dark }}>
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
    { role: 'للمنشأة', items: ['اطلب عرضاً توضيحياً'], color: '#E0EEE4' },
    { role: 'للشريك',   items: ['ناقش فرص التعاون'], color: '#F6E5D7' },
    { role: 'للمهتم',   items: ['تعرّف على الباقات'], color: '#E9E8F0' },
  ];
  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="text-center space-y-4">
          <ThanarahIcon size={48} />
          <h1 className="text-2xl md:text-3xl xl:text-4xl font-bold leading-tight" style={{ color: C.ink }}>
            ثناره تجمع<br />
            <span style={{ color: C.primary }}>إدارة العيادة وتجربة المريض.</span>
          </h1>
          <p className="text-lg md:text-xl font-medium" style={{ color: C.muted }}>
            منظومة واحدة، ومساحة أوضح للعمل.
          </p>
          <div className="pt-4">
            <span className="text-xl font-bold" style={{ color: C.primary }}>
              ثناره — تقنية تخدم الرعاية
            </span>
          </div>
        </div>
      </FadeIn>
      <FadeIn delay={0.2}>
        <h2 dir="rtl" className="text-base font-bold mb-4" style={{ color: C.primary }}>الخطوة التالية</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {nextSteps.map((ns, i) => (
            <motion.div key={i} variants={fadeUp}
              className="rounded-2xl overflow-hidden">
              <div className="px-5 py-3 text-center font-bold" style={{ background: ns.color, color: C.dark }}>
                <div className="text-sm">{ns.role}</div>
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
        <div className="text-6xl md:text-7xl font-bold leading-none select-none"
          style={{ color: `${C.soft}70` }}>
          {String(order).padStart(2, '0')}
        </div>
        <h1 dir="rtl" className="text-3xl md:text-5xl font-bold leading-tight -mt-2"
          style={{ color: C.ink }}>{titleAr}</h1>
        {descriptionAr && (
          <p dir="rtl" className="text-base md:text-lg mt-4 leading-relaxed" style={{ color: C.muted }}>
            {descriptionAr}
          </p>
        )}
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
  return (
    <div className="relative isolate">
      <div aria-hidden="true" className="pointer-events-none absolute -top-12 -left-12 h-48 w-48 rounded-full bg-[#D9EBDD]/70 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute top-[38%] -right-14 h-40 w-40 rounded-full bg-[#F3E4D4]/60 blur-3xl" />
      <div className="relative z-10">
        {Component
          ? <Component titleAr={titleAr} descriptionAr={descriptionAr} order={order} />
          : <SlideGeneric titleAr={titleAr} descriptionAr={descriptionAr} order={order} />}
      </div>
    </div>
  );
}
