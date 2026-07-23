/**
 * MobilePresentationShell — Thanarah Portal
 *
 * Full-screen, cinematic, video-like presentation for mobile.
 * Features:
 *   • Auto-advance with countdown ring (plays like a video)
 *   • Play / Pause button
 *   • Floating particle layer
 *   • Per-section gradient + glowing orb
 *   • Swipe-to-navigate
 *   • Section drawer (bottom-sheet)
 *   • Screenshot deterrent
 */
import React, {
  useEffect, useState, useRef, useCallback, useMemo,
} from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  useListPresentationSections,
  useGetPresentationProgress,
} from '@workspace/api-client-react';
import { Watermark } from './Watermark';
import { SessionTimer } from './SessionTimer';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, Lock, Grid3X3, X,
  LayoutDashboard, Play, Pause,
} from 'lucide-react';

// ── Per-section gradient palettes ─────────────────────────────────────────────
const GRADIENTS = [
  'radial-gradient(ellipse at 20% 50%, #0F3D33 0%, #071a13 55%, #030d09 100%)',
  'radial-gradient(ellipse at 80% 20%, #0d3030 0%, #051818 55%, #020b0b 100%)',
  'radial-gradient(ellipse at 50% 80%, #1a4a2a 0%, #0a2015 55%, #040f07 100%)',
  'radial-gradient(ellipse at 10% 90%, #0f2e28 0%, #060f0c 55%, #020606 100%)',
  'radial-gradient(ellipse at 90% 60%, #1a3d2e 0%, #0a1e16 55%, #040c08 100%)',
  'radial-gradient(ellipse at 40% 20%, #0a2e1a 0%, #051509 55%, #020805 100%)',
  'radial-gradient(ellipse at 70% 80%, #0d3524 0%, #071c12 55%, #030a06 100%)',
  'radial-gradient(ellipse at 30% 40%, #162e22 0%, #091a10 55%, #030907 100%)',
];

const ACCENT_COLORS = [
  'rgba(30, 107, 77, 0.45)',
  'rgba(15, 61, 51, 0.50)',
  'rgba(26, 74, 42, 0.48)',
  'rgba(20, 80, 60, 0.45)',
  'rgba(30, 107, 77, 0.40)',
  'rgba(15, 80, 50, 0.48)',
  'rgba(25, 90, 55, 0.45)',
  'rgba(20, 70, 45, 0.50)',
];

// Auto-advance delay in seconds
const AUTO_ADVANCE_SECONDS = 18;

// ── Floating particles ────────────────────────────────────────────────────────

interface Particle { id: number; x: number; y: number; size: number; duration: number; delay: number; opacity: number; }

function FloatingParticles({ seed }: { seed: number }) {
  const particles: Particle[] = useMemo(() => {
    const rng = (n: number) => ((Math.sin(n * seed * 9301 + 49297) * 233280) % 1 + 1) % 1;
    return Array.from({ length: 22 }, (_, i) => ({
      id: i,
      x: rng(i * 2) * 100,
      y: rng(i * 2 + 1) * 100,
      size: 1.5 + rng(i * 3) * 3,
      duration: 6 + rng(i * 4) * 10,
      delay: rng(i * 5) * -12,
      opacity: 0.06 + rng(i * 6) * 0.14,
    }));
  }, [seed]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -28, 0],
            x: [0, p.id % 2 === 0 ? 10 : -10, 0],
            opacity: [p.opacity, p.opacity * 2.2, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ── Countdown ring ────────────────────────────────────────────────────────────

function CountdownRing({
  seconds,
  total,
  playing,
  onToggle,
}: {
  seconds: number;
  total: number;
  playing: boolean;
  onToggle: () => void;
}) {
  const R = 18;
  const circ = 2 * Math.PI * R;
  const progress = playing ? (seconds / total) : 1;
  const dash = circ * progress;

  return (
    <button
      onClick={onToggle}
      className="relative flex items-center justify-center"
      style={{ width: 48, height: 48 }}
      aria-label={playing ? 'Pause auto-advance' : 'Play auto-advance'}
    >
      <svg width="48" height="48" className="absolute inset-0 -rotate-90">
        {/* track */}
        <circle cx="24" cy="24" r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" />
        {/* progress */}
        <motion.circle
          cx="24" cy="24" r={R}
          fill="none"
          stroke="rgba(169,203,181,0.85)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 0.4, ease: 'linear' }}
        />
      </svg>
      <div className="relative z-10 flex items-center justify-center rounded-full"
        style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(6px)' }}>
        {playing
          ? <Pause className="w-3.5 h-3.5 text-white/80" />
          : <Play  className="w-3.5 h-3.5 text-white/80 ms-0.5" />
        }
      </div>
    </button>
  );
}

// ── Section drawer ────────────────────────────────────────────────────────────

interface Section {
  id: string; slug: string; titleAr: string; titleEn: string; order: number; isLocked: boolean;
}

function SectionDrawer({
  open, onClose, sections, currentSlug, progress, isRtl,
}: {
  open: boolean; onClose: () => void; sections: Section[]; currentSlug: string; progress: any; isRtl: boolean;
}) {
  const [, setLocation] = useLocation();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a1f14] rounded-t-3xl max-h-[78vh] flex flex-col"
            style={{ borderTop: '1px solid rgba(30,107,77,0.3)' }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
              <span className="text-white font-bold text-base">
                {isRtl ? 'أقسام العرض' : 'Presentation Sections'}
              </span>
              <button onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/60">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 py-3">
              {sections.map((section, idx) => {
                const isActive  = section.slug === currentSlug;
                const hasViewed = progress?.visitedSections?.includes(section.slug);
                return (
                  <button key={section.id}
                    onClick={() => { if (!section.isLocked) { setLocation(`/presentation/${section.slug}`); onClose(); } }}
                    disabled={section.isLocked}
                    className={`w-full flex items-center gap-4 px-6 py-3.5 transition-all ${isActive ? 'bg-white/10' : 'hover:bg-white/5'} ${section.isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                    dir={isRtl ? 'rtl' : 'ltr'}
                  >
                    <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center"
                      style={{ background: GRADIENTS[idx % GRADIENTS.length], border: isActive ? '2px solid rgba(30,107,77,0.8)' : '1px solid rgba(255,255,255,0.1)' }}>
                      <span className="text-white/70 text-xs font-bold">{idx + 1}</span>
                    </div>
                    <span className={`flex-1 text-sm text-start ${isActive ? 'text-white font-semibold' : 'text-white/70'}`}>
                      {isRtl ? section.titleAr : section.titleEn}
                    </span>
                    {section.isLocked && <Lock className="w-3.5 h-3.5 text-white/40 shrink-0" />}
                    {!section.isLocked && hasViewed && !isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 shrink-0" />
                    )}
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main mobile shell ─────────────────────────────────────────────────────────

export function MobilePresentationShell({
  children,
  currentSlug,
}: {
  children: React.ReactNode;
  currentSlug: string;
}) {
  const { isRtl } = useLanguage();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [drawerOpen, setDrawerOpen]         = useState(false);
  const [screenshotWarn, setScreenshotWarn] = useState(false);
  const [playing, setPlaying]               = useState(true);
  const [countdown, setCountdown]           = useState(AUTO_ADVANCE_SECONDS);
  const [contentBlurred, setContentBlurred] = useState(false);

  const { data: sections } = useListPresentationSections();
  const { data: progress } = useGetPresentationProgress({ query: { enabled: !!user } as any });

  const sorted       = [...(sections || [])].sort((a, b) => a.order - b.order);
  const currentIndex = sorted.findIndex(s => s.slug === currentSlug);
  const prevSection  = currentIndex > 0 ? sorted[currentIndex - 1] : null;
  const nextSection  = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;

  const gradientBg  = GRADIENTS[currentIndex % GRADIENTS.length];
  const accentColor = ACCENT_COLORS[currentIndex % ACCENT_COLORS.length];
  const completionPct = progress?.completionPercent || 0;

  // ── Reset countdown on section change ────────────────────────────────────
  useEffect(() => {
    setCountdown(AUTO_ADVANCE_SECONDS);
  }, [currentSlug]);

  // ── Auto-advance countdown ────────────────────────────────────────────────
  useEffect(() => {
    if (!playing) return;
    if (countdown <= 0) {
      // advance to next unlocked section
      const target = nextSection && !nextSection.isLocked
        ? `/presentation/${nextSection.slug}`
        : nextSection === null
          ? '/dashboard'
          : null;
      if (target) setLocation(target);
      return;
    }
    const id = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [playing, countdown, nextSection, setLocation]);

  // ── Blur content when tab is switched ────────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => setContentBlurred(document.hidden);
    const handleBlur = () => setContentBlurred(true);
    const handleFocus = () => setContentBlurred(false);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // ── Screenshot deterrent ──────────────────────────────────────────────────
  const showScreenshotWarning = useCallback(() => {
    setScreenshotWarn(true);
    setTimeout(() => setScreenshotWarn(false), 3000);
  }, []);

  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('selectstart', preventDefault);
    document.addEventListener('dragstart', preventDefault);
    const blockKeys = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (e.key === 'PrintScreen') { e.preventDefault(); showScreenshotWarning(); return; }
      if (
        e.key === 'F12' ||
        (ctrl && e.shiftKey && ['I','i','J','j','C','c'].includes(e.key)) ||
        (ctrl && ['U','u','S','s','P','p','A','a'].includes(e.key))
      ) { e.preventDefault(); e.stopPropagation(); }
    };
    document.addEventListener('keydown', blockKeys, { capture: true });
    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('selectstart', preventDefault);
      document.removeEventListener('dragstart', preventDefault);
      document.removeEventListener('keydown', blockKeys, { capture: true } as EventListenerOptions);
    };
  }, [showScreenshotWarning]);

  // ── Swipe gesture ─────────────────────────────────────────────────────────
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) < Math.abs(dy) * 1.5 || Math.abs(dx) < 50) return;
    if (dx > 0) {
      const target = isRtl ? nextSection : prevSection;
      if (target && !target.isLocked) setLocation(`/presentation/${target.slug}`);
    } else {
      const target = isRtl ? prevSection : nextSection;
      if (target && !target.isLocked) setLocation(`/presentation/${target.slug}`);
    }
  };

  const navigate = (dir: 'prev' | 'next') => {
    if (dir === 'prev' && prevSection && !prevSection.isLocked) setLocation(`/presentation/${prevSection.slug}`);
    if (dir === 'next' && nextSection && !nextSection.isLocked) setLocation(`/presentation/${nextSection.slug}`);
    if (dir === 'next' && !nextSection) setLocation('/dashboard');
  };

  return (
    <div
      className="mobile-pres-shell fixed inset-0 flex flex-col overflow-hidden selection:bg-transparent"
      style={{ touchAction: 'pan-y' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <style>{`
        @media print { body * { visibility: hidden !important; } }
        .mobile-pres-shell * { -webkit-user-select: none; user-select: none; }
      `}</style>

      <Watermark />
      <SessionTimer />

      {/* ── Blur overlay ─────────────────────────────────────────── */}
      <AnimatePresence>
        {contentBlurred && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99998] flex items-center justify-center"
            style={{ backdropFilter: 'blur(40px)', background: 'rgba(4,12,8,0.88)' }}
          >
            <div className="text-center space-y-2">
              <div className="text-4xl">🔒</div>
              <p dir="rtl" className="text-white font-bold">المحتوى مخفي أثناء غيابك</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Screenshot warning ────────────────────────────────────── */}
      <AnimatePresence>
        {screenshotWarn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none"
          >
            <div className="rounded-2xl px-8 py-6 text-center shadow-2xl max-w-xs mx-4"
              style={{ background: '#1a1a1a', border: '1px solid #E53E3E' }}>
              <div className="text-3xl mb-3">⛔</div>
              <p dir="rtl" className="text-white font-bold text-base mb-1">تم تسجيل محاولة الالتقاط</p>
              <p className="text-red-400 text-sm">Screenshot attempt logged</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cinematic background — cross-fade on section change ───── */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`bg-${currentSlug}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-0"
          style={{ background: gradientBg }}
        />
      </AnimatePresence>

      {/* Slow-breathing secondary orb (always animating) */}
      <motion.div
        className="absolute z-0 pointer-events-none rounded-full"
        style={{
          width: '120vw', height: '120vw',
          top: '-30vw', left: '-10vw',
          background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
        }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Section-specific glowing orb — cross-fade */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`orb-${currentSlug}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute z-0 pointer-events-none"
          style={{
            width: '75vw', height: '75vw',
            borderRadius: '50%',
            background: accentColor,
            filter: 'blur(70px)',
            top: `${20 + (currentIndex % 4) * 10}%`,
            left: `${5 + (currentIndex % 3) * 22}%`,
          }}
        />
      </AnimatePresence>

      {/* Subtle grid */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Floating particles — re-seed on section change */}
      <AnimatePresence mode="sync">
        <motion.div key={`particles-${currentSlug}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 1.4 }} className="absolute inset-0 z-0">
          <FloatingParticles seed={currentIndex + 1} />
        </motion.div>
      </AnimatePresence>

      {/* Top vignette */}
      <div className="absolute inset-x-0 top-0 h-32 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(3,10,6,0.85) 0%, transparent 100%)' }} />
      {/* Bottom vignette */}
      <div className="absolute inset-x-0 bottom-0 h-40 z-1 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(3,10,6,0.95) 0%, transparent 100%)' }} />

      {/* ── Top bar ───────────────────────────────────────────────── */}
      <div className="relative z-20 flex items-center justify-between px-5 pt-safe-top pt-4 pb-2" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Logo */}
        <Link href="/dashboard">
          <img src={`${import.meta.env.BASE_URL}logo-icon.png`} alt="Thanarah"
            className="h-7 w-7 object-contain brightness-0 invert opacity-80"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </Link>

        {/* Section counter pill */}
        <motion.div key={currentSlug}
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
        >
          <span className="text-white/50 text-xs">{currentIndex + 1}</span>
          <span className="text-white/30 text-xs">/</span>
          <span className="text-white/50 text-xs">{sorted.length}</span>
        </motion.div>

        {/* Menu */}
        <button onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-full transition-colors"
          style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
          <Grid3X3 className="w-4 h-4 text-white/70" />
        </button>
      </div>

      {/* Thin progress bar (overall completion) */}
      <div className="relative z-20 mx-5 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <motion.div className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #1E6B4D, #A9CBB5)' }}
          initial={false}
          animate={{ width: `${completionPct}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </div>

      {/* ── Scrollable content area ────────────────────────────────── */}
      <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlug}
            initial={{ opacity: 0, y: 30, scale: 0.97, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0,  scale: 1,    filter: 'blur(0px)' }}
            exit={{   opacity: 0, y: -24, scale: 0.97, filter: 'blur(6px)' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-full px-4 pt-4 pb-32"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Section label strip */}
            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="mb-4"
            >
              <div className="flex items-center gap-2">
                <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(169,203,181,0.6), transparent)' }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.22em]"
                  style={{ color: 'rgba(169,203,181,0.75)' }}>
                  Thanarah · {String(currentIndex + 1).padStart(2, '0')}
                </span>
                <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(169,203,181,0.6))' }} />
              </div>
            </motion.div>

            {/* Slide content in frosted card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(247,245,241,0.97)',
                boxShadow: '0 12px 50px rgba(0,0,0,0.45), 0 2px 0 rgba(255,255,255,0.08) inset',
                backdropFilter: 'blur(16px)',
              }}
            >
              <div className="p-5">
                {children}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom navigation ─────────────────────────────────────── */}
      <div className="relative z-20 px-4 pb-safe-bottom pb-6 pt-2" dir={isRtl ? 'rtl' : 'ltr'}>

        {/* Dot indicators + countdown ring row */}
        <div className="flex items-center justify-between mb-3 px-1">
          {/* Dots */}
          <div className="flex gap-1.5 flex-wrap">
            {sorted.slice(0, 18).map((s) => (
              <motion.div
                key={s.id}
                animate={{
                  width:   s.slug === currentSlug ? 22 : 6,
                  opacity: s.slug === currentSlug ? 1 : s.isLocked ? 0.2 : 0.38,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="h-1.5 rounded-full cursor-pointer"
                style={{
                  background: s.slug === currentSlug
                    ? 'linear-gradient(90deg, #1E6B4D, #A9CBB5)'
                    : 'rgba(255,255,255,0.5)',
                }}
                onClick={() => { if (!s.isLocked) setLocation(`/presentation/${s.slug}`); }}
              />
            ))}
          </div>

          {/* Countdown ring (auto-advance) */}
          <CountdownRing
            seconds={countdown}
            total={AUTO_ADVANCE_SECONDS}
            playing={playing}
            onToggle={() => setPlaying(p => !p)}
          />
        </div>

        {/* Prev / Next buttons */}
        <div className="flex gap-2.5">
          {/* Prev */}
          <div className="flex-1">
            {prevSection && !prevSection.isLocked ? (
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('prev')}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-medium"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)' }}
              >
                {isRtl ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ChevronLeft className="w-4 h-4 shrink-0" />}
                <span className="truncate max-w-[90px]">{isRtl ? prevSection.titleAr : prevSection.titleEn}</span>
              </motion.button>
            ) : <div />}
          </div>

          {/* Next / Finish */}
          <div className="flex-1">
            {nextSection ? (
              !nextSection.isLocked ? (
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('next')}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, #1E6B4D, #0F3D33)', color: '#fff', boxShadow: '0 4px 24px rgba(30,107,77,0.5)' }}
                >
                  <span className="truncate max-w-[90px]">{isRtl ? nextSection.titleAr : nextSection.titleEn}</span>
                  {isRtl ? <ChevronLeft className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                </motion.button>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-medium opacity-40"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                  <Lock className="w-4 h-4" />
                  <span className="truncate max-w-[90px]">{isRtl ? nextSection.titleAr : nextSection.titleEn}</span>
                </div>
              )
            ) : (
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => setLocation('/dashboard')}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #1E6B4D, #0F3D33)', color: '#fff', boxShadow: '0 4px 24px rgba(30,107,77,0.5)' }}
              >
                <LayoutDashboard className="w-4 h-4" />
                {isRtl ? 'لوحة القيادة' : 'Dashboard'}
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* ── Section drawer ─────────────────────────────────────────── */}
      <SectionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sections={sorted}
        currentSlug={currentSlug}
        progress={progress}
        isRtl={isRtl}
      />
    </div>
  );
}
