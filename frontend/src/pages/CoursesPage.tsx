import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HiOutlinePlus } from 'react-icons/hi2';

import { api } from '../api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

export function CoursesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ courseName: '', level: 'Beginner', totalUnits: 8, totalLessons: 32, description: '' });
  const [creating, setCreating] = useState(false);

  const courses = useQuery({ queryKey: ['courses'], queryFn: api.courses, retry: false });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createCourse(form);
      setShowCreate(false);
      setForm({ courseName: '', level: 'Beginner', totalUnits: 8, totalLessons: 32, description: '' });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    } finally { setCreating(false); }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground mt-1">Manage available courses and curricula.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-1.5"><HiOutlinePlus size={16} /> New Course</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All Courses</CardTitle></CardHeader>
        <CardContent>
          {courses.isLoading && <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-muted/50 rounded-xl animate-pulse" />)}</div>}
          {courses.data && courses.data.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No courses found.</p>}
          {courses.data && courses.data.length > 0 && (
            <Table>
              <TableHeader><TableRow><TableHead>Course</TableHead><TableHead>Level</TableHead><TableHead>Units</TableHead><TableHead>Lessons</TableHead></TableRow></TableHeader>
              <TableBody>
                {courses.data.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.courseName}</TableCell>
                    <TableCell>{c.level}</TableCell>
                    <TableCell>{c.totalUnits}</TableCell>
                    <TableCell>{c.totalLessons}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Course</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div className="space-y-2"><Label>Course Name</Label><Input value={form.courseName} onChange={(e) => setForm({ ...form, courseName: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Units</Label><Input type="number" value={form.totalUnits} onChange={(e) => setForm({ ...form, totalUnits: +e.target.value })} /></div>
              <div className="space-y-2"><Label>Lessons</Label><Input type="number" value={form.totalLessons} onChange={(e) => setForm({ ...form, totalLessons: +e.target.value })} /></div>
            </div>
            <Button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create Course'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
