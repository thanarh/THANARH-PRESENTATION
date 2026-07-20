/**
 * PageTransition — shows the Thanarah logo briefly on route change.
 * Does NOT fire on the initial automatic redirect (e.g. / → /login).
 */

import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [visible, setVisible] = useState(false);

  // Track whether the component has been "settled" (i.e. past the first render
  // and any automatic initial redirect).  We wait for two location values before
  // treating a change as a real user-driven navigation.
  const settledRef   = useRef(false);
  const prevLocation = useRef(location);
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // First effect run: record the initial location, mark settled after 800 ms
    // (enough time for the automatic redirect to complete during the splash).
    const settleTimer = setTimeout(() => {
      prevLocation.current = location; // sync to wherever the app landed
      settledRef.current = true;
    }, 800);

    return () => clearTimeout(settleTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Don't react to location changes until we're settled
    if (!settledRef.current) return;
    if (prevLocation.current === location) return;
    prevLocation.current = location;

    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 400);

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
