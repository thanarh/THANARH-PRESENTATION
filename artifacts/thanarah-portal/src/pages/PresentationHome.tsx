/**
 * PresentationHome — Clean, editorial landing.
 * Warm beige only, no green, no orbiting AI diagrams.
 */

import React from 'react';
import { Link } from 'wouter';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useListPresentationSections, useGetPresentationProgress } from '@workspace/api-client-react';
import { Watermark } from '../components/Watermark';
import { SessionTimer } from '../components/SessionTimer';
import { ArrowRight, ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const WARM = {
  gold:        '#B8960C',
  goldLight:   'rgba(184,150,12,0.10)',
  ink:         '#1C1915',
  muted:       '#6B6459',
  divider:     '#E8E3DA',
  card:        '#F0EDE6',
  bg:          '#F7F5F1',
} as const;

export default function PresentationHome() {
  const { isRtl } = useLanguage();
  const { user }  = useAuth();

  const { data: sections  } = useListPresentationSections();
  const { data: progress  } = useGetPresentationProgress({
    query: { enabled: !!user } as any,
  });

  const sorted     = [...(sections ?? [])].sort((a, b) => a.order - b.order);
  const accessible = sorted.filter(s => !s.isLocked);

  const resumeSlug = (() => {
    if (!accessible.length) return '';
    if (progress?.lastSection && accessible.some(s => s.slug === progress.lastSection))
      return progress.lastSection;
    const first = accessible.find(s => !progress?.visitedSections?.includes(s.slug));
    return first?.slug ?? accessible[0]?.slug ?? '';
  })();

  const visited = progress?.visitedSections ?? [];

  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden"
      style={{ background: WARM.bg, color: WARM.ink }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <Watermark />
      <SessionTimer />

      {/* ── Thin top rule ───────────────────────────────────── */}
      <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${WARM.gold}, transparent)` }} />

      {/* ── Header ─────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-6 md:px-12 py-4"
        style={{ background: WARM.bg, borderBottom: `1px solid ${WARM.divider}` }}
      >
        <Link href="/dashboard">
          <button
            className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: WARM.muted }}
          >
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isRtl ? 'لوحة التحكم' : 'Dashboard'}
          </button>
        </Link>

        <img
          src="/logo-horizontal.png"
          alt="Thanarah"
          className="h-6 object-contain opacity-80"
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />

        <div className="text-xs font-medium" style={{ color: WARM.muted }}>
          {isRtl ? `مرحباً، ${user?.fullName?.split(' ')[0]}` : `Hi, ${user?.fullName?.split(' ')[0]}`}
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="flex flex-col items-center text-center px-6 pt-16 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl"
        >
          {/* Eyebrow */}
          <p
            className="text-xs font-semibold tracking-[0.2em] uppercase mb-5"
            style={{ color: WARM.gold }}
          >
            {isRtl ? 'عرض تقديمي خاص' : 'Private Presentation'}
          </p>

          {/* Logo mark */}
          <div
            className="w-16 h-16 rounded-full mx-auto mb-7 flex items-center justify-center"
            style={{ background: WARM.goldLight, border: `1px solid rgba(184,150,12,0.25)` }}
          >
            <img
              src="/logo-icon.png"
              alt="Thanarah"
              className="w-8 h-8 object-contain"
              onError={e => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.insertAdjacentHTML(
                  'beforeend',
                  `<span style="font-size:22px;font-weight:800;color:${WARM.gold}">ث</span>`,
                );
              }}
            />
          </div>

          <h1
            className="text-3xl md:text-4xl font-bold leading-snug mb-4"
            style={{ color: WARM.ink, letterSpacing: '-0.02em' }}
          >
            {isRtl ? 'نظام ثناره الطبي الشامل' : 'Thanarah Unified Medical System'}
          </h1>

          <p className="text-base leading-relaxed mb-8" style={{ color: WARM.muted }}>
            {isRtl
              ? 'مستقبل إدارة الرعاية الصحية — مُعدّ خصيصاً لك.'
              : 'The future of healthcare management — prepared exclusively for you.'}
          </p>

          {resumeSlug && (
            <Link href={`/presentation/${resumeSlug}`}>
              <button
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full text-sm font-bold transition-all hover:brightness-110 hover:-translate-y-0.5"
                style={{
                  background: WARM.ink,
                  color: WARM.bg,
                  boxShadow: '0 4px 20px rgba(28,25,21,0.18)',
                }}
              >
                {visited.length > 0
                  ? (isRtl ? 'متابعة العرض' : 'Continue Presentation')
                  : (isRtl ? 'ابدأ العرض' : 'Begin Presentation')}
                {isRtl
                  ? <ArrowLeft  className="w-4 h-4" />
                  : <ArrowRight className="w-4 h-4" />}
              </button>
            </Link>
          )}
        </motion.div>
      </section>

      {/* ── Divider ────────────────────────────────────────── */}
      <div className="px-6 md:px-12 max-w-3xl mx-auto w-full">
        <div style={{ height: 1, background: WARM.divider }} />
      </div>

      {/* ── Section List ───────────────────────────────────── */}
      <section className="flex-1 px-6 md:px-12 py-10 max-w-3xl mx-auto w-full">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs font-semibold tracking-[0.15em] uppercase mb-6"
          style={{ color: WARM.muted }}
        >
          {isRtl ? 'محتويات العرض' : 'Presentation Contents'}
        </motion.p>

        <ol className="space-y-2">
          {sorted.map((section, idx) => {
            const locked    = section.isLocked;
            const hasViewed = visited.includes(section.slug);
            const title     = isRtl ? section.titleAr : section.titleEn;

            return (
              <motion.li
                key={section.id}
                initial={{ opacity: 0, x: isRtl ? 12 : -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * idx, duration: 0.4, ease: 'easeOut' }}
              >
                {locked ? (
                  <div
                    className="flex items-center gap-4 px-4 py-3.5 rounded-xl"
                    style={{ background: 'transparent', opacity: 0.4, cursor: 'not-allowed' }}
                  >
                    <span
                      className="text-xs font-mono w-5 text-center shrink-0"
                      style={{ color: WARM.muted }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1 text-sm" style={{ color: WARM.muted }}>{title}</span>
                    <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: WARM.muted }} />
                  </div>
                ) : (
                  <Link href={`/presentation/${section.slug}`}>
                    <div
                      className="flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer transition-all group"
                      style={{
                        background: 'transparent',
                        border: '1px solid transparent',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLDivElement).style.background = WARM.card;
                        (e.currentTarget as HTMLDivElement).style.borderColor = WARM.divider;
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                        (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent';
                      }}
                    >
                      <span
                        className="text-xs font-mono w-5 text-center shrink-0"
                        style={{ color: WARM.gold }}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span
                        className="flex-1 text-sm font-medium"
                        style={{ color: WARM.ink }}
                      >
                        {title}
                      </span>
                      {hasViewed && (
                        <CheckCircle2
                          className="w-4 h-4 shrink-0"
                          style={{ color: WARM.gold, opacity: 0.7 }}
                        />
                      )}
                      {isRtl
                        ? <ArrowLeft  className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: WARM.ink }} />
                        : <ArrowRight className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: WARM.ink }} />}
                    </div>
                  </Link>
                )}
              </motion.li>
            );
          })}
        </ol>
      </section>

      {/* ── Footer note ────────────────────────────────────── */}
      <footer
        className="text-center py-6 text-xs"
        style={{ color: WARM.muted, borderTop: `1px solid ${WARM.divider}`, opacity: 0.6 }}
      >
        {isRtl
          ? 'هذا العرض سري ومخصص لك شخصياً — يُمنع التوزيع أو النسخ'
          : 'This presentation is confidential and intended solely for you — distribution prohibited'}
      </footer>
    </div>
  );
}
