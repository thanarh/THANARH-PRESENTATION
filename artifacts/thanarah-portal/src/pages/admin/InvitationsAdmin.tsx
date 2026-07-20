import React, { useState } from 'react';
import { AdminShell } from '../../components/AdminShell';
import {
  useListInvitations,
  useGetInvitationStats,
  useCreateInvitation,
  useRevokeInvitation,
} from '@workspace/api-client-react';
import { Loader2, Plus, Mail, CheckCircle2, Clock, Ban, X, Send } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useQueryClient } from '@tanstack/react-query';

// ─── Create Invitation Modal ──────────────────────────────────────────────────

type CreateForm = {
  inviteeName: string;
  email: string;
  role: string;
  expiresAt: string;
  customMessage: string;
};

const EMPTY_FORM: CreateForm = {
  inviteeName: '',
  email: '',
  role: 'viewer',
  expiresAt: '',
  customMessage: '',
};

function CreateInvitationModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sentCode, setSentCode] = useState('');
  const queryClient = useQueryClient();

  const { mutate: createInvitation, isPending } = useCreateInvitation({
    mutation: {
      onSuccess: (data: any) => {
        queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
        setSentCode(data.inviteCode || '');
        setSuccess(true);
        if (!data._emailDelivered) {
          setError('تم إنشاء الدعوة لكن فشل إرسال البريد. تحقق من إعدادات SMTP.');
        }
      },
      onError: (err: any) => {
        setError(err?.error || err?.message || 'حدث خطأ أثناء إنشاء الدعوة');
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.inviteeName || !form.email || !form.expiresAt) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    createInvitation({
      data: {
        inviteeName: form.inviteeName,
        email: form.email,
        role: form.role,
        expiresAt: new Date(form.expiresAt).toISOString(),
        customMessage: form.customMessage || undefined,
        allowedSections: [],
        permissions: [],
      } as any,
    });
  };

  // Default expiry: 7 days from now
  const defaultExpiry = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-8 text-center relative">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">تم إرسال الدعوة!</h2>
          {sentCode && (
            <>
              <p className="text-muted-foreground text-sm mb-4">كود الدعوة الذي أُرسل عبر البريد:</p>
              <div className="bg-muted rounded-xl px-6 py-4 font-mono text-2xl font-bold tracking-widest text-primary mb-6 select-all">
                {sentCode}
              </div>
            </>
          )}
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3 mb-4">{error}</p>
          )}
          <Button className="w-full" onClick={onClose}>إغلاق</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-7 pb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">إنشاء دعوة جديدة</h2>
            <p className="text-sm text-muted-foreground mt-0.5">سيتم إرسال الكود تلقائياً على البريد</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>الاسم الكامل <span className="text-destructive">*</span></Label>
              <Input
                placeholder="محمد أحمد"
                value={form.inviteeName}
                onChange={e => setForm(f => ({ ...f, inviteeName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>البريد الإلكتروني <span className="text-destructive">*</span></Label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>الصلاحية</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              >
                <option value="viewer">Viewer — مشاهد</option>
                <option value="investor">Investor — مستثمر</option>
                <option value="partner">Partner — شريك</option>
                <option value="admin">Admin — مدير</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>تاريخ الانتهاء <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                defaultValue={defaultExpiry()}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>رسالة مخصصة (اختياري)</Label>
            <Input
              placeholder="مرحباً، يسعدنا دعوتك للاطلاع على..."
              value={form.customMessage}
              onChange={e => setForm(f => ({ ...f, customMessage: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" className="flex-1 gap-2" disabled={isPending}>
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  إرسال الدعوة
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InvitationsAdmin() {
  const [showCreate, setShowCreate] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: statsData } = useGetInvitationStats();
  const { data: result, isLoading } = useListInvitations();

  const { mutate: revokeInvitation } = useRevokeInvitation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
        setRevokingId(null);
      },
    },
  });

  const invitations = result?.data || [];

  const stats = [
    { label: 'نشطة', value: statsData?.active || 0, icon: CheckCircle2, color: 'text-green-500' },
    { label: 'لم تُفتح', value: statsData?.unopened || 0, icon: Mail, color: 'text-blue-500' },
    { label: 'منتهية', value: statsData?.expired || 0, icon: Clock, color: 'text-orange-500' },
    { label: 'ملغاة', value: statsData?.revoked || 0, icon: Ban, color: 'text-red-500' },
  ];

  const statusLabel: Record<string, { ar: string; cls: string }> = {
    active:    { ar: 'نشطة',     cls: 'bg-green-500/10 text-green-600' },
    sent:      { ar: 'مُرسَلة',   cls: 'bg-blue-500/10 text-blue-600' },
    expired:   { ar: 'منتهية',   cls: 'bg-orange-500/10 text-orange-600' },
    revoked:   { ar: 'ملغاة',    cls: 'bg-red-500/10 text-red-600' },
    draft:     { ar: 'مسودة',    cls: 'bg-muted text-muted-foreground' },
    failed_delivery: { ar: 'فشل الإرسال', cls: 'bg-red-500/10 text-red-600' },
  };

  return (
    <AdminShell>
      {showCreate && <CreateInvitationModal onClose={() => setShowCreate(false)} />}

      <div className="mb-8 flex justify-between items-end" dir="rtl">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">الدعوات</h1>
          <p className="text-muted-foreground text-sm">إدارة دعوات الوصول الآمن إلى البوابة</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />
          إنشاء دعوة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden" dir="rtl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-right font-semibold text-muted-foreground">المدعو</th>
                <th className="px-6 py-3 text-right font-semibold text-muted-foreground">الكود</th>
                <th className="px-6 py-3 text-right font-semibold text-muted-foreground">الصلاحية</th>
                <th className="px-6 py-3 text-right font-semibold text-muted-foreground">الحالة</th>
                <th className="px-6 py-3 text-right font-semibold text-muted-foreground">ينتهي</th>
                <th className="px-6 py-3 text-right font-semibold text-muted-foreground">الاستخدام</th>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : invitations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-muted-foreground">
                    <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>لا توجد دعوات بعد.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 gap-2"
                      onClick={() => setShowCreate(true)}
                    >
                      <Plus className="w-4 h-4" />
                      إنشاء أول دعوة
                    </Button>
                  </td>
                </tr>
              ) : (
                invitations.map(inv => {
                  const s = statusLabel[inv.status] ?? { ar: inv.status, cls: 'bg-muted text-muted-foreground' };
                  return (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{inv.inviteeName}</div>
                        <div className="text-xs text-muted-foreground">{inv.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        {(inv as any).inviteCode ? (
                          <span className="font-mono text-sm font-bold tracking-widest bg-muted px-2 py-1 rounded">
                            {(inv as any).inviteCode}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 capitalize text-sm">{inv.role}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${s.cls}`}>
                          {s.ar}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        {new Date(inv.expiresAt).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {inv.usedCount} / {inv.maxLogins || '∞'}
                      </td>
                      <td className="px-6 py-4 text-left">
                        {inv.status !== 'revoked' && inv.status !== 'expired' && (
                          revokingId === inv.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">تأكيد الإلغاء؟</span>
                              <button
                                className="text-destructive text-xs font-medium hover:underline"
                                onClick={() => revokeInvitation({ id: inv.id!, data: { reason: 'Revoked by admin' } })}
                              >
                                نعم
                              </button>
                              <button
                                className="text-muted-foreground text-xs hover:underline"
                                onClick={() => setRevokingId(null)}
                              >
                                لا
                              </button>
                            </div>
                          ) : (
                            <button
                              className="text-destructive text-sm font-medium hover:underline"
                              onClick={() => setRevokingId(inv.id!)}
                            >
                              إلغاء
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
