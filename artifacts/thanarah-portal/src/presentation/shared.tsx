/**
 * Thanarah Vision Experience — Shared Presentation Components
 * © 2026 Thanarah Team — فريق ثناره
 */
import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

// Brand colours
export const C = {
  dark:    '#0F3D33',
  primary: '#1E6B4D',
  soft:    '#A9CBB5',
  bg:      '#F7F5F1',
  white:   '#FFFFFF',
  ink:     '#1A1A1A',
  muted:   '#6B7280',
} as const;

// Fade-in container that triggers when scrolled into view
export function FadeIn({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger children variants
export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

// Chapter badge
export function ChapterBadge({ ar, en }: { ar: string; en: string }) {
  return (
    <div className="inline-flex items-center gap-2 mb-6">
      <div className="h-px w-8" style={{ background: C.primary }} />
      <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: C.primary }}>
        {en} — {ar}
      </span>
      <div className="h-px w-8" style={{ background: C.primary }} />
    </div>
  );
}

// Dark panel
export function DarkPanel({ children, className = '', dir }: { children: React.ReactNode; className?: string; dir?: string }) {
  return (
    <div className={`rounded-2xl p-8 ${className}`} style={{ background: C.dark, color: C.white }}>
      {children}
    </div>
  );
}

// Soft card
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border p-6 shadow-sm ${className}`}
      style={{ background: C.white, borderColor: '#E5E2DC' }}>
      {children}
    </div>
  );
}

// Thanarah icon — 4-leaf cross in brand colours
export function ThanarahIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="17" y="2"  width="14" height="22" rx="7" fill={C.primary} />
      <rect x="17" y="24" width="14" height="22" rx="7" fill={C.soft} />
      <rect x="2"  y="17" width="22" height="14" rx="7" fill={C.primary} />
      <rect x="24" y="17" width="22" height="14" rx="7" fill={C.soft} />
      <rect x="17" y="17" width="14" height="14" rx="4" fill={C.dark} />
    </svg>
  );
}
