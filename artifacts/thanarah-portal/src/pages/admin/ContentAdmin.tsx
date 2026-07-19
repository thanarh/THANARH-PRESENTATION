import React from 'react';
import { AdminShell } from '../../components/AdminShell';
import { useListContent } from '@workspace/api-client-react';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function ContentAdmin() {
  const { data: contentSections, isLoading } = useListContent();

  return (
    <AdminShell>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Content Management</h1>
          <p className="text-muted-foreground">Manage presentation slides and dynamic content blocks.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Section
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 font-semibold text-muted-foreground w-16">Order</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Title (EN)</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Title (AR)</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Slug</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Last Updated</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : !contentSections || contentSections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No content sections found.
                  </td>
                </tr>
              ) : (
                contentSections.map(section => (
                  <tr key={section.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-muted-foreground text-center">
                      {section.order}
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {section.titleEn}
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground" dir="rtl">
                      {section.titleAr}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {section.slug}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        section.status === 'published' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                      }`}>
                        {section.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(section.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button className="text-primary text-sm font-medium hover:underline">Edit</button>
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
