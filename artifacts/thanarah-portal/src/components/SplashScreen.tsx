/**
 * SplashScreen — Thanarah cinematic branded intro (Framer Motion).
 *
 * Sequence:
 *   0.0 s – 0.7 s  : Logo scales + fades in.
 *   0.4 s – 1.0 s  : Orbit rings expand (staggered).
 *   0.9 s – 1.5 s  : First Arabic line slides up.
 *   1.5 s – 2.0 s  : Second Arabic line slides up.
 *   2.0 s – 2.7 s  : Hold.
 *   2.7 s – 3.3 s  : Curtain split — top slides up, bottom slides down.
 *   3.4 s           : onDone fires.
 */

import { motion } from 'framer-motion';
import { useEffect } from 'react';

// ─── Timing constants ─────────────────────────────────────────────────────────
const DONE_MS = 3400;

// ─── Brand colours ───────────────────────────────────────────────────────────
const BG      = '#F7F5F1';
const PRIMARY = '#1E6B4D';
const DARK    = '#0F3D33';

// ─── Logo width ───────────────────────────────────────────────────────────────
const LOGO_W = 'clamp(160px, 38vw, 280px)';

// ─── Orbit ring sizes ─────────────────────────────────────────────────────────
const RINGS = [
  { size: 'clamp(260px, 55vw, 420px)', border: `1.5px solid ${PRIMARY}30`, delay: 0.3 },
  { size: 'clamp(340px, 70vw, 540px)', border: `1px dashed ${PRIMARY}20`,  delay: 0.45 },
  { size: 'clamp(420px, 85vw, 660px)', border: `1px solid ${PRIMARY}12`,   delay: 0.6  },
];

const DOT_ANGLES = [0, 60, 120, 180, 240, 300];

// ─── Props ───────────────────────────────────────────────────────────────────
interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  useEffect(() => {
    const id = setTimeout(onDone, DONE_MS);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20000,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* ── Background + content layer ─────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: BG,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
        }}
      >
        {/* Orbit rings */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {RINGS.map((ring, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: ring.delay, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'absolute',
                width: ring.size,
                height: ring.size,
                borderRadius: '50%',
                border: ring.border,
              }}
            />
          ))}

          {/* Dot markers on ring 1 */}
          {DOT_ANGLES.map((deg) => (
            <motion.div
              key={deg}
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              transition={{ duration: 0.5, delay: 0.55, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: PRIMARY,
                transform: `rotate(${deg}deg) translateY(calc(clamp(130px, 27.5vw, 210px) * -1))`,
              }}
            />
          ))}
        </div>

        {/* Logo */}
        <motion.img
          src={`${import.meta.env.BASE_URL}logo-horizontal.png`}
          alt="Thanarah"
          draggable={false}
          initial={{ opacity: 0, scale: 0.82 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: LOGO_W,
            height: 'auto',
            display: 'block',
            position: 'relative',
            zIndex: 1,
            userSelect: 'none',
            filter: 'drop-shadow(0 2px 12px rgba(30,107,77,0.18))',
          }}
        />

        {/* Arabic tagline — line 1 */}
        <motion.p
          dir="rtl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: "'Noto Naskh Arabic', 'Amiri', serif",
            color: DARK,
            fontSize: 'clamp(13px, 2.2vw, 18px)',
            fontWeight: 500,
            letterSpacing: '0.02em',
            position: 'relative',
            zIndex: 1,
            margin: 0,
          }}
        >
          حين تتكامل التقنية، تبدأ رعاية أفضل.
        </motion.p>

        {/* Arabic tagline — line 2 */}
        <motion.p
          dir="rtl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: "'Noto Naskh Arabic', 'Amiri', serif",
            color: PRIMARY,
            fontSize: 'clamp(15px, 2.8vw, 22px)',
            fontWeight: 700,
            letterSpacing: '0.04em',
            position: 'relative',
            zIndex: 1,
            margin: 0,
          }}
        >
          مرحباً بك في ثناره.
        </motion.p>
      </div>

      {/* ── Top curtain ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: '-100%' }}
        transition={{ duration: 0.65, delay: 2.7, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: BG,
          zIndex: 2,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Logo top half inside curtain — creates the split illusion */}
        <div style={{ position: 'relative', paddingBottom: 14 }}>
          <img
            src={`${import.meta.env.BASE_URL}logo-horizontal.png`}
            alt=""
            aria-hidden
            draggable={false}
            style={{
              width: LOGO_W,
              height: 'auto',
              display: 'block',
              userSelect: 'none',
              filter: 'drop-shadow(0 2px 12px rgba(30,107,77,0.18))',
            }}
          />
        </div>
      </motion.div>

      {/* ── Bottom curtain ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: '100%' }}
        transition={{ duration: 0.65, delay: 2.7, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: BG,
          zIndex: 2,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Logo bottom half inside curtain */}
        <div style={{ position: 'relative', paddingTop: 14 }}>
          <img
            src={`${import.meta.env.BASE_URL}logo-horizontal.png`}
            alt=""
            aria-hidden
            draggable={false}
            style={{
              width: LOGO_W,
              height: 'auto',
              display: 'block',
              userSelect: 'none',
              filter: 'drop-shadow(0 2px 12px rgba(30,107,77,0.18))',
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
