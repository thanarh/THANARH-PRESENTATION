import React, { useState, useEffect } from 'react';
import { AdminShell } from '../../components/AdminShell';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { useAuth, getStoredAccessToken } from '../../context/AuthContext';
import {
  Shield, ShieldCheck, ShieldOff, Smartphone, AlertCircle,
  CheckCircle2, Loader2, Copy, Check, KeyRound,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';

// ── 2FA Setup Dialog ──────────────────────────────────────────────────────────

function TwoFactorSetupDialog({
  open,
  onClose,
  onEnabled,
  accessToken,
}: {
  open: boolean;
  onClose: () => void;
  onEnabled: () => void;
  accessToken: string;
}) {
  const [step, setStep]           = useState<'qr' | 'verify' | 'done'>('qr');
  const [secret, setSecret]       = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [code, setCode]           = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    if (!open) { setStep('qr'); setCode(''); setError(''); return; }
    // Fetch the TOTP secret from backend
    const base = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
    setLoading(true);
    fetch(`${base}/api/auth/mfa/setup`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(d => { setSecret(d.secret); setOtpauthUrl(d.otpauthUrl); })
      .catch(() => setError('حدث خطأ في التحميل'))
      .finally(() => setLoading(false));
  }, [open, accessToken]);

  const handleCopy = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    if (code.length < 6) { setError('أدخل الرمز المكوّن من 6 أرقام'); return; }
    setError(''); setLoading(true);
    const base = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
    try {
      const res = await fetch(`${base}/api/auth/mfa/enable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ secret, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'رمز غير صحيح'); return; }
      setStep('done');
    } catch {
      setError('حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm" dir="rtl">
        <AnimatePresence mode="wait">
          {step === 'qr' && (
            <motion.div key="qr" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <DialogHeader>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <DialogTitle className="text-center">تفعيل المصادقة الثنائية</DialogTitle>
                <DialogDescription className="text-center text-sm">
                  افتح تطبيق المصادقة (Google Authenticator أو Authy) وامسح الكود
                </DialogDescription>
              </DialogHeader>

              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : otpauthUrl ? (
                <>
                  {/* QR code */}
                  <div className="flex justify-center p-4 bg-white rounded-2xl border border-border">
                    <QRCode value={otpauthUrl} size={180} />
                  </div>

                  {/* Manual entry */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground text-center">أو أدخل المفتاح يدوياً</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono bg-muted p-2.5 rounded-lg text-center tracking-widest break-all">
                        {secret}
                      </code>
                      <button onClick={handleCopy}
                        className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0">
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>

                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => setStep('verify')}>
                    التالي — التحقق من الرمز
                  </Button>
                </>
              ) : (
                <p className="text-center text-destructive text-sm">{error || 'تعذّر تحميل بيانات الإعداد'}</p>
              )}
            </motion.div>
          )}

          {step === 'verify' && (
            <motion.div key="verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-center">التحقق من الرمز</DialogTitle>
                <DialogDescription className="text-center text-sm">
                  أدخل الرمز المكوّن من 6 أرقام من تطبيق المصادقة
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <Input
                  dir="ltr"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={e => { setCode(e.target.value.replace(/\D/g,'').slice(0,6)); setError(''); }}
                  className="h-14 text-center text-2xl font-mono tracking-[0.3em]"
                  onKeyDown={e => e.key === 'Enter' && handleVerify()}
                />
                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep('qr')}>رجوع</Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleVerify} disabled={loading || code.length < 6}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تفعيل'}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4 space-y-3">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <p className="font-bold text-foreground">تم تفعيل المصادقة الثنائية بنجاح!</p>
              <p className="text-sm text-muted-foreground">سيُطلب منك رمز التحقق في كل مرة تسجل دخولك.</p>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-2"
                onClick={() => { onEnabled(); onClose(); }}>
                حسناً
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// ── Disable 2FA Dialog ────────────────────────────────────────────────────────

function DisableTwoFactorDialog({
  open,
  onClose,
  onDisabled,
  accessToken,
}: {
  open: boolean;
  onClose: () => void;
  onDisabled: () => void;
  accessToken: string;
}) {
  const [code, setCode]     = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!open) { setCode(''); setError(''); } }, [open]);

  const handleDisable = async () => {
    setError(''); setLoading(true);
    const base = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
    try {
      const res = await fetch(`${base}/api/auth/mfa/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'رمز غير صحيح'); return; }
      onDisabled(); onClose();
    } catch {
      setError('حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-2">
            <ShieldOff className="w-6 h-6 text-destructive" />
          </div>
          <DialogTitle className="text-center">إلغاء المصادقة الثنائية</DialogTitle>
          <DialogDescription className="text-center text-sm">
            أدخل الرمز من تطبيق المصادقة لتأكيد الإلغاء
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Input
            dir="ltr"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={e => { setCode(e.target.value.replace(/\D/g,'').slice(0,6)); setError(''); }}
            className="h-14 text-center text-2xl font-mono tracking-[0.3em]"
          />
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>إلغاء</Button>
          <Button variant="destructive" className="flex-1" onClick={handleDisable}
            disabled={loading || code.length < 6}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إلغاء التفعيل'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main settings page ────────────────────────────────────────────────────────

export default function SettingsAdmin() {
  const { user } = useAuth();
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfaEnabled ?? false);
  const [setupOpen, setSetupOpen]   = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);

  const accessToken = getStoredAccessToken() || '';

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">إعدادات الحساب والنظام</h1>
        <p className="text-muted-foreground">ضبط سياسات الأمان وتأمين حسابك.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Account Security ── */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
          <h2 className="text-xl font-bold border-b border-border pb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            أمان الحساب
          </h2>

          {/* 2FA */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-base font-semibold">المصادقة الثنائية (2FA)</Label>
                {mfaEnabled && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    مُفعَّل
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                يحمي حسابك بخطوة تحقق إضافية عبر تطبيق المصادقة.
              </p>
            </div>
            <Button
              variant={mfaEnabled ? 'destructive' : 'default'}
              size="sm"
              className={mfaEnabled ? '' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}
              onClick={() => mfaEnabled ? setDisableOpen(true) : setSetupOpen(true)}
            >
              {mfaEnabled ? (
                <><ShieldOff className="w-4 h-4 me-1.5" />إلغاء</>
              ) : (
                <><ShieldCheck className="w-4 h-4 me-1.5" />تفعيل</>
              )}
            </Button>
          </div>

          {mfaEnabled && (
            <div className="p-3 rounded-lg bg-green-500/8 border border-green-500/20 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">حسابك محمي</p>
                <p className="text-xs text-muted-foreground mt-0.5">سيُطلب رمز التحقق في كل تسجيل دخول جديد.</p>
              </div>
            </div>
          )}

          {!mfaEnabled && (
            <div className="p-3 rounded-lg bg-amber-500/8 border border-amber-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">يُنصح بتفعيل 2FA</p>
                <p className="text-xs text-muted-foreground mt-0.5">حسابك الإداري بدون حماية ثنائية.</p>
              </div>
            </div>
          )}
        </div>

        {/* ── System Policies ── */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
          <h2 className="text-xl font-bold border-b border-border pb-4">سياسات النظام</h2>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">تعطيل لقطات الشاشة</Label>
              <p className="text-sm text-muted-foreground">تطبيق طبقة الحماية من لقطات الشاشة.</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">العلامة المائية الديناميكية</Label>
              <p className="text-sm text-muted-foreground">إظهار بيانات المستخدم على الشرائح.</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">ربط IP للجلسة</Label>
              <p className="text-sm text-muted-foreground">إلغاء الجلسة عند تغيير عنوان IP.</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="space-y-2 pt-2">
            <Label className="font-semibold">مهلة الجلسة (دقيقة)</Label>
            <Input type="number" defaultValue={60} className="max-w-[200px]" />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <TwoFactorSetupDialog
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        onEnabled={() => setMfaEnabled(true)}
        accessToken={accessToken}
      />
      <DisableTwoFactorDialog
        open={disableOpen}
        onClose={() => setDisableOpen(false)}
        onDisabled={() => setMfaEnabled(false)}
        accessToken={accessToken}
      />
    </AdminShell>
  );
}
