/**
 * SplashScreen — Thanarah branded intro
 *
 * Layout:
 *   Beige full-screen page with the horizontal logo centred.
 *   A beige panel (same size as the logo) sits on top of it and
 *   wipes away to the LEFT, revealing the logo underneath.
 *   Tagline fades in after reveal. Progress bar grows.
 *   At 3.5 s the iris panels close; onDone fires at 4.0 s.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const BG     = '#F0EAD6';
const EMERALD = '#1E6B4D';
const GOLD    = '#A07820';
const DONE_MS = 4000;

// ─── Iris exit ────────────────────────────────────────────────────────────────
function IrisExit({ active }: { active: boolean }) {
  const panels = [
    { top: 0,     left: 0,     right: '50%', bottom: '50%', origin: 'top left' },
    { top: 0,     left: '50%', right: 0,     bottom: '50%', origin: 'top right' },
    { top: '50%', left: 0,     right: '50%', bottom: 0,     origin: 'bottom left' },
    { top: '50%', left: '50%', right: 0,     bottom: 0,     origin: 'bottom right' },
  ];
  return (
    <>
      {panels.map((p, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={active ? { scale: 1 } : { scale: 0 }}
          transition={{ duration: 0.5, delay: active ? i * 0.04 : 0, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'absolute',
            top: p.top, left: p.left, right: p.right, bottom: p.bottom,
            background: BG,
            transformOrigin: p.origin,
            zIndex: 10,
          }}
        />
      ))}
    </>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface SplashScreenProps {
  onDone: () => void;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function SplashScreen({ onDone }: SplashScreenProps) {
  const [irisActive, setIrisActive] = useState(false);
  const logoRef   = useRef<HTMLImageElement>(null);
  const [logoDim, setLogoDim] = useState({ w: 360, h: 100 });

  // Measure logo once it loads so the cover can match exactly
  const onImgLoad = () => {
    if (logoRef.current) {
      setLogoDim({
        w: logoRef.current.offsetWidth,
        h: logoRef.current.offsetHeight,
      });
    }
  };

  useEffect(() => {
    const iris = setTimeout(() => setIrisActive(true), 3200);
    const done = setTimeout(onDone, DONE_MS);
    return () => { clearTimeout(iris); clearTimeout(done); };
  }, [onDone]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20000,
        overflow: 'hidden',
        background: BG,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* ── Logo + reveal cover ─────────────────────────────────────────── */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Logo — large horizontal version */}
        <img
          ref={logoRef}
          src={`${import.meta.env.BASE_URL}logo-horizontal.png`}
          alt="Thanarah"
          draggable={false}
          onLoad={onImgLoad}
          style={{
            width: 'clamp(240px, 52vw, 480px)',
            height: 'auto',
            display: 'block',
            userSelect: 'none',
            filter: `drop-shadow(0 2px 8px rgba(30,107,77,0.18))`,
          }}
        />

        {/* Beige cover — same size as logo, wipes left */}
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: -(logoDim.w + 10) }}
          transition={{ duration: 0.9, delay: 0.6, ease: [0.76, 0, 0.24, 1] }}
          style={{
            position: 'absolute',
            inset: 0,
            background: BG,
            zIndex: 2,
            originX: 0,
          }}
        />
      </div>

      {/* ── Tagline — appears after reveal ──────────────────────────────── */}
      <motion.p
        dir="rtl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1.7, ease: [0.22, 1, 0.36, 1] }}
        style={{
          marginTop: 24,
          fontFamily: "'Noto Naskh Arabic', 'Amiri', serif",
          color: EMERALD,
          fontSize: 'clamp(13px, 2vw, 18px)',
          fontWeight: 600,
          textAlign: 'center',
          letterSpacing: '0.04em',
        }}
      >
        حين تتكامل التقنية، تبدأ رعاية أفضل
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 2.1 }}
        style={{
          marginTop: 6,
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          color: GOLD,
          fontSize: 'clamp(9px, 1.2vw, 11px)',
          fontWeight: 500,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        Thanarah · Medical Technology
      </motion.p>

      {/* ── Progress bar ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 2.4, delay: 0.7, ease: 'linear' }}
        style={{
          marginTop: 36,
          width: 'clamp(80px, 18vw, 160px)',
          height: '1.5px',
          background: `linear-gradient(90deg, ${EMERALD}, ${GOLD})`,
          transformOrigin: 'left center',
          borderRadius: 2,
        }}
      />

      {/* ── Iris exit ───────────────────────────────────────────────────── */}
      <IrisExit active={irisActive} />
    </div>
  );
}
