import React, { useEffect, useRef } from 'react';
import { useParams } from 'wouter';
import { PresentationShell } from '../components/PresentationShell';
import { useGetPresentationSection, useSavePresentationProgress } from '@workspace/api-client-react';
import { Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function PresentationViewer() {
  const { section: slug } = useParams();
  const { isRtl } = useLanguage();
  const viewStartTime = useRef<number>(Date.now());
  
  const { mutate: saveProgress } = useSavePresentationProgress();

  const { data: sectionData, isLoading, isError, error } = useGetPresentationSection(slug || '', {
    query: {
      enabled: !!slug,
      retry: false
    }
  });

  // Track time spent and mark as viewed on unmount or slug change
  useEffect(() => {
    viewStartTime.current = Date.now();
    
    return () => {
      if (slug) {
        const duration = Math.floor((Date.now() - viewStartTime.current) / 1000);
        saveProgress({ data: { sectionSlug: slug, duration } });
      }
    };
  }, [slug, saveProgress]);

  if (!slug) return null;

  if (isLoading) {
    return (
      <PresentationShell currentSlug={slug}>
        <div className="flex-1 flex flex-col items-center justify-center opacity-50">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading content...</p>
        </div>
      </PresentationShell>
    );
  }

  if (isError) {
    return (
      <PresentationShell currentSlug={slug}>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mb-4 text-destructive">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Content Unavailable</h2>
          <p className="text-muted-foreground max-w-md">
            {(error as any)?.error || 'This section is either locked, does not exist, or you do not have permission to view it.'}
          </p>
        </div>
      </PresentationShell>
    );
  }

  if (!sectionData) return null;

  const title = isRtl ? sectionData.titleAr : sectionData.titleEn;
  const description = isRtl ? sectionData.descriptionAr : sectionData.descriptionEn;

  // Placeholder renderer for dynamic content based on slug
  const renderContentBlocks = () => {
    // In a real app, this would iterate over sectionData.content blocks
    // For this design build, we simulate rich content layouts based on the slug theme
    
    return (
      <div className="space-y-12">
        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary">
          <p className="text-xl leading-relaxed text-muted-foreground">
            {description || 'Comprehensive digital transformation for modern medical facilities. Unifying management, patient care, and operations into a single intelligent platform.'}
          </p>
        </div>

        {/* Simulated feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg mb-4 flex items-center justify-center text-primary font-bold text-xl">
                0{i}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Key Advantage {i}</h3>
              <p className="text-muted-foreground">Seamless integration across all touchpoints, reducing administrative overhead by up to 40% while improving patient satisfaction scores.</p>
            </div>
          ))}
        </div>
        
        {/* Simulated data visualization placeholder */}
        <div className="mt-16 bg-card border border-border rounded-xl p-8 shadow-sm">
          <h3 className="text-xl font-bold text-foreground mb-6">Market Growth Projection</h3>
          <div className="w-full h-64 bg-background rounded-lg border border-border flex items-end px-8 pb-8 gap-4 pt-16">
            {[30, 45, 65, 80, 100].map((h, i) => (
              <div key={i} className="flex-1 bg-primary/20 rounded-t-sm relative group">
                <div 
                  className="absolute bottom-0 w-full bg-primary rounded-t-sm transition-all duration-1000" 
                  style={{ height: `${h}%` }}
                />
                <span className="absolute -bottom-6 w-full text-center text-xs text-muted-foreground font-medium tracking-wider">Y{i+1}</span>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md">
                  +{(h * 1.5).toFixed(1)}M
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <PresentationShell currentSlug={slug}>
      <motion.div
        key={slug}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <header className="mb-12 border-b border-border pb-8">
          <div className="inline-block px-3 py-1 bg-secondary/30 text-secondary-foreground text-xs font-bold uppercase tracking-wider rounded mb-4">
            Section {sectionData.order}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
            {title}
          </h1>
        </header>

        <div className="pb-12">
          {renderContentBlocks()}
        </div>
      </motion.div>
    </PresentationShell>
  );
}
