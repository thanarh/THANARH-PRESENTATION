import React from 'react';
import { AdminShell } from '../../components/AdminShell';
import { useListVisitRequests, useApproveVisitRequest, useRejectVisitRequest } from '@workspace/api-client-react';
import { Loader2, Check, X, RotateCw } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useState } from 'react';

export default function VisitsAdmin() {
  const [feedback, setFeedback] = useState('');
  const { data: requests, isLoading, refetch } = useListVisitRequests();
  const { mutate: approve, isPending: isApproving } = useApproveVisitRequest({
    mutation: {
      onSuccess: (result) => {
        setFeedback(result.message || 'Visit request updated.');
        refetch();
      },
      onError: (error: any) => setFeedback(error?.data?.error || 'Could not approve this request.'),
    }
  });
  const { mutate: reject, isPending: isRejecting } = useRejectVisitRequest({
    mutation: {
      onSuccess: (result) => {
        setFeedback(result.message || 'Visit request updated.');
        refetch();
      },
      onError: (error: any) => setFeedback(error?.data?.error || 'Could not reject this request.'),
    }
  });

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Visit Requests</h1>
        <p className="text-muted-foreground">Review applications for portal access. Approval sends a time-limited invitation and WhatsApp verification code.</p>
      </div>

      {feedback && (
        <div role="status" className="mb-4 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">
          {feedback}
        </div>
      )}

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
                      <div className="text-xs text-muted-foreground">{request.email || '—'}</div>
                      <div className="text-xs text-muted-foreground">{request.phone}</div>
                    </td>
                    <td className="px-6 py-4 capitalize text-muted-foreground">
                      {request.visitorType}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground max-w-sm whitespace-normal break-words">
                      <p>{request.reason}</p>
                      {request.rejectionReason && (
                        <p className="mt-1 text-xs text-red-600">Rejection reason: {request.rejectionReason}</p>
                      )}
                      {request.reviewedByName && (
                        <p className="mt-1 text-xs">Reviewed by {request.reviewedByName}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'approved' ? 'bg-green-500/10 text-green-500' : 
                        request.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                        'bg-orange-500/10 text-orange-500'
                      }`}>
                        {request.status === 'pending' ? 'Pending review' : request.status}
                      </span>
                      {request.notificationDeliveryStatus && (
                        <p className={`mt-1 text-xs ${
                          request.notificationDeliveryStatus === 'sent' ? 'text-green-600' : 'text-amber-600'
                        }`}>
                          WhatsApp notice: {request.notificationDeliveryStatus}
                        </p>
                      )}
                      {request.notificationDeliveryStatus === 'failed' && (
                        <a href="/admin/whatsapp" className="mt-1 inline-block text-xs text-primary underline">
                          Check WhatsApp connection
                        </a>
                      )}
                      {request.status === 'approved' && request.invitationDeliveryStatus && (
                        <p className={`mt-1 text-xs ${
                          request.invitationDeliveryStatus === 'sent' ? 'text-green-600' : 'text-amber-600'
                        }`}>
                          Invitation: {request.invitationDeliveryStatus}
                        </p>
                      )}
                      {request.status === 'rejected' && request.applicantNotificationStatus && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Applicant notice: {request.applicantNotificationStatus}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(request.status === 'pending' || (request.status === 'approved' && request.invitationDeliveryStatus === 'failed')) && (
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                            onClick={() => approve({ id: request.id })}
                            disabled={isApproving || isRejecting}
                            aria-label={request.status === 'approved' ? 'Retry invitation delivery' : 'Approve visit request'}
                            title={request.status === 'approved' ? 'Retry invitation delivery' : 'Approve visit request'}
                          >
                            {request.status === 'approved' ? <RotateCw className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                          </Button>
                          {request.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              onClick={() => reject({ id: request.id, data: { reason: 'تم الرفض من لوحة الإدارة' } })}
                              disabled={isApproving || isRejecting}
                              aria-label="Reject visit request"
                              title="Reject visit request"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
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
