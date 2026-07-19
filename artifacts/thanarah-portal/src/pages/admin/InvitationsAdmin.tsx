import React from 'react';
import { AdminShell } from '../../components/AdminShell';
import { useListInvitations, useGetInvitationStats } from '@workspace/api-client-react';
import { Loader2, Plus, Mail, CheckCircle2, Clock, Ban } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function InvitationsAdmin() {
  const { data: statsData } = useGetInvitationStats();
  const { data: result, isLoading } = useListInvitations();

  const invitations = result?.data || [];

  const stats = [
    { label: 'Active', value: statsData?.active || 0, icon: CheckCircle2, color: 'text-green-500' },
    { label: 'Unopened', value: statsData?.unopened || 0, icon: Mail, color: 'text-blue-500' },
    { label: 'Expired', value: statsData?.expired || 0, icon: Clock, color: 'text-orange-500' },
    { label: 'Revoked', value: statsData?.revoked || 0, icon: Ban, color: 'text-red-500' },
  ];

  return (
    <AdminShell>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Invitations</h1>
          <p className="text-muted-foreground">Manage secure access invitations to the portal.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Invitation
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Invitee</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Role</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Expires</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Used</th>
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
              ) : invitations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No invitations found.
                  </td>
                </tr>
              ) : (
                invitations.map(inv => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{inv.inviteeName}</div>
                      <div className="text-xs text-muted-foreground">{inv.email}</div>
                    </td>
                    <td className="px-6 py-4 capitalize">{inv.role}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        inv.status === 'active' ? 'bg-green-500/10 text-green-500' :
                        inv.status === 'expired' ? 'bg-orange-500/10 text-orange-500' :
                        inv.status === 'revoked' ? 'bg-red-500/10 text-red-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {inv.usedCount} / {inv.maxLogins || '∞'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button className="text-primary text-sm font-medium hover:underline">View</button>
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
