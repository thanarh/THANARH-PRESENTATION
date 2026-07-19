import React from 'react';
import { AdminShell } from '../../components/AdminShell';
import { useListVisitRequests, useApproveVisitRequest, useRejectVisitRequest } from '@workspace/api-client-react';
import { Loader2, Check, X } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function VisitsAdmin() {
  const { data: requests, isLoading, refetch } = useListVisitRequests();
  const { mutate: approve, isPending: isApproving } = useApproveVisitRequest({
    mutation: { onSuccess: () => refetch() }
  });
  const { mutate: reject, isPending: isRejecting } = useRejectVisitRequest({
    mutation: { onSuccess: () => refetch() }
  });

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Visit Requests</h1>
        <p className="text-muted-foreground">Review applications for portal access.</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Name</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Contact</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Type</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Reason</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Status</th>
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
              ) : !requests || requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No visit requests found.
                  </td>
                </tr>
              ) : (
                requests.map(request => (
                  <tr key={request.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                      {request.fullName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-muted-foreground">{request.email}</div>
                      <div className="text-xs text-muted-foreground">{request.phone}</div>
                    </td>
                    <td className="px-6 py-4 capitalize text-muted-foreground">
                      {request.visitorType}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">
                      {request.reason}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'approved' ? 'bg-green-500/10 text-green-500' : 
                        request.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                        'bg-orange-500/10 text-orange-500'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {request.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                            onClick={() => approve({ id: request.id })}
                            disabled={isApproving || isRejecting}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => reject({ id: request.id, data: { reason: 'Not eligible' } })}
                            disabled={isApproving || isRejecting}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
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
