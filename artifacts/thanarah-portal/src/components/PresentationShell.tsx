/**
 * PresentationShell — minimal, elegant viewer shell.
 * Design: warm beige palette (F7F5F1 / 1C1915), no green, no sidebar clutter.
 * Replaces the old sidebar with a slim top nav + floating prev/next.
 *
 * Security:
 *  • visibilitychange → blur overlay when tab is hidden
 *  • keydown capture → blocks DevTools / Print / Save / SelectAll shortcuts
 *  • PrintScreen → shows warning overlay (cannot fully block OS screenshots)
 *  • CSS: user-select: none, @media print: hides all
 *  • Watermark: canvas-based (see Watermark.tsx)
 *
 * © 2026 Thanarah Team — فريق ثناره
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useListPresentationSections, useGetPresentationProgress } from '@workspace/api-client-react';
import { Watermark } from './Watermark';
import { SessionTimer } from './SessionTimer';
import {
  ChevronRight, ChevronLeft, Menu, X, Lock,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Palette ─────────────────────────────────────────────────────────────────
const P = {
  bg:       '#F7F5F1',
  ink:      '#1C1915',
  inkSoft:  '#6B6560',
  bar:      '#FFFEFB',
  border:   '#E5E2DC',
  active:   '#1C1915',
  gold:     '#B8960C',
} as const;

// ──────────────────────────────────────────────────────────────────────────────
export function PresentationShell({
  children,
  currentSlug,
}: {
  children: React.ReactNode;
  currentSlug: string;
}) {
  const { t, isRtl }     = useLanguage();
  const { user }         = useAuth();
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [screenshotWarning, setScreenshotWarning] = useState(false);
  const [contentBlurred,    setContentBlurred]    = useState(false);

  const showScreenshotWarning = useCallback(() => {
    setScreenshotWarning(true);
    setTimeout(() => setScreenshotWarning(false), 3000);
  }, []);

  const { data: sections } = useListPresentationSections();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: progress } = useGetPresentationProgress({ query: { enabled: !!user } as any });

  const sortedSections  = [...(sections || [])].sort((a, b) => a.order - b.order);
  const currentIndex    = sortedSections.findIndex(s => s.slug === currentSlug);
  const currentSection  = sortedSections[currentIndex];
  const prevSection     = currentIndex > 0 ? sortedSections[currentIndex - 1] : null;
  const nextSection     = currentIndex < sortedSections.length - 1 ? sortedSections[currentIndex + 1] : null;
  const completionPercent = progress?.completionPercent ?? 0;

  // ── Keyboard navigation ─────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl  = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const key   = e.key;

      if (key === 'PrintScreen') {
        e.preventDefault();
        showScreenshotWarning();
        return;
      }

      // Navigation: arrow keys
      if (key === 'ArrowRight') {
        const target = isRtl ? prevSection : nextSection;
        if (target && !target.isLocked) setLocation(`/presentation/${target.slug}`);
        return;
      }
      if (key === 'ArrowLeft') {
        const target = isRtl ? nextSection : prevSection;
        if (target && !target.isLocked) setLocation(`/presentation/${target.slug}`);
        return;
      }

      // Block DevTools / source / save / print / select-all
      const isDevTools  = key === 'F12' || (ctrl && shift && /^[IiJjCc]$/.test(key));
      const isDangerous = ctrl && !shift && /^[UuSsPpAa]$/.test(key);
      if (isDevTools || isDangerous) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true } as EventListenerOptions);
  }, [isRtl, nextSection, prevSection, setLocation, showScreenshotWarning]);

  // ── Blur on tab switch only (not window.blur — causes false positives on mobile) ──
  useEffect(() => {
    const handleVisibility = () => setContentBlurred(document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // ── Content protection ──────────────────────────────────────────────
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', prevent);
    document.addEventListener('selectstart', prevent);
    document.addEventListener('dragstart',   prevent);
    return () => {
      document.removeEventListener('contextmenu', prevent);
      document.removeEventListener('selectstart', prevent);
      document.removeEventListener('dragstart',   prevent);
    };
  }, []);

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="presentation-shell flex flex-col h-screen overflow-hidden selection:bg-transparent"
      style={{ background: P.bg, color: P.ink }}
    >
      {/* ── Print CSS ──────────────────────────────────────────────────── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          body::after {
            visibility: visible !important; position: fixed; inset: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: 2rem; font-weight: 700; color: #1C1915;
            content: "⛔ هذا المحتوى سري ومحمي | Confidential – Not for distribution";
          }
        }
        .presentation-shell * {
          -webkit-user-select: none;
          user-select: none;
        }
      `}</style>

      <Watermark />
      <SessionTimer />

      {/* ── Blur overlay (tab hidden) ───────────────────────────────────── */}
      <AnimatePresence>
        {contentBlurred && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[99998] flex flex-col items-center justify-center gap-4"
            style={{ backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', background: 'rgba(28,25,21,0.88)' }}
          >
            <div className="text-4xl">🔒</div>
            <p dir="rtl" className="text-white font-bold text-lg">المحتوى مخفي أثناء غيابك</p>
            <p className="text-sm" style={{ color: '#C8C3BB' }}>Content hidden while tab is inactive</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PrintScreen warning ──────────────────────────────────────────── */}
      <AnimatePresence>
        {screenshotWarning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none"
          >
            <div className="rounded-2xl px-8 py-6 text-center shadow-2xl max-w-sm mx-4"
              style={{ background: '#1C1915', border: '1.5px solid #E53E3E' }}>
              <div className="text-3xl mb-3">⛔</div>
              <p dir="rtl" className="text-white font-bold text-lg mb-1">
                تم تسجيل محاولة التقاط الشاشة
              </p>
              <p className="text-red-400 text-sm font-medium">Screenshot attempt logged</p>
              <p dir="rtl" className="text-gray-400 text-xs mt-2">هذا المحتوى محمي ومُسجَّل بهويتك</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top navigation bar ──────────────────────────────────────────── */}
      <header
        className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 h-14 z-40 relative"
        style={{ background: P.bar, borderBottom: `1px solid ${P.border}` }}
      >
        {/* Logo / home */}
        <Link href="/dashboard">
          <div className="flex items-center gap-2 cursor-pointer select-none">
            <img
              src={`${import.meta.env.BASE_URL}logo-icon.png`}
              alt="Thanarah"
              className="h-7 w-7 object-contain"
              onError={e => (e.currentTarget.style.display = 'none')}
            />
            <span className="hidden sm:block text-sm font-bold tracking-tight" style={{ color: P.ink }}>
              ثناره
            </span>
          </div>
        </Link>

        {/* Centre — section name + breadcrumb */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold rounded-lg px-3 py-1.5 transition-colors hover:bg-black/5 max-w-xs"
            style={{ color: P.ink }}
          >
            <span className="truncate max-w-[180px]">
              {currentSection ? (isRtl ? currentSection.titleAr : currentSection.titleEn) : ''}
            </span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0" style={{ color: P.inkSoft }} />
          </button>
        </div>

        {/* Right — progress + actions */}
        <div className="flex items-center gap-3">
          {/* Progress dot */}
          <div className="hidden sm:flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold tabular-nums" style={{ color: P.gold }}>
                {completionPercent}%
              </span>
            </div>
            <div className="w-20 h-1 rounded-full overflow-hidden" style={{ background: P.border }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${completionPercent}%`, background: P.gold }}
              />
            </div>
          </div>

          {/* Section index */}
          <span className="text-xs tabular-nums font-medium" style={{ color: P.inkSoft }}>
            {currentIndex + 1} / {sortedSections.length}
          </span>
        </div>
      </header>

      {/* ── Section dropdown menu ───────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={() => setMenuOpen(false)}
            />
            <motion.nav
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute top-14 left-1/2 -translate-x-1/2 z-40 w-72 max-h-[70vh] overflow-y-auto rounded-2xl shadow-2xl"
              style={{ background: P.bar, border: `1px solid ${P.border}` }}
            >
              {/* Progress bar in menu */}
              <div className="px-5 pt-4 pb-3" style={{ borderBottom: `1px solid ${P.border}` }}>
                <div className="flex justify-between mb-2 text-xs font-semibold" style={{ color: P.inkSoft }}>
                  <span>{isRtl ? 'تقدّم العرض' : 'Progress'}</span>
                  <span style={{ color: P.gold }}>{completionPercent}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: P.border }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${completionPercent}%`, background: P.gold }}
                  />
                </div>
              </div>

              <ul className="py-2">
                {sortedSections.map((section, idx) => {
                  const isActive  = section.slug === currentSlug;
                  const isLocked  = section.isLocked;
                  const hasViewed = progress?.visitedSections?.includes(section.slug);

                  return (
                    <li key={section.id}>
                      {isLocked ? (
                        <div
                          dir={isRtl ? 'rtl' : 'ltr'}
                          className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl opacity-40 cursor-not-allowed"
                        >
                          <span className="text-xs font-medium w-5 tabular-nums" style={{ color: P.gold }}>
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="flex-1 text-sm truncate" style={{ color: P.ink }}>
                            {isRtl ? section.titleAr : section.titleEn}
                          </span>
                          <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: P.inkSoft }} />
                        </div>
                      ) : (
                        <Link href={`/presentation/${section.slug}`}>
                          <div
                            dir={isRtl ? 'rtl' : 'ltr'}
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                            style={
                              isActive
                                ? { background: P.active, color: '#F7F5F1' }
                                : { color: P.ink }
                            }
                          >
                            <span
                              className="text-xs font-medium w-5 tabular-nums shrink-0"
                              style={{ color: isActive ? 'rgba(247,245,241,0.6)' : P.gold }}
                            >
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className="flex-1 text-sm truncate">
                              {isRtl ? section.titleAr : section.titleEn}
                            </span>
                            {hasViewed && !isActive && (
                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: P.gold }} />
                            )}
                          </div>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto relative" style={{ background: P.bg }}>
        <div className="min-h-full pb-24">
          {children}
        </div>

        {/* ── Floating prev / next ─────────────────────────────────────── */}
        <div className="fixed bottom-0 w-full px-4 sm:px-8 pb-5 pointer-events-none flex justify-between items-end z-30">
          {/* Prev */}
          <div className="pointer-events-auto">
            {prevSection && !prevSection.isLocked ? (
              <Link href={`/presentation/${prevSection.slug}`}>
                <button
                  dir={isRtl ? 'rtl' : 'ltr'}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all hover:brightness-95"
                  style={{ background: P.bar, border: `1px solid ${P.border}`, color: P.ink, boxShadow: '0 2px 12px rgba(28,25,21,0.10)' }}
                >
                  {isRtl ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ChevronLeft className="w-4 h-4 shrink-0" />}
                  <span className="max-w-[100px] sm:max-w-[150px] truncate">
                    {isRtl ? prevSection.titleAr : prevSection.titleEn}
                  </span>
                </button>
              </Link>
            ) : <div />}
          </div>

          {/* Next / End */}
          <div className="pointer-events-auto">
            {nextSection ? (
              !nextSection.isLocked ? (
                <Link href={`/presentation/${nextSection.slug}`}>
                  <button
                    dir={isRtl ? 'rtl' : 'ltr'}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:brightness-110 hover:-translate-y-0.5"
                    style={{ background: P.ink, color: '#F7F5F1', boxShadow: '0 4px 16px rgba(28,25,21,0.22)' }}
                  >
                    <span className="max-w-[100px] sm:max-w-[150px] truncate">
                      {isRtl ? nextSection.titleAr : nextSection.titleEn}
                    </span>
                    {isRtl ? <ChevronLeft className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                  </button>
                </Link>
              ) : (
                <div
                  dir={isRtl ? 'rtl' : 'ltr'}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium"
                  style={{ background: '#EFEDE8', color: P.inkSoft, border: `1px solid ${P.border}` }}
                >
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span className="max-w-[100px] truncate">
                    {isRtl ? nextSection.titleAr : nextSection.titleEn}
                  </span>
                </div>
              )
            ) : (
              <Link href="/dashboard">
                <button
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:brightness-110 hover:-translate-y-0.5"
                  style={{ background: P.ink, color: '#F7F5F1', boxShadow: '0 4px 16px rgba(28,25,21,0.22)' }}
                >
                  {t('dashboard')}
                </button>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
