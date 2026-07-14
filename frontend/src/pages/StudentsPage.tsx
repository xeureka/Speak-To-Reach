import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { HiOutlinePlus, HiOutlineArrowUpTray } from 'react-icons/hi2';
import { toast } from 'sonner';

import { api } from '../api';
import { useAuth } from '../auth';
import { STUDENT_STATUSES, LEVELS, CLASS_TYPES } from '../lib/constants';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

export function StudentsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [status, setStatus] = useState('Active');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [classType, setClassType] = useState('Private');

  const students = useQuery({ queryKey: ['students', status], queryFn: () => api.students({ status }), retry: false });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createStudent({ studentName: name, email, level, classType });
    setName(''); setEmail(''); setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ['students'] });
    toast.success('Student created');
  };

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: Array<{ row: number; message: string }> } | null>(null);
  const [showImport, setShowImport] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    setImporting(true);
    setImportResult(null);
    try {
      const result = await api.importStudents(file);
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      if (result.imported > 0) toast.success(`Imported ${result.imported} students`);
      if (result.skipped > 0) toast.info(`Skipped ${result.skipped} duplicates`);
      if (result.errors.length > 0) toast.error(`${result.errors.length} rows had errors`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground mt-1">Manage student records and enrollment.</p>
        </div>
        <div className="flex gap-2">
          {!isTeacher && (
            <Button variant="outline" onClick={() => { setShowImport(true); setImportResult(null); }} className="gap-1.5"><HiOutlineArrowUpTray size={16} /> Import</Button>
          )}
          {!isTeacher && (
            <Button onClick={() => setShowForm(true)} className="gap-1.5"><HiOutlinePlus size={16} /> New Student</Button>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap" role="tablist">
        {STUDENT_STATUSES.map((option) => (
          <Button key={option} variant={status === option ? 'default' : 'outline'} size="sm" onClick={() => setStatus(option)}>{option}</Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{status} Students</CardTitle>
        </CardHeader>
        <CardContent>
          {students.isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-muted/50 rounded-xl animate-pulse" />)}
            </div>
          )}
          {students.data && students.data.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No {status.toLowerCase()} students found.</p>}
          {students.data && students.data.length > 0 && (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Level</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {students.data.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.studentName}</TableCell>
                    <TableCell>{s.level}</TableCell>
                    <TableCell><Badge variant="neutral">{s.classType}</Badge></TableCell>
                    <TableCell><Badge variant={s.status === 'Active' ? 'success' : 'neutral'}>{s.status}</Badge></TableCell>
                    <TableCell><Link to={`/students/$studentId`} params={{ studentId: s.id }}><Button variant="ghost" size="sm">View</Button></Link></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Student</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Level</Label><select value={level} onChange={(e) => setLevel(e.target.value)} className="flex h-10 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30">{LEVELS.map(l => <option key={l}>{l}</option>)}</select></div>
              <div className="space-y-2"><Label>Class Type</Label><select value={classType} onChange={(e) => setClassType(e.target.value)} className="flex h-10 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30">{CLASS_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            </div>
            <Button type="submit">Save Student</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Import Students from Excel</DialogTitle></DialogHeader>
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">Upload an Excel or CSV file. Expected columns: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">name</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs">email</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs">phone</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs">level</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs">class_type</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs">preferred_days</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs">preferred_time</code>.</p>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/30'}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
              />
              <HiOutlineArrowUpTray size={32} className="mx-auto text-muted-foreground mb-3" />
              {importing ? (
                <p className="text-sm text-muted-foreground">Importing...</p>
              ) : dragOver ? (
                <p className="text-sm text-primary font-medium">Drop your file here</p>
              ) : (
                <p className="text-sm text-muted-foreground">Drag & drop an Excel/CSV file, or click to browse</p>
              )}
            </div>
            {importResult && (
              <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                <p className="text-sm font-medium">Import Complete</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="text-emerald-600 font-medium">{importResult.imported} imported</span>
                  <span>{importResult.skipped} skipped (duplicates)</span>
                  {importResult.errors.length > 0 && <span className="text-red-600">{importResult.errors.length} errors</span>}
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {importResult.errors.slice(0, 5).map((err, i) => (
                      <p key={i} className="text-xs text-red-600">Row {err.row}: {err.message}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
