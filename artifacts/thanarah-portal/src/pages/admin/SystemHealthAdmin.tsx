import React from 'react';
import { AdminShell } from '../../components/AdminShell';
import { useGetSystemHealth } from '@workspace/api-client-react';
import { Loader2, Server, Database, Mail, Activity, Clock } from 'lucide-react';

export default function SystemHealthAdmin() {
  const { data: health, isLoading } = useGetSystemHealth();

  if (isLoading) {
    return (
      <AdminShell>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminShell>
    );
  }

  if (!health) return <AdminShell><div /></AdminShell>;

  const getStatusColor = (status: string) => {
    return status === 'healthy' || status === 'up' ? 'text-green-500 bg-green-500/10' : 
           status === 'degraded' ? 'text-orange-500 bg-orange-500/10' : 
           'text-red-500 bg-red-500/10';
  };

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">System Health</h1>
        <p className="text-muted-foreground">Monitor platform infrastructure and API statuses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Server className="w-5 h-5 text-blue-500" />
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(health.api)}`}>
              {health.api}
            </span>
          </div>
          <h3 className="font-semibold text-lg text-foreground mb-1">API Services</h3>
          <p className="text-sm text-muted-foreground">Core application interface</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-purple-500" />
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(health.database)}`}>
              {health.database}
            </span>
          </div>
          <h3 className="font-semibold text-lg text-foreground mb-1">Database</h3>
          <p className="text-sm text-muted-foreground">Primary data storage</p>
          {health.lastBackup && (
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
              Last backup: {new Date(health.lastBackup).toLocaleString()}
            </p>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-orange-500" />
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(health.email)}`}>
              {health.email}
            </span>
          </div>
          <h3 className="font-semibold text-lg text-foreground mb-1">Email Delivery</h3>
          <p className="text-sm text-muted-foreground">SMTP & Notifications</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-teal-500" />
            </div>
          </div>
          <h3 className="font-semibold text-lg text-foreground mb-1">Active Sessions</h3>
          <div className="text-3xl font-bold mt-2">{health.activeSessions}</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-gray-500" />
            </div>
          </div>
          <h3 className="font-semibold text-lg text-foreground mb-1">System Uptime</h3>
          <div className="text-3xl font-bold mt-2">{Math.floor(health.uptime / 3600)}<span className="text-lg font-medium text-muted-foreground ml-1">hrs</span></div>
        </div>
      </div>
    </AdminShell>
  );
}
