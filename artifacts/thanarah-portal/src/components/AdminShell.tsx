import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLogout } from '@workspace/api-client-react';
import {
  LayoutDashboard, Users, UserPlus, Shield, Activity,
  FileText, LogOut, Settings, Key, Menu, X, ChevronRight,
  Globe, Heart, MessageSquare
} from 'lucide-react';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { t, isRtl } = useLanguage();
  const { user, logout: contextLogout } = useAuth();
  const [location, setLocation] = useLocation();
  const { mutate: performLogout } = useLogout();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [location]);

  // Close sidebar on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSidebarOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleLogout = () => {
    performLogout(undefined, {
      onSettled: () => { contextLogout(); setLocation('/login'); }
    });
  };

  const navItems = [
    { href: '/admin',                    icon: LayoutDashboard, labelKey: 'dashboard' },
    { href: '/admin/users',              icon: Users,           labelKey: 'users' },
    { href: '/admin/invitations',        icon: UserPlus,        labelKey: 'invitations' },
    { href: '/admin/content',            icon: FileText,        labelKey: 'content' },
    { href: '/admin/sessions',           icon: Activity,        labelKey: 'sessions' },
    { href: '/admin/security-events',    icon: Shield,          labelKey: 'securityEvents' },
    { href: '/admin/audit-logs',         icon: Key,             labelKey: 'auditLogs' },
    { href: '/admin/visits',             icon: Globe,           labelKey: 'visits' },
    { href: '/admin/system-health',      icon: Heart,           labelKey: 'systemHealth' },
    { href: '/admin/whatsapp',           icon: MessageSquare,   labelKey: 'whatsapp' },
    { href: '/admin/settings',           icon: Settings,        labelKey: 'settings' },
  ] as const;

  const SidebarContent = () => (
    <>
      {/* Logo header */}
      <div className="p-5 border-b border-sidebar-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 overflow-hidden">
            <img src="/logo-icon.png" alt="Thanarah" className="w-6 h-6 object-contain" />
          </div>
          <h1 className="font-bold text-base text-sidebar-foreground tracking-tight">Thanarah Admin</h1>
        </div>
        {/* Close button — mobile only */}
        <button
          className="md:hidden p-1.5 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== '/admin' && location.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{t(item.labelKey)}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0 opacity-60" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-sidebar-border shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            {user?.fullName?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sidebar-foreground text-sm truncate">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
          </div>
          <LanguageSwitcher />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          {t('logout')}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">

      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className={`
        hidden md:flex flex-col w-60 shrink-0
        bg-sidebar border-${isRtl ? 'l' : 'r'} border-sidebar-border
      `}>
        <SidebarContent />
      </aside>

      {/* ── Mobile overlay backdrop ──────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Mobile sidebar drawer ────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 z-50 flex flex-col w-72 max-w-[85vw]
        bg-sidebar border-${isRtl ? 'l' : 'r'} border-sidebar-border
        shadow-2xl transition-transform duration-300 ease-out md:hidden
        ${isRtl ? 'right-0' : 'left-0'}
        ${sidebarOpen
          ? 'translate-x-0'
          : isRtl ? 'translate-x-full' : '-translate-x-full'
        }
      `}>
        <SidebarContent />
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs leading-none">T</span>
            </div>
            <span className="font-semibold text-sm text-foreground">Thanarah Admin</span>
          </div>
          <div className="ml-auto">
            <LanguageSwitcher />
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
