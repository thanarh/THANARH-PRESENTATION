import React, { useEffect, useState } from 'react';
import { AdminShell } from '../../components/AdminShell';
import { useGetAdminDashboard } from '@workspace/api-client-react';
import { Users, UserPlus, Activity, Shield, Key, Server, Loader2, Clock, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface SectionStat {
  slug: string;
  totalDurationSeconds: number;
  visitCount: number;
  avgDurationSeconds: number;
}

function fmtDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function SectionAnalytics() {
  const [data, setData] = useState<SectionStat[] | null>(null);
  const base = (import.meta as any).env?.BASE_URL?.replace(/\/$/, '') || '';

  useEffect(() => {
    const token = localStorage.getItem('thanarah_access_token');
    if (!token) return;
    fetch(`${base}/api/presentation/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => {});
  }, [base]);

  if (!data) return null;
  if (data.length === 0) return (
    <div className="mt-8 bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
      لا توجد بيانات تحليلية بعد — ستظهر بعد أول زيارة للعرض
    </div>
  );

  const top = data.slice(0, 12);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
      className="mt-8 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <Clock className="w-5 h-5 text-primary" />
        <div>
          <h2 className="font-bold text-foreground">أكثر الأقسام مشاهدةً</h2>
          <p className="text-xs text-muted-foreground mt-0.5">مرتّبة حسب إجمالي وقت المشاهدة — أعلى تركيز = أهم للزوار</p>
        </div>
      </div>
      <div className="divide-y divide-border">
        {top.map((s, i) => {
          const maxDur = top[0]?.totalDurationSeconds || 1;
          const pct = Math.round((s.totalDurationSeconds / maxDur) * 100);
          return (
            <div key={s.slug} className="px-6 py-3 flex items-center gap-4">
              <span className="w-6 text-xs font-bold text-muted-foreground text-center shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground truncate">{s.slug}</span>
                  <div className="flex items-center gap-3 shrink-0 ms-4">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Eye className="w-3 h-3" />{s.visitCount}
                    </span>
                    <span className="text-xs font-semibold text-primary">{fmtDuration(s.totalDurationSeconds)}</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { data: dashboard, isLoading } = useGetAdminDashboard();

  if (isLoading) {
    return (
      <AdminShell>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminShell>
    );
  }

  if (!dashboard) return <AdminShell><div /></AdminShell>;

  const stats = [
    { label: 'Total Users', value: dashboard.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Active Invitations', value: dashboard.activeInvitations, icon: UserPlus, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Active Sessions', value: dashboard.activeSessions, icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Pending Visits', value: dashboard.pendingVisitRequests, icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Security Events', value: dashboard.recentSecurityEvents, icon: Shield, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Audit Logs', value: dashboard.totalAuditLogs, icon: Key, color: 'text-gray-500', bg: 'bg-gray-500/10' },
  ];

  return (
    <AdminShell>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h1>
          <p className="text-muted-foreground">Monitor system activity and security metrics.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
          <Server className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Status:</span>
          <span className={`text-sm font-bold ${dashboard.systemStatus === 'healthy' ? 'text-green-500' : 'text-amber-500'}`}>
            {dashboard.systemStatus.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-start gap-4"
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <SectionAnalytics />
    </AdminShell>
  );
}
