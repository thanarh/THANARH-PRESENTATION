/**
 * SplashScreen — Thanarah cinematic branded intro (Framer Motion).
 *
 * Sequence:
 *   0.0 s – 0.3 s  : Warm beige void.
 *   0.3 s – 0.9 s  : Grid lines materialise.
 *   0.6 s – 1.2 s  : Hexagon ring pulses in.
 *   1.0 s – 1.6 s  : Logo fades + rises with glow.
 *   1.8 s – 2.3 s  : Arabic tagline — letter by letter.
 *   2.5 s – 3.0 s  : English sub-line.
 *   3.0 s – 3.5 s  : Hold — scanline sweeps.
 *   3.5 s – 4.0 s  : Diamond-iris collapse exits.
 *   4.1 s           : onDone fires.
 */

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// ─── Timing ──────────────────────────────────────────────────────────────────
const DONE_MS = 4100;

// ─── Palette — warm beige theme ───────────────────────────────────────────────
const BG        = '#F0EAD6';          // warm linen beige
const EMERALD   = '#1E6B4D';          // brand primary
const GOLD      = '#A07820';          // deeper gold — readable on light bg
const DEEP      = '#14311F';          // near-black text
const GRID_CLR  = 'rgba(30,107,77,0.09)';
const ORB_CLR   = 'rgba(30,107,77,0.10)';

// ─── Grid ─────────────────────────────────────────────────────────────────────
function GridLines() {
  const cols = 12;
  const rows = 8;
  return (
    <motion.svg
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.4, delay: 0.3 }}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1200 800"
    >
      {Array.from({ length: cols + 1 }, (_, i) => (
        <line
          key={`v${i}`}
          x1={(i / cols) * 1200} y1={0}
          x2={(i / cols) * 1200} y2={800}
          stroke={GRID_CLR} strokeWidth="1"
        />
      ))}
      {Array.from({ length: rows + 1 }, (_, i) => (
        <line
          key={`h${i}`}
          x1={0}    y1={(i / rows) * 800}
          x2={1200} y2={(i / rows) * 800}
          stroke={GRID_CLR} strokeWidth="1"
        />
      ))}
    </motion.svg>
  );
}

// ─── Rotating hex ring ────────────────────────────────────────────────────────
function HexRing() {
  const r = 200;
  const cx = 600, cy = 400;
  const points = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
  const r2 = 260;
  const points2 = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${cx + r2 * Math.cos(a)},${cy + r2 * Math.sin(a)}`;
  }).join(' ');

  return (
    <motion.svg
      aria-hidden
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      preserveAspectRatio="xMidYMid meet"
      viewBox="0 0 1200 800"
    >
      {/* Outer ring — subtle gold */}
      <motion.polygon
        points={points2}
        fill="none"
        stroke="rgba(160,120,32,0.22)"
        strokeWidth="0.9"
        strokeDasharray="6 4"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {/* Inner ring — emerald */}
      <motion.polygon
        points={points}
        fill="none"
        stroke="rgba(30,107,77,0.28)"
        strokeWidth="1.2"
        strokeDasharray="12 6"
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {/* Corner dots */}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        return (
          <motion.circle
            key={i}
            cx={cx + r * Math.cos(a)}
            cy={cy + r * Math.sin(a)}
            r={3}
            fill={GOLD}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0.4, 0.9] }}
            transition={{ duration: 2, delay: 1.2 + i * 0.1, repeat: Infinity, repeatDelay: 3 }}
          />
        );
      })}
    </motion.svg>
  );
}

// ─── Scanline sweep ───────────────────────────────────────────────────────────
function Scanline() {
  return (
    <motion.div
      aria-hidden
      initial={{ top: '-2px', opacity: 0 }}
      animate={{ top: ['0%', '100%'], opacity: [0, 0.5, 0] }}
      transition={{ duration: 1.0, delay: 3.0, ease: 'linear' }}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${EMERALD}70, rgba(160,120,32,0.5), ${EMERALD}70, transparent)`,
        pointerEvents: 'none',
        zIndex: 5,
      }}
    />
  );
}

// ─── Glow orb ─────────────────────────────────────────────────────────────────
function GlowOrb() {
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: [0, 1, 0.7], scale: [0.4, 1.1, 1] }}
      transition={{ duration: 1.6, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'absolute',
        width: 'min(70vw, 560px)',
        height: 'min(70vw, 560px)',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${ORB_CLR} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }}
    />
  );
}

// ─── Gold accent line ─────────────────────────────────────────────────────────
function GoldLine() {
  return (
    <motion.div
      aria-hidden
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ duration: 0.7, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: 'clamp(60px, 14vw, 120px)',
        height: '1.5px',
        background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
        transformOrigin: 'center',
        marginTop: 8,
        marginBottom: 8,
      }}
    />
  );
}

// ─── Diamond iris exit — panels match BG so exit is seamless ─────────────────
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
          transition={{ duration: 0.55, delay: active ? i * 0.04 : 0, ease: [0.4, 0, 0.2, 1] }}
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

// ─── Props ───────────────────────────────────────────────────────────────────
interface SplashScreenProps {
  onDone: () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function SplashScreen({ onDone }: SplashScreenProps) {
  const [irisActive, setIrisActive] = useState(false);

  useEffect(() => {
    const iris = setTimeout(() => setIrisActive(true), 3500);
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
        pointerEvents: 'none',
      }}
    >
      {/* Ambient grid */}
      <GridLines />

      {/* Glow orb */}
      <GlowOrb />

      {/* Hex ring */}
      <HexRing />

      {/* Scanline sweep */}
      <Scanline />

      {/* ── Core content ──────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
        }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {/* Subtle warm halo on light background */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.35, 0.2] }}
            transition={{ duration: 1.4, delay: 1.3 }}
            style={{
              position: 'absolute',
              inset: '-28px',
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(30,107,77,0.18) 0%, transparent 70%)`,
              filter: 'blur(18px)',
              pointerEvents: 'none',
            }}
          />
          <img
            src={`${import.meta.env.BASE_URL}logo-horizontal.png`}
            alt="Thanarah"
            draggable={false}
            style={{
              width: 'clamp(180px, 32vw, 300px)',
              height: 'auto',
              display: 'block',
              userSelect: 'none',
              // No invert — original logo colours work on beige
              filter: `drop-shadow(0 1px 6px rgba(30,107,77,0.2)) drop-shadow(0 2px 12px rgba(0,0,0,0.08))`,
            }}
          />
        </motion.div>

        {/* Gold accent line */}
        <GoldLine />

        {/* Arabic tagline — deep colour for legibility on light bg */}
        <motion.p
          dir="rtl"
          initial={{ opacity: 0, letterSpacing: '0.4em' }}
          animate={{ opacity: 1, letterSpacing: '0.06em' }}
          transition={{ duration: 0.9, delay: 1.8, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: "'Noto Naskh Arabic', 'Amiri', serif",
            color: EMERALD,
            fontSize: 'clamp(12px, 2vw, 17px)',
            fontWeight: 600,
            margin: 0,
            textAlign: 'center',
          }}
        >
          حين تتكامل التقنية، تبدأ رعاية أفضل
        </motion.p>

        {/* English sub */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            color: GOLD,
            fontSize: 'clamp(9px, 1.3vw, 12px)',
            fontWeight: 500,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            margin: '10px 0 0',
            textAlign: 'center',
          }}
        >
          Thanarah&nbsp;·&nbsp;Medical&nbsp;Technology
        </motion.p>

        {/* Bottom progress bar */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 2.8, delay: 1.0, ease: 'linear' }}
          style={{
            marginTop: 32,
            width: 'clamp(80px, 18vw, 160px)',
            height: '1.5px',
            background: `linear-gradient(90deg, ${EMERALD}, ${GOLD})`,
            transformOrigin: 'left center',
            borderRadius: 2,
          }}
        />
      </div>

      {/* ── Iris exit panels ────────────────────────────────────────────── */}
      <IrisExit active={irisActive} />
    </div>
  );
}
