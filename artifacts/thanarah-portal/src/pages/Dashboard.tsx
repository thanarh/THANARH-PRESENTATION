import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useListPresentationSections, useGetPresentationProgress } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Play, FileText, Clock, ShieldCheck, CheckCircle2, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user } = useAuth();
  const { t, isRtl } = useLanguage();

  const { data: sections } = useListPresentationSections();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: progress } = useGetPresentationProgress({ query: { enabled: !!user } as any });

  const sortedSections = [...(sections || [])].sort((a, b) => a.order - b.order);
  const accessibleSections = sortedSections.filter(s => !s.isLocked);
  
  const completionPercent = progress?.completionPercent || 0;
  const visitedCount = progress?.visitedSections.length || 0;
  
  // Find where to resume
  let resumeSlug = accessibleSections[0]?.slug || '';
  if (progress?.lastSection && accessibleSections.some(s => s.slug === progress.lastSection)) {
    resumeSlug = progress.lastSection;
  } else if (progress?.visitedSections.length && accessibleSections.length > 0) {
    // Find first unvisited accessible section
    const firstUnvisited = accessibleSections.find(s => !progress.visitedSections.includes(s.slug));
    if (firstUnvisited) resumeSlug = firstUnvisited.slug;
  }

  // Calculate session time remaining based on sessionExpiresAt
  const getRemainingMinutes = () => {
    if (!user?.sessionExpiresAt) return 0;
    const expiresAt = new Date(user.sessionExpiresAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((expiresAt - now) / 60000));
  };
  const remainingMins = getRemainingMinutes();

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Header */}
      <header className="bg-card border-b border-border sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/logo-icon.png" alt="Thanarah" className="w-8 h-8 object-contain dark:invert" onError={(e) => e.currentTarget.style.display = 'none'} />
            <h1 className="text-xl font-bold text-foreground">Thanarah Portal</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/20 text-primary text-sm font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Secure Session</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user?.fullName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        
        {/* Welcome Section */}
        <section>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6"
          >
            <div>
              <p className="text-muted-foreground font-medium mb-1">{t('welcome')},</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">{user?.fullName}</h2>
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Session expires in {remainingMins} minutes
              </p>
            </div>
            
            <div className="flex gap-4">
              <Link href="/presentation">
                <button className="h-12 px-6 rounded-lg bg-card border border-border text-foreground font-semibold shadow-sm hover:bg-accent transition-colors flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {t('presentation')} Home
                </button>
              </Link>
              <Link href={`/presentation/${resumeSlug}`}>
                <button className="h-12 px-8 rounded-lg bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 hover:brightness-110 transition-all flex items-center gap-2">
                  <Play className="w-4 h-4 fill-current" />
                  {visitedCount > 0 ? t('resumePresentation') : t('startPresentation')}
                </button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Progress Overview */}
        <section>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm"
          >
            <div className="w-32 h-32 shrink-0 relative flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" stroke="currentColor" strokeWidth="8" 
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - completionPercent / 100)}`}
                  className="text-primary transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground">{completionPercent}%</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-1">Your Viewing Progress</h3>
                <p className="text-muted-foreground">You have viewed {visitedCount} out of {sortedSections.length} available sections.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-lg p-4 border border-border">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Accessible</span>
                  <span className="text-2xl font-bold text-foreground">{accessibleSections.length} <span className="text-sm font-medium text-muted-foreground">sections</span></span>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Role</span>
                  <span className="text-lg font-bold text-foreground capitalize">{user?.role}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Content Grid */}
        <section>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-2xl font-bold text-foreground">Presentation Contents</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedSections.map((section, idx) => {
                const isLocked = section.isLocked;
                const hasViewed = progress?.visitedSections.includes(section.slug);
                
                return (
                  <div 
                    key={section.id}
                    className={`relative p-5 rounded-xl border transition-all ${
                      isLocked 
                        ? 'bg-muted/50 border-border/50 opacity-70' 
                        : 'bg-card border-border hover:border-primary/50 hover:shadow-md group'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        isLocked ? 'bg-muted-foreground/20 text-muted-foreground' : 'bg-primary/10 text-primary'
                      }`}>
                        {idx + 1}
                      </div>
                      {isLocked ? (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      ) : hasViewed ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : null}
                    </div>
                    
                    <h4 className="font-bold text-foreground mb-1 truncate">{isRtl ? section.titleAr : section.titleEn}</h4>
                    <p className="text-sm text-muted-foreground truncate mb-4">Section {idx + 1} • {isLocked ? 'Restricted access' : 'Available to view'}</p>
                    
                    {!isLocked && (
                      <Link href={`/presentation/${section.slug}`}>
                        <button className="text-sm font-semibold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                          Read section
                          {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                        </button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </section>

      </main>
    </div>
  );
}
