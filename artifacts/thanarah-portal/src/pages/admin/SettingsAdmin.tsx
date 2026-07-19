import React from 'react';
import { AdminShell } from '../../components/AdminShell';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Save } from 'lucide-react';

export default function SettingsAdmin() {
  return (
    <AdminShell>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">System Settings</h1>
          <p className="text-muted-foreground">Configure global portal behavior and security policies.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Security Settings */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
          <h2 className="text-xl font-bold border-b border-border pb-4">Security Policies</h2>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">Require MFA for Admins</Label>
              <p className="text-sm text-muted-foreground">Enforce two-factor authentication for privileged roles.</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">Strict IP Binding</Label>
              <p className="text-sm text-muted-foreground">Invalidate session if IP address changes during active use.</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">Disable Screenshots</Label>
              <p className="text-sm text-muted-foreground">Apply anti-screenshot overlay logic (where supported).</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="space-y-2 pt-4">
            <Label className="font-semibold">Default Session Timeout (Minutes)</Label>
            <Input type="number" defaultValue={60} className="max-w-[200px]" />
          </div>
        </div>

        {/* Presentation Settings */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
          <h2 className="text-xl font-bold border-b border-border pb-4">Presentation Mode</h2>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">Enforce Linear Viewing</Label>
              <p className="text-sm text-muted-foreground">Users must view sections in order without skipping ahead.</p>
            </div>
            <Switch defaultChecked={false} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">Show Progress Bar</Label>
              <p className="text-sm text-muted-foreground">Display completion percentage to viewers.</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">Dynamic Watermark</Label>
              <p className="text-sm text-muted-foreground">Overlay user details on presentation slides.</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="space-y-2 pt-4">
            <Label className="font-semibold">Watermark Opacity (%)</Label>
            <Input type="number" defaultValue={10} max={100} min={1} className="max-w-[200px]" />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
