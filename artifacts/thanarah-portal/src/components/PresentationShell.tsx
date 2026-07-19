import React, { useEffect, useState } from 'react';
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

  // Anti-inspect & copy
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('selectstart', preventDefault);
    document.addEventListener('dragstart', preventDefault);
    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('selectstart', preventDefault);
      document.removeEventListener('dragstart', preventDefault);
    };
  }, []);

  const completionPercent = progress?.completionPercent || 0;

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden selection:bg-transparent">
      <Watermark />
      <SessionTimer />

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
            <span className="text-xs font-bold text-primary">{completionPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000 ease-out"
              style={{ width: `${completionPercent}%` }}
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
                      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                        isActive 
                          ? 'bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20' 
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}>
                        <div className={`w-6 flex justify-center text-xs font-medium ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                          {idx + 1}
                        </div>
                        <span className="flex-1 text-sm truncate">{isRtl ? section.titleAr : section.titleEn}</span>
                        {!isActive && hasViewed && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative pt-20 pb-24 lg:pt-24 px-6 lg:px-16 xl:px-24">
          <div className="max-w-5xl mx-auto h-full flex flex-col justify-center min-h-full">
            {children}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 w-full p-6 lg:p-8 pointer-events-none flex justify-between items-center z-30">
          <div className="pointer-events-auto">
            {prevSection && !prevSection.isLocked && (
              <Link href={`/presentation/${prevSection.slug}`}>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-card/90 backdrop-blur border border-border shadow-sm hover:bg-accent transition-all text-sm font-medium">
                  {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  <span>{isRtl ? prevSection.titleAr : prevSection.titleEn}</span>
                </button>
              </Link>
            )}
          </div>
          
          <div className="pointer-events-auto">
            {nextSection ? (
              !nextSection.isLocked ? (
                <Link href={`/presentation/${nextSection.slug}`}>
                  <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110 hover:-translate-y-0.5 transition-all text-sm font-bold">
                    <span>{isRtl ? nextSection.titleAr : nextSection.titleEn}</span>
                    {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </Link>
              ) : (
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-card/50 backdrop-blur border border-border text-muted-foreground text-sm font-medium cursor-not-allowed">
                  <Lock className="w-4 h-4" />
                  <span>{isRtl ? nextSection.titleAr : nextSection.titleEn}</span>
                </div>
              )
            ) : (
              <Link href="/dashboard">
                <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110 hover:-translate-y-0.5 transition-all text-sm font-bold">
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
