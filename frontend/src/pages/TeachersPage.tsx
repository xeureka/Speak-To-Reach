import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { HiOutlinePlus, HiOutlineKey } from 'react-icons/hi2';
import { toast } from 'sonner';

import { api } from '../api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

export function TeachersPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [creating, setCreating] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const teachers = useQuery({ queryKey: ['teachers'], queryFn: () => api.teachers(), retry: false });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const result = await api.createTeacher({ teacherName: name, email, phone: phone || undefined }) as any;
      setNewPassword(result.password ?? '');
      setShowCreate(false);
      setName(''); setEmail(''); setPhone('');
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    } finally { setCreating(false); }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setResetting(true);
    try {
      const result = await api.resetTeacherPassword(resetTarget.id);
      setResetPassword(result.password);
      toast.success(`Password reset for ${resetTarget.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset password');
    } finally { setResetting(false); }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
          <p className="text-muted-foreground mt-1">Manage teacher accounts and credentials.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-1.5"><HiOutlinePlus size={16} /> New Teacher</Button>
      </div>

      {newPassword && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4 flex items-center justify-between">
            <p className="text-sm text-emerald-700">Teacher created. Generated password: <strong className="font-mono">{newPassword}</strong></p>
            <Button variant="ghost" size="sm" onClick={() => setNewPassword('')}>Dismiss</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>All Teachers</CardTitle></CardHeader>
        <CardContent>
          {teachers.isLoading && <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-muted/50 rounded-xl animate-pulse" />)}</div>}
          {teachers.data && teachers.data.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No teachers found.</p>}
          {teachers.data && teachers.data.length > 0 && (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead><TableHead>Hire Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {teachers.data.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      <Link to="/teachers/$teacherId" params={{ teacherId: t.id }} className="text-primary hover:underline">{t.teacherName}</Link>
                    </TableCell>
                    <TableCell>{t.email}</TableCell>
                    <TableCell>{t.phone ?? '-'}</TableCell>
                    <TableCell><Badge variant={t.status === 'active' ? 'success' : 'neutral'}>{t.status}</Badge></TableCell>
                    <TableCell>{t.hireDate ?? '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => { setResetTarget({ id: t.id, name: t.teacherName }); setResetPassword(''); }}>
                        <HiOutlineKey size={14} /> Reset Password
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Teacher</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div className="space-y-2"><Label>Teacher Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Phone (optional)</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <Button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create Teacher'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetTarget} onOpenChange={(open) => { if (!open) { setResetTarget(null); setResetPassword(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset Password — {resetTarget?.name}</DialogTitle></DialogHeader>
          {resetPassword ? (
            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-700">New password generated:</p>
                <p className="text-lg font-mono font-bold text-amber-900 mt-1">{resetPassword}</p>
                <p className="text-xs text-amber-600 mt-2">Share this password with the teacher. It will not be shown again.</p>
              </div>
              <Button onClick={() => { setResetTarget(null); setResetPassword(''); }} className="w-full">Done</Button>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">This will generate a new random password for <strong>{resetTarget?.name}</strong>. The teacher will need to use the new password to log in.</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setResetTarget(null); setResetPassword(''); }} className="flex-1">Cancel</Button>
                <Button onClick={handleResetPassword} disabled={resetting} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">{resetting ? 'Resetting...' : 'Reset Password'}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
