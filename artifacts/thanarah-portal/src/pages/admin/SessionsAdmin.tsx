import React from 'react';
import { AdminShell } from '../../components/AdminShell';
import { useListSessions } from '@workspace/api-client-react';
import { Loader2, Monitor, MapPin, Clock } from 'lucide-react';

export default function SessionsAdmin() {
  const { data: sessions, isLoading } = useListSessions();

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Active Sessions</h1>
        <p className="text-muted-foreground">Monitor and manage currently active user sessions.</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 font-semibold text-muted-foreground">User</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Device / IP</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Location</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Started</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Risk Score</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : !sessions || sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No active sessions found.
                  </td>
                </tr>
              ) : (
                sessions.map(session => (
                  <tr key={session.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {session.userName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-muted-foreground" />
                        <span>{session.deviceType}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{session.ipAddress}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{session.country || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(session.startedAt).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        session.riskScore === 'high' ? 'bg-red-500/10 text-red-500' :
                        session.riskScore === 'medium' ? 'bg-orange-500/10 text-orange-500' :
                        'bg-green-500/10 text-green-500'
                      }`}>
                        {session.riskScore}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-destructive text-sm font-medium hover:underline">Revoke</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
