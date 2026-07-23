import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useListPresentationSections, useGetPresentationProgress } from '@workspace/api-client-react';
import { Watermark } from './Watermark';
import { SessionTimer } from './SessionTimer';
import { ChevronRight, ChevronLeft, Menu, X, Maximize, Minimize, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PresentationShell({ children, currentSlug }: { children: React.ReactNode, currentSlug: string }) {
  const { t, isRtl } = useLanguage();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [screenshotWarning, setScreenshotWarning] = useState(false);
  const [contentBlurred, setContentBlurred] = useState(false);

  const showScreenshotWarning = useCallback(() => {
    setScreenshotWarning(true);
    setTimeout(() => setScreenshotWarning(false), 3000);
  }, []);

  const { data: sections } = useListPresentationSections();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: progress } = useGetPresentationProgress({ query: { enabled: !!user } as any });

  const sortedSections = [...(sections || [])].sort((a, b) => a.order - b.order);
  const currentIndex = sortedSections.findIndex(s => s.slug === currentSlug);
  const currentSection = sortedSections[currentIndex];
  
  const prevSection = currentIndex > 0 ? sortedSections[currentIndex - 1] : null;
  const nextSection = currentIndex < sortedSections.length - 1 ? sortedSections[currentIndex + 1] : null;

  // Handle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle Keyboard Nav
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        if (isRtl && prevSection && !prevSection.isLocked) setLocation(`/presentation/${prevSection.slug}`);
        else if (!isRtl && nextSection && !nextSection.isLocked) setLocation(`/presentation/${nextSection.slug}`);
      } else if (e.key === 'ArrowLeft') {
        if (isRtl && nextSection && !nextSection.isLocked) setLocation(`/presentation/${nextSection.slug}`);
        else if (!isRtl && prevSection && !prevSection.isLocked) setLocation(`/presentation/${prevSection.slug}`);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRtl, nextSection, prevSection, setLocation]);

  // ── Blur content when user switches tab / window ────────────
  useEffect(() => {
    const handleVisibility = () => setContentBlurred(document.hidden);
    const handleBlur = () => setContentBlurred(true);
    const handleFocus = () => setContentBlurred(false);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // ── Content-protection layer ────────────────────────────────
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();

    // Block context-menu, text-selection and drag
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('selectstart', preventDefault);
    document.addEventListener('dragstart', preventDefault);

    // Block keyboard shortcuts that expose/copy content:
    //   F12, Ctrl+Shift+I/J/C  → DevTools
    //   Ctrl+U                 → View source
    //   Ctrl+S                 → Save page
    //   Ctrl+P                 → Print dialog
    //   Ctrl+A                 → Select all
    const blockKeys = (e: KeyboardEvent) => {
      const ctrl  = e.ctrlKey  || e.metaKey;   // Cmd on macOS
      const shift = e.shiftKey;
      const key   = e.key;

      // Detect PrintScreen — show warning (browsers cannot fully block OS screenshots)
      if (key === 'PrintScreen') {
        e.preventDefault();
        showScreenshotWarning();
        return;
      }

      const isDevTools  = key === 'F12'
                        || (ctrl && shift && ['I','i','J','j','C','c'].includes(key));
      const isViewSrc   = ctrl && !shift && ['U','u'].includes(key);
      const isSavePage  = ctrl && !shift && ['S','s'].includes(key);
      const isPrint     = ctrl && !shift && ['P','p'].includes(key);
      const isSelectAll = ctrl && !shift && ['A','a'].includes(key);

      if (isDevTools || isViewSrc || isSavePage || isPrint || isSelectAll) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('keydown', blockKeys, { capture: true });

    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('selectstart', preventDefault);
      document.removeEventListener('dragstart', preventDefault);
      document.removeEventListener('keydown', blockKeys, { capture: true } as EventListenerOptions);
    };
  }, [showScreenshotWarning]);

  const completionPercent = progress?.completionPercent || 0;

  return (
    <div className="presentation-shell flex h-screen bg-background text-foreground overflow-hidden selection:bg-transparent">
      {/* ── Print + screenshot CSS deterrents ─────────────────── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          body::after {
            visibility: visible !important;
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: bold;
            color: #1E6B4D;
            content: "⛔  هذا المحتوى سري ومحمي  |  Confidential – Not for distribution";
            white-space: pre;
          }
        }
        /* Prevent text selection globally inside the presentation */
        .presentation-shell * {
          -webkit-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      `}</style>
      <Watermark />
      <SessionTimer />

      {/* ── Blur overlay — hides content when tab is switched ─── */}
      <AnimatePresence>
        {contentBlurred && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99998] flex items-center justify-center"
            style={{ backdropFilter: 'blur(40px)', background: 'rgba(4,12,8,0.85)' }}
          >
            <div className="text-center space-y-3">
              <div className="text-4xl">🔒</div>
              <p dir="rtl" className="text-white font-bold text-lg">المحتوى مخفي أثناء غيابك</p>
              <p className="text-sm" style={{ color: '#A9CBB5' }}>Content hidden while away</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PrintScreen warning overlay ───────────────────────── */}
      <AnimatePresence>
        {screenshotWarning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none"
          >
            <div className="rounded-2xl px-8 py-6 text-center shadow-2xl max-w-sm mx-4"
              style={{ background: '#1a1a1a', border: '1px solid #E53E3E' }}>
              <div className="text-3xl mb-3">⛔</div>
              <p dir="rtl" className="text-white font-bold text-lg mb-1">
                تم تسجيل محاولة التقاط الشاشة
              </p>
              <p className="text-red-400 text-sm font-medium">
                Screenshot attempt logged
              </p>
              <p dir="rtl" className="text-gray-400 text-xs mt-2">
                هذا المحتوى محمي ومُسجَّل بهويتك
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          x: sidebarOpen ? 0 : (isRtl ? '100%' : '-100%'),
        }}
        className={`fixed lg:relative z-50 w-72 h-full bg-sidebar border-${isRtl ? 'l' : 'r'} border-sidebar-border flex flex-col transition-transform lg:translate-x-0 ${isRtl ? 'right-0' : 'left-0'}`}
      >
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
          <Link href="/dashboard" className="block">
            <img src="/logo-horizontal.png" alt="Thanarah" className="h-8 object-contain dark:invert" onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<div class="font-bold text-xl text-primary tracking-tight">Thanarah.</div>');
            }} />
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-sidebar-border bg-sidebar-accent/30">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('presentation')}</span>
            <span className="text-xs font-bold" style={{ color: '#B8960C' }}>{completionPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-1000 ease-out"
              style={{ width: `${completionPercent}%`, background: '#B8960C' }}
            />
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-0.5 px-3">
            {sortedSections.map((section, idx) => {
              const isActive = section.slug === currentSlug;
              const isLocked = section.isLocked;
              const hasViewed = progress?.visitedSections.includes(section.slug);

              return (
                <li key={section.id}>
                  {isLocked ? (
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground opacity-50 cursor-not-allowed">
                      <div className="w-6 flex justify-center text-xs font-medium">{idx + 1}</div>
                      <span className="flex-1 text-sm truncate">{isRtl ? section.titleAr : section.titleEn}</span>
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <Link href={`/presentation/${section.slug}`}>
                      <div
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
                        style={isActive ? {
                          background: '#1C1915',
                          color: '#F7F5F1',
                          fontWeight: 600,
                          boxShadow: '0 2px 10px rgba(28,25,21,0.18)',
                        } : {}}
                      >
                        <div
                          className="w-6 flex justify-center text-xs font-medium"
                          style={{ color: isActive ? 'rgba(247,245,241,0.7)' : '#B8960C' }}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </div>
                        <span className="flex-1 text-sm truncate">{isRtl ? section.titleAr : section.titleEn}</span>
                        {!isActive && hasViewed && (
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#B8960C', opacity: 0.6 }} />
                        )}
                      </div>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top bar */}
        <header className="absolute top-0 w-full z-30 p-4 lg:p-6 flex justify-between items-center pointer-events-none">
          <div className="pointer-events-auto">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="lg:hidden p-2.5 rounded-full bg-card/80 backdrop-blur border border-border shadow-sm text-foreground hover:bg-accent transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            <button 
              onClick={toggleFullscreen}
              className="p-2.5 rounded-full bg-card/80 backdrop-blur border border-border shadow-sm text-foreground hover:bg-accent transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative pt-16 pb-20 lg:pt-20 px-4 lg:px-8 xl:px-12">
          <div className="max-w-4xl mx-auto h-full flex flex-col justify-center min-h-full">
            {children}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 w-full p-6 lg:p-8 pointer-events-none flex justify-between items-center z-30">
          <div className="pointer-events-auto">
            {prevSection && !prevSection.isLocked && (
              <Link href={`/presentation/${prevSection.slug}`}>
                <button className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5 rounded-full bg-card/90 backdrop-blur border border-border shadow-sm hover:bg-accent transition-all text-sm font-medium">
                  {isRtl ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ChevronLeft className="w-4 h-4 shrink-0" />}
                  <span className="max-w-[80px] sm:max-w-[140px] truncate">{isRtl ? prevSection.titleAr : prevSection.titleEn}</span>
                </button>
              </Link>
            )}
          </div>
          
          <div className="pointer-events-auto">
            {nextSection ? (
              !nextSection.isLocked ? (
                <Link href={`/presentation/${nextSection.slug}`}>
                  <button
                    className="flex items-center gap-1.5 px-3 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm font-bold transition-all hover:brightness-110 hover:-translate-y-0.5"
                    style={{ background: '#1C1915', color: '#F7F5F1', boxShadow: '0 4px 16px rgba(28,25,21,0.22)' }}
                  >
                    <span className="max-w-[80px] sm:max-w-[140px] truncate">{isRtl ? nextSection.titleAr : nextSection.titleEn}</span>
                    {isRtl ? <ChevronLeft className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                  </button>
                </Link>
              ) : (
                <div className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5 rounded-full bg-card/50 backdrop-blur border border-border text-muted-foreground text-sm font-medium cursor-not-allowed">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span className="max-w-[80px] sm:max-w-[140px] truncate">{isRtl ? nextSection.titleAr : nextSection.titleEn}</span>
                </div>
              )
            ) : (
              <Link href="/dashboard">
                <button
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm font-bold transition-all hover:brightness-110 hover:-translate-y-0.5"
                  style={{ background: '#1C1915', color: '#F7F5F1', boxShadow: '0 4px 16px rgba(28,25,21,0.22)' }}
                >
                  <span>{t('dashboard')}</span>
                </button>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
