/**
 * PageTransition — cinematic brand wipe on route change.
 *
 * Animation (right → left):
 *   1. Beige screen appears.
 *   2. Horizontal logo is centred.  A beige cover hides it.
 *   3. Spinning logo-icon starts at the RIGHT side of the logo.
 *   4. Icon slides LEFT → simultaneously the beige cover slides
 *      LEFT, uncovering the logo from right to left.
 *   5. Icon settles at the left (icon-mark) position of the logo.
 *   6. Brief hold, then transition ends.
 */

import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';

const BG = '#F0EAD6';
const SHOW_MS    = 780;   // total visibility of the overlay
const SETTLE_MS  = 800;   // initial settle before reacting to nav

export function PageTransition({ children }: { children: React.ReactNode }) {
  const [location]    = useLocation();
  const [visible, setVisible] = useState(false);
  const settledRef    = useRef(false);
  const prevLocation  = useRef(location);
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      prevLocation.current = location;
      settledRef.current   = true;
    }, SETTLE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!settledRef.current) return;
    if (prevLocation.current === location) return;
    prevLocation.current = location;
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), SHOW_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [location]);

  return (
    <>
      <AnimatePresence>
        {visible && <TransitionOverlay key="pt-overlay" />}
      </AnimatePresence>
      {children}
    </>
  );
}

// ─── Overlay ──────────────────────────────────────────────────────────────────
function TransitionOverlay() {
  // Shared animation: icon and cover travel RIGHT → LEFT together
  const ANIM_DURATION = 0.55;
  const ANIM_DELAY    = 0.08;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Logo + cover wrapper */}
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        {/* Horizontal logo (revealed after wipe) */}
        <img
          src={`${import.meta.env.BASE_URL}logo-horizontal.png`}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{
            width: 'clamp(160px, 28vw, 280px)',
            height: 'auto',
            display: 'block',
            userSelect: 'none',
            filter: 'drop-shadow(0 1px 6px rgba(30,107,77,0.15))',
          }}
        />

        {/* Beige cover — same width as logo, slides LEFT to reveal */}
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: '-105%' }}
          transition={{ duration: ANIM_DURATION, delay: ANIM_DELAY, ease: [0.76, 0, 0.24, 1] }}
          style={{
            position: 'absolute',
            inset: 0,
            background: BG,
            zIndex: 3,
          }}
        />

        {/* Spinning icon — starts RIGHT of logo, moves to LEFT (logo-icon position) */}
        <motion.img
          src={`${import.meta.env.BASE_URL}logo-icon.png`}
          alt=""
          aria-hidden="true"
          draggable={false}
          initial={{ x: '320%', rotate: 0 }}
          animate={{ x: '-86%', rotate: 360 }}
          transition={{
            x:      { duration: ANIM_DURATION, delay: ANIM_DELAY, ease: [0.76, 0, 0.24, 1] },
            rotate: { duration: ANIM_DURATION, delay: ANIM_DELAY, ease: 'linear' },
          }}
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            translateY: '-50%',
            width:  'clamp(28px, 5vw, 46px)',
            height: 'clamp(28px, 5vw, 46px)',
            zIndex: 4,
            userSelect: 'none',
          }}
        />
      </div>
    </motion.div>
  );
}
