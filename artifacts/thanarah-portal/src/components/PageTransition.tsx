/**
 * PageTransition — shows the spinning Thanarah logo briefly on route change.
 * Wrap the Router with this inside WouterRouter so it has access to location.
 */

import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [visible, setVisible] = useState(false);
  const prevLocation = useRef(location);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only trigger on actual navigation (not first mount)
    if (prevLocation.current === location) return;
    prevLocation.current = location;

    // Show spinner
    setVisible(true);

    // Clear any previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Hide after 400ms — just enough to feel snappy, not sluggish
    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [location]);

  return (
    <>
      {visible && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--background, #F9F7F4)',
          }}
        >
          <img
            src={`${import.meta.env.BASE_URL}logo-icon.png`}
            alt=""
            aria-hidden="true"
            style={{
              width: 72,
              height: 72,
              animation: 'page-logo-spin 0.6s linear infinite',
            }}
          />
          <style>{`
            @keyframes page-logo-spin {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      {children}
    </>
  );
}
