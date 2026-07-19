import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function Watermark() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [offset, setOffset] = useState(0);

  // Slow moving background effect
  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => (prev + 0.5) % 1000);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  const sessionId = "S-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  const dateStr = new Date().toISOString().split('T')[0];
  const watermarkText = `${user.fullName} • ${user.email} • ${sessionId} • ${dateStr} • ${t('confidential')}`;

  // SVG Pattern encoded
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
      <text x="50%" y="50%" fill="hsl(163 62% 15%)" fill-opacity="0.04" font-size="14" font-family="Inter, Cairo, sans-serif" text-anchor="middle" transform="rotate(-35 200 200)">
        ${watermarkText}
      </text>
    </svg>
  `;
  const encoded = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
      style={{
        backgroundImage: `url(${encoded})`,
        backgroundPosition: `${offset}px ${offset}px`,
        opacity: 0.8
      }}
      aria-hidden="true"
    />
  );
}
