import "./_group.css";
import { SlideRenderer } from "./_source/SlideRenderer";
import { Watermark } from "./_source/Watermark";

export function Current() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F7F5F1] text-[#1A1A1A]" dir="rtl">
      <Watermark />
      <main className="relative z-10 mx-auto max-w-5xl px-6 py-10 sm:px-10 sm:py-14">
        <SlideRenderer
          slug="introduction"
          titleAr="مقدمة — ما هي ثناره؟"
          descriptionAr="منظومة تقنية للمنشآت الطبية"
          order={1}
        />
      </main>
    </div>
  );
}
