import React, { useEffect, useRef } from 'react';
import { useParams } from 'wouter';
import { PresentationShell } from '../components/PresentationShell';
import { MobilePresentationShell } from '../components/MobilePresentationShell';
import { useGetPresentationSection, useSavePresentationProgress } from '@workspace/api-client-react';
import { Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { SlideRenderer } from '../presentation/SlideRenderer';
import { C } from '../presentation/shared';

// Detect mobile viewport (≤ 1023px = below lg breakpoint)
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1024,
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export default function PresentationViewer() {
  const { section: slug } = useParams();
  const { isRtl } = useLanguage();
  const isMobile = useIsMobile();
  const viewStartTime = useRef<number>(Date.now());

  const { mutate: saveProgress } = useSavePresentationProgress();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sectionData, isLoading, isError, error } = useGetPresentationSection(
    slug || '',
    { query: { enabled: !!slug, retry: false } as any },
  );

  useEffect(() => {
    viewStartTime.current = Date.now();
    return () => {
      if (slug) {
        const duration = Math.floor((Date.now() - viewStartTime.current) / 1000);
        saveProgress({ data: { sectionSlug: slug, duration } });
      }
    };
  }, [slug, saveProgress]);

  if (!slug) return null;

  const Shell = isMobile ? MobilePresentationShell : PresentationShell;

  if (isLoading) {
    return (
      <Shell currentSlug={slug}>
        <div className="flex-1 flex flex-col items-center justify-center py-20" style={{ opacity: 0.4 }}>
          <Loader2 className="w-10 h-10 animate-spin mb-3" style={{ color: C.primary }} />
          <p className="text-sm font-medium" style={{ color: C.muted }}>جارٍ التحميل…</p>
        </div>
      </Shell>
    );
  }

  if (isError) {
    return (
      <Shell currentSlug={slug}>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-20">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: '#FFF5F5', color: '#E53E3E' }}>
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: C.ink }}>
            {isRtl ? 'المحتوى غير متاح' : 'Content Unavailable'}
          </h2>
          <p style={{ color: C.muted }} className="max-w-md text-sm">
            {(error as any)?.error || (isRtl
              ? 'هذا القسم مقفل أو لا تملك صلاحية لمشاهدته.'
              : 'This section is locked or you do not have permission to view it.')}
          </p>
        </div>
      </Shell>
    );
  }

  if (!sectionData) return null;

  return (
    <Shell currentSlug={slug}>
      <motion.div
        key={slug}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ paddingBottom: isMobile ? 0 : 80 }}
      >
        <SlideRenderer
          slug={slug}
          titleAr={sectionData.titleAr}
          descriptionAr={sectionData.descriptionAr ?? undefined}
          order={sectionData.order}
        />
      </motion.div>
    </Shell>
  );
}
