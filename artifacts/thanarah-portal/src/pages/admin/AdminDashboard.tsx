import React from 'react';
import { AdminShell } from '../../components/AdminShell';
import { useGetAdminDashboard } from '@workspace/api-client-react';
import { Users, UserPlus, Activity, Shield, Key, Server, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
    </AdminShell>
  );
}
