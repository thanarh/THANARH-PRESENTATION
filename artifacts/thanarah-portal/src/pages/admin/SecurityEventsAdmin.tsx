import React from 'react';
import { AdminShell } from '../../components/AdminShell';
import { useListSecurityEvents } from '@workspace/api-client-react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function SecurityEventsAdmin() {
  const { data: result, isLoading } = useListSecurityEvents();
  const events = result?.data || [];

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Security Events</h1>
        <p className="text-muted-foreground">Review alerts and automated security detections.</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Event</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Severity</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">User / IP</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Time</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No security events found.
                  </td>
                </tr>
              ) : (
                events.map(event => (
                  <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground flex items-center gap-2">
                        {event.severity === 'high' || event.severity === 'critical' ? (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        ) : null}
                        {event.type}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 max-w-md truncate">{event.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        event.severity === 'critical' ? 'bg-red-500/20 text-red-600 font-bold' :
                        event.severity === 'high' ? 'bg-red-500/10 text-red-500' :
                        event.severity === 'medium' ? 'bg-orange-500/10 text-orange-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {event.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {event.userName ? <div className="text-sm font-medium">{event.userName}</div> : null}
                      <div className="text-xs text-muted-foreground">{event.ipAddress}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(event.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {event.resolved ? (
                        <span className="text-green-500 text-xs font-medium">Resolved</span>
                      ) : (
                        <span className="text-amber-500 text-xs font-medium">Open</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!event.resolved && (
                        <Button variant="outline" size="sm" className="h-8">Resolve</Button>
                      )}
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
