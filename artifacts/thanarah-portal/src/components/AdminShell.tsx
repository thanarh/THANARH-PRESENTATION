import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLogout } from '@workspace/api-client-react';
import {
  LayoutDashboard, Users, UserPlus, Shield, Activity, 
  FileText, LogOut, Settings, Key
} from 'lucide-react';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { t, isRtl } = useLanguage();
  const { user, logout: contextLogout } = useAuth();
  const [location, setLocation] = useLocation();
  const { mutate: performLogout } = useLogout();

  const handleLogout = () => {
    performLogout(undefined, {
      onSettled: () => {
        contextLogout();
        setLocation('/login');
      }
    });
  };

  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: t('dashboard') },
    { href: '/admin/users', icon: Users, label: t('users') },
    { href: '/admin/invitations', icon: UserPlus, label: t('invitations') },
    { href: '/admin/sessions', icon: Activity, label: t('sessions') },
    { href: '/admin/security-events', icon: Shield, label: t('securityEvents') },
    { href: '/admin/audit-logs', icon: Key, label: t('auditLogs') },
    { href: '/admin/content', icon: FileText, label: t('content') },
    { href: '/admin/visits', icon: Users, label: t('visits') },
    { href: '/admin/system-health', icon: Activity, label: t('systemHealth') },
    { href: '/admin/settings', icon: Settings, label: t('settings') },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className={`w-64 bg-sidebar border-${isRtl ? 'l' : 'r'} border-sidebar-border flex flex-col`}>
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl leading-none">T</span>
            </div>
            <h1 className="font-bold text-lg text-sidebar-foreground">Thanarah Admin</h1>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                  isActive 
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}>
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm">
              <p className="font-medium text-sidebar-foreground truncate max-w-[120px]">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[120px]">{user?.email}</p>
            </div>
            <LanguageSwitcher />
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors text-sm font-medium"
            data-testid="button-admin-logout"
          >
            <LogOut className="w-4 h-4" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-muted/30">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
