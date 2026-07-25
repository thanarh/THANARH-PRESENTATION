/**
 * Dashboard — Clean, editorial investor landing page.
 * Warm beige palette only — no green, no AI decorations.
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useListPresentationSections, useGetPresentationProgress } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { ArrowRight, ArrowLeft, Lock, CheckCircle2, Clock, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { Watermark } from '../components/Watermark';

const WARM = {
  gold:      '#B8960C',
  goldLight: 'rgba(184,150,12,0.10)',
  ink:       '#1C1915',
  muted:     '#6B6459',
  divider:   '#E8E3DA',
  card:      '#F0EDE6',
  cardHover: '#EAE6DE',
  bg:        '#F7F5F1',
} as const;

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { isRtl }        = useLanguage();

  const { data: sections } = useListPresentationSections();
  const { data: progress } = useGetPresentationProgress({
    query: { enabled: !!user } as any,
  });

  const sorted     = [...(sections ?? [])].sort((a, b) => a.order - b.order);
  const accessible = sorted.filter(s => !s.isLocked);
  const visited    = progress?.visitedSections ?? [];
  const done       = visited.length;
  const total      = accessible.length;
  const pct        = total > 0 ? Math.round((done / total) * 100) : 0;

  const resumeSlug = (() => {
    if (!accessible.length) return '';
    if (progress?.lastSection && accessible.some(s => s.slug === progress.lastSection))
      return progress.lastSection;
    const first = accessible.find(s => !visited.includes(s.slug));
    return first?.slug ?? accessible[0]?.slug ?? '';
  })();

  const remainingMins = (() => {
    if (!user?.sessionExpiresAt) return 0;
    return Math.max(0, Math.floor((new Date(user.sessionExpiresAt).getTime() - Date.now()) / 60000));
  })();

  const firstName = user?.fullName?.split(' ')[0] ?? '';

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: WARM.bg, color: WARM.ink }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <Watermark />

      {/* ── Gold rule ───────────────────────────────────────── */}
      <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${WARM.gold}, transparent)` }} />

      {/* ── Header ─────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-6 md:px-12 py-4"
        style={{ background: WARM.bg, borderBottom: `1px solid ${WARM.divider}` }}
      >
        <img
          src="/logo-horizontal.png"
          alt="Thanarah"
          className="h-6 object-contain"
          style={{ opacity: 0.8 }}
          onError={e => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.insertAdjacentHTML(
              'afterend',
              `<span style="font-weight:800;font-size:15px;letter-spacing:-0.02em;color:${WARM.ink}">Thanarah.</span>`,
            );
          }}
        />

        <div className="flex items-center gap-4">
          {/* Session timer chip */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: WARM.card, color: WARM.muted, border: `1px solid ${WARM.divider}` }}
          >
            <Clock className="w-3 h-3" />
            {remainingMins}m
          </div>

          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: WARM.goldLight, color: WARM.gold, border: `1px solid rgba(184,150,12,0.3)` }}
          >
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>

          {/* Logout */}
          {logout && (
            <button
              onClick={() => logout()}
              className="p-2 rounded-lg transition-colors hover:opacity-60"
              style={{ color: WARM.muted }}
              title={isRtl ? 'تسجيل الخروج' : 'Sign out'}
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 md:px-12 py-10 space-y-12">

        {/* ── Welcome ─────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6"
        >
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] uppercase mb-2" style={{ color: WARM.gold }}>
              {isRtl ? 'بوابة ثناره الخاصة' : 'Thanarah Private Portal'}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight" style={{ letterSpacing: '-0.02em' }}>
              {isRtl ? `أهلاً، ${firstName}` : `Welcome, ${firstName}`}
            </h1>
            <p className="mt-2 text-sm" style={{ color: WARM.muted }}>
              {isRtl
                ? `${done} من ${total} أقسام مُشاهَدة`
                : `${done} of ${total} sections viewed`}
            </p>
          </div>

          {resumeSlug && (
            <Link href={`/presentation/${resumeSlug}`}>
              <button
                className="shrink-0 inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-bold transition-all hover:brightness-110 hover:-translate-y-0.5"
                style={{
                  background: WARM.ink,
                  color: WARM.bg,
                  boxShadow: '0 4px 16px rgba(28,25,21,0.18)',
                }}
              >
                {done > 0
                  ? (isRtl ? 'متابعة العرض' : 'Continue')
                  : (isRtl ? 'ابدأ العرض' : 'Begin Presentation')}
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </Link>
          )}
        </motion.section>

        {/* ── Progress bar ─────────────────────────────────── */}
        {total > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium" style={{ color: WARM.muted }}>
                {isRtl ? 'تقدم المشاهدة' : 'Viewing progress'}
              </span>
              <span className="text-xs font-bold" style={{ color: WARM.gold }}>
                {pct}%
              </span>
            </div>
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: 5, background: WARM.card }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                style={{ height: '100%', background: WARM.gold, borderRadius: 99 }}
              />
            </div>
          </motion.section>
        )}

        {/* ── Section grid ─────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p
            className="text-xs font-semibold tracking-[0.15em] uppercase mb-5"
            style={{ color: WARM.muted }}
          >
            {isRtl ? 'محتويات العرض' : 'Presentation Contents'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sorted.map((section, idx) => {
              const locked    = section.isLocked;
              const hasViewed = visited.includes(section.slug);
              const title     = isRtl ? section.titleAr : section.titleEn;

              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * idx, duration: 0.35 }}
                >
                  {locked ? (
                    <div
                      className="flex items-center gap-4 p-4 rounded-xl"
                      style={{
                        background: WARM.card,
                        border: `1px solid ${WARM.divider}`,
                        opacity: 0.45,
                        cursor: 'not-allowed',
                      }}
                    >
                      <span
                        className="text-xs font-mono w-5 text-center shrink-0"
                        style={{ color: WARM.muted }}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1 text-sm truncate" style={{ color: WARM.muted }}>
                        {title}
                      </span>
                      <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: WARM.muted }} />
                    </div>
                  ) : (
                    <Link href={`/presentation/${section.slug}`}>
                      <div
                        className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all group"
                        style={{
                          background: WARM.card,
                          border: `1px solid ${WARM.divider}`,
                        }}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLDivElement;
                          el.style.background = WARM.cardHover;
                          el.style.borderColor = 'rgba(184,150,12,0.3)';
                          el.style.transform   = 'translateY(-1px)';
                          el.style.boxShadow   = '0 4px 16px rgba(28,25,21,0.07)';
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLDivElement;
                          el.style.background  = WARM.card;
                          el.style.borderColor = WARM.divider;
                          el.style.transform   = 'none';
                          el.style.boxShadow   = 'none';
                        }}
                      >
                        <span
                          className="text-xs font-mono w-5 text-center shrink-0 font-bold"
                          style={{ color: WARM.gold }}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span
                          className="flex-1 text-sm font-medium truncate"
                          style={{ color: WARM.ink }}
                        >
                          {title}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          {hasViewed && (
                            <CheckCircle2 className="w-4 h-4" style={{ color: WARM.gold, opacity: 0.7 }} />
                          )}
                          {isRtl
                            ? <ArrowLeft  className="w-4 h-4 opacity-20 group-hover:opacity-50 transition-opacity" style={{ color: WARM.ink }} />
                            : <ArrowRight className="w-4 h-4 opacity-20 group-hover:opacity-50 transition-opacity" style={{ color: WARM.ink }} />}
                        </div>
                      </div>
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.section>

      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer
        className="text-center py-5 text-xs"
        style={{
          color: WARM.muted,
          borderTop: `1px solid ${WARM.divider}`,
          opacity: 0.55,
        }}
      >
        {isRtl
          ? 'هذا العرض سري ومحمي بتوقيعك الرقمي — يُمنع التوزيع'
          : 'Confidential — protected by your digital signature. Distribution prohibited.'}
      </footer>
    </div>
  );
}
