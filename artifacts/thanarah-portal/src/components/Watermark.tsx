/**
 * Watermark — Dynamic forensic watermark burned into every presentation screen.
 * Visible enough to appear in screenshots, phone photos, and screen recordings.
 *
 * Fixes vs. original:
 *  1. sessionId is stable per mount (useMemo), not regenerated every render
 *  2. SVG tiles two rows of text so coverage is dense
 *  3. Opacity 0.10 — visible in screenshots, subtle at normal viewing distance
 *  4. Uses encodeURIComponent data URL (no btoa), works with Arabic text
 *  5. Slow drift animation is kept for video capture forensics
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function Watermark() {
  const { user } = useAuth();
  const [offset, setOffset] = useState(0);

  // Stable per session — only generated once when component mounts
  const sessionId = useMemo(
    () => 'S-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    [],
  );

  // Slow drift so screen recordings contain drifting timestamps (forensic)
  useEffect(() => {
    const id = setInterval(() => setOffset((p) => (p + 0.3) % 600), 80);
    return () => clearInterval(id);
  }, []);

  if (!user) return null;

  const dateStr   = new Date().toISOString().split('T')[0];
  const line1     = `${user.fullName}  •  ${user.email}`;
  const line2     = `${sessionId}  •  ${dateStr}  •  CONFIDENTIAL`;

  // SVG tile: 600×320px with two staggered rows — repeats seamlessly
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="320">
    <text x="300" y="90"  fill="rgba(15,61,51,0.11)" font-size="13" font-family="Cairo,Inter,sans-serif" font-weight="500" text-anchor="middle" transform="rotate(-22 300 90)">${line1}</text>
    <text x="300" y="116" fill="rgba(15,61,51,0.09)" font-size="12" font-family="Cairo,Inter,sans-serif" text-anchor="middle" transform="rotate(-22 300 116)">${line2}</text>
    <text x="300" y="250" fill="rgba(15,61,51,0.11)" font-size="13" font-family="Cairo,Inter,sans-serif" font-weight="500" text-anchor="middle" transform="rotate(-22 300 250)">${line1}</text>
    <text x="300" y="276" fill="rgba(15,61,51,0.09)" font-size="12" font-family="Cairo,Inter,sans-serif" text-anchor="middle" transform="rotate(-22 300 276)">${line2}</text>
  </svg>`;

  // encodeURIComponent handles Arabic and special chars without btoa issues
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{
        zIndex: 9998,
        backgroundImage: `url("${url}")`,
        backgroundSize: '600px 320px',
        backgroundRepeat: 'repeat',
        backgroundPosition: `${offset}px ${offset * 0.6}px`,
      }}
    />
  );
}
