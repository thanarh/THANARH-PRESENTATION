/**
 * Watermark — Canvas-based forensic watermark burned into every presentation screen.
 * Canvas approach: harder to remove via DevTools than CSS background-image.
 * Each session gets a unique ID stable for its lifetime.
 * Drift animation means screen recordings capture time-varying identity.
 */

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export function Watermark() {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const offsetRef = useRef(0);

  const sessionId = useMemo(
    () => 'S-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    [],
  );

  const draw = useCallback(() => {
    if (!user || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const dateStr = new Date().toISOString().split('T')[0];
    const line1   = `${user.fullName}  •  ${user.email}`;
    const line2   = `${sessionId}  •  ${dateStr}  •  CONFIDENTIAL`;

    ctx.save();
    ctx.font       = '500 13px Cairo, Inter, sans-serif';
    ctx.textAlign  = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle  = 'rgba(15,61,51,0.11)';
    ctx.rotate((-22 * Math.PI) / 180);

    const TILE_W = 580;
    const TILE_H = 300;
    const off    = offsetRef.current;

    for (let x = -TILE_W * 2 + (off % TILE_W); x < W * 2; x += TILE_W) {
      for (let y = -TILE_H * 2 + (off * 0.6 % TILE_H); y < H * 2; y += TILE_H) {
        ctx.fillStyle = 'rgba(15,61,51,0.11)';
        ctx.fillText(line1, x, y + 60);
        ctx.fillStyle = 'rgba(15,61,51,0.09)';
        ctx.fillText(line2, x, y + 80);
        ctx.fillStyle = 'rgba(15,61,51,0.11)';
        ctx.fillText(line1, x + TILE_W / 2, y + 60 + TILE_H / 2);
        ctx.fillStyle = 'rgba(15,61,51,0.09)';
        ctx.fillText(line2, x + TILE_W / 2, y + 80 + TILE_H / 2);
      }
    }
    ctx.restore();
  }, [user, sessionId]);

  // Resize canvas to fill viewport
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      draw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [draw]);

  // Drift animation
  useEffect(() => {
    if (!user) return;
    let last = 0;
    const tick = (now: number) => {
      if (now - last > 90) {
        offsetRef.current = (offsetRef.current + 0.3) % 600;
        draw();
        last = now;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [user, draw]);

  if (!user) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        pointerEvents: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    />
  );
}
