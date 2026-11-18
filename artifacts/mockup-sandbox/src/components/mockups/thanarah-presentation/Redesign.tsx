import "./_group.css";
import "./redesign.css";
import { motion } from "framer-motion";

const pillars = [
  { title: "إدارة العيادة", detail: "العمليات اليومية", icon: "01", tone: "mint" },
  { title: "تجربة المريض", detail: "من أول تواصل إلى الموعد", icon: "02", tone: "peach" },
  { title: "الحضور الرقمي", detail: "مواقع وتطبيقات", icon: "03", tone: "lilac" },
  { title: "التواصل", detail: "قنوات في مكان واحد", icon: "04", tone: "yellow" },
];

function BrandMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-10 w-10">
      <rect x="17" y="2" width="14" height="22" rx="7" fill="#1e6b4d" />
      <rect x="17" y="24" width="14" height="22" rx="7" fill="#a9cbb5" />
      <rect x="2" y="17" width="22" height="14" rx="7" fill="#1e6b4d" />
      <rect x="24" y="17" width="22" height="14" rx="7" fill="#a9cbb5" />
      <rect x="17" y="17" width="14" height="14" rx="4" fill="#0f3d33" />
    </svg>
  );
}

export function Redesign() {
  return (
    <main dir="rtl" className="thanarah-slide relative isolate min-h-[100dvh] overflow-hidden">
      <div aria-hidden="true" className="thanarah-grain pointer-events-none fixed inset-0 z-20" />
      <div aria-hidden="true" className="absolute -left-24 top-[-8rem] h-[26rem] w-[26rem] rounded-full bg-[#e3eee6] opacity-80 blur-[2px]" />
      <div aria-hidden="true" className="absolute -bottom-32 right-[35%] h-[20rem] w-[20rem] rounded-full bg-[#f7e5d7] opacity-75" />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-[1440px] flex-col px-6 py-6 sm:px-10 lg:px-16 lg:py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandMark />
            <span className="text-xl font-extrabold tracking-tight text-[#123f32]">ثناره</span>
          </div>
          <div className="rounded-full border border-[#1e6b4d]/15 bg-white/60 px-4 py-2 text-xs font-semibold tracking-wide text-[#4f7164]">
            منظومة تقنية للمنشآت الطبية
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-16 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10"
          >
            <div className="mb-7 inline-flex items-center gap-3 text-sm font-bold text-[#1e6b4d]">
              <span className="h-px w-9 bg-[#1e6b4d]" />
              الرعاية تبدأ من تجربة مترابطة
            </div>
            <h1 className="max-w-3xl text-[clamp(3.4rem,8vw,7.25rem)] font-black leading-[1.06] tracking-[-.055em] text-[#123f32]">
              عيادتك،
              <br />
              <span className="thanarah-highlight relative inline-block">كلّها معًا.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg font-medium leading-9 text-[#5c7067] sm:text-xl">
              ثناره تجمع إدارة المنشأة، تجربة المريض، المواقع والتطبيقات والتواصل في منظومة واحدة.
            </p>
            <div className="mt-9 flex items-center gap-3 text-sm font-semibold text-[#123f32]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e6b4d] text-white">←</span>
              <span>منظومة رقمية للقطاع الطبي</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-[590px]"
          >
            <div className="relative rounded-[2.2rem] border border-white/80 bg-[#fffdfa]/80 p-5 shadow-[0_28px_90px_-40px_rgba(15,61,51,.30)] backdrop-blur-sm sm:p-7">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#91a097]">مساحة عمل العيادة</div>
                  <div className="mt-1 text-lg font-extrabold text-[#123f32]">كل شيء في مكانه</div>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e4f0e8] text-[#1e6b4d]">
                  <BrandMark />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {pillars.map((pillar, index) => (
                  <motion.div
                    key={pillar.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.3 + index * 0.09 }}
                    className={`thanarah-tile thanarah-${pillar.tone} flex min-h-[142px] flex-col justify-between rounded-[1.45rem] p-4 sm:min-h-[166px] sm:p-5`}
                  >
                    <span className="font-mono text-[11px] font-bold tracking-[.16em] opacity-55">{pillar.icon}</span>
                    <div>
                      <h2 className="text-base font-extrabold sm:text-lg">{pillar.title}</h2>
                      <p className="mt-1 text-xs font-medium opacity-70 sm:text-sm">{pillar.detail}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#123f32] px-5 py-4 text-white">
                <span className="text-sm font-bold">منظومة واحدة. رعاية مترابطة.</span>
                <span className="text-lg" aria-hidden="true">✳</span>
              </div>
            </div>
            <div aria-hidden="true" className="absolute -right-5 top-16 -z-10 h-24 w-24 rounded-full border-[1.5px] border-[#1e6b4d]/20" />
            <div aria-hidden="true" className="absolute -bottom-5 left-10 -z-10 h-12 w-12 rounded-full bg-[#edbf78]" />
          </motion.div>
        </section>

        <footer className="flex items-center justify-between border-t border-[#1e6b4d]/10 pt-4 text-[11px] font-medium text-[#7e9187]">
          <span>ثناره · التقنية التي تجمع تفاصيل التشغيل</span>
          <span className="font-mono tracking-[.14em]">01 / INTRODUCTION</span>
        </footer>
      </div>

      <div aria-hidden="true" className="thanarah-watermark pointer-events-none fixed inset-0 z-10 flex items-center justify-center overflow-hidden">
        <span>THANARAH · ثناره</span>
      </div>
    </main>
  );
}
