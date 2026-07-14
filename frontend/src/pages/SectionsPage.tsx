import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { HiOutlinePlus, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import { toast } from 'sonner';

import { api } from '../api';
import { useAuth } from '../auth';
import { CLASS_TYPES, SECTION_STATUSES, LEVELS } from '../lib/constants';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';

const selectCls = "flex h-10 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

export function SectionsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const teacherId = user?.role === 'teacher' ? user?.teacherId : undefined;

  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('active');

  const sectionsQ = useQuery({ queryKey: ['sections', filter, teacherId], queryFn: () => api.sections({ status: filter, teacherId }), retry: false });
  const teachersQ = useQuery({ queryKey: ['teachers'], queryFn: () => api.teachers({ status: 'active' }), retry: false });
  const coursesQ = useQuery({ queryKey: ['courses'], queryFn: api.courses, retry: false });
  const studentsQ = useQuery({ queryKey: ['students'], queryFn: () => api.students({ status: 'Active' }), retry: false });

  const teacherMap = useMemo(() => new Map((teachersQ.data ?? []).map(t => [t.id, t.teacherName])), [teachersQ.data]);

  const [classType, setClassType] = useState('Group');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [studentFilter, setStudentFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [scheduleDays, setScheduleDays] = useState('Mon,Wed,Fri');
  const [startTime, setStartTime] = useState('09:00');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [creating, setCreating] = useState(false);

  const filteredStudents = useMemo(() => {
    const all = studentsQ.data ?? [];
    return all.filter(s => {
      if (classType === 'Private' && s.classType !== 'Private') return false;
      if (levelFilter && s.level !== levelFilter) return false;
      if (studentFilter) {
        const q = studentFilter.toLowerCase();
        if (!s.studentName.toLowerCase().includes(q) && !(s.email ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [studentsQ.data, classType, levelFilter, studentFilter]);

  const resetForm = () => {
    setClassType('Group');
    setSelectedTeacher('');
    setSelectedStudents(new Set());
    setStudentFilter('');
    setLevelFilter('');
    setScheduleDays('Mon,Wed,Fri');
    setStartTime('09:00');
    setStartDate(new Date().toISOString().slice(0, 10));
  };

  const toggleStudent = (id: string) => {
    if (classType === 'Private') {
      setSelectedStudents(new Set([id]));
    } else {
      setSelectedStudents(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || selectedStudents.size === 0) { toast.error('Select a teacher and at least one student'); return; }
    setCreating(true);
    try {
      const teacherName = teacherMap.get(selectedTeacher) ?? '';
      const sectionName = classType === 'Private'
        ? `${teacherName} - Private`
        : `${classType} - ${teacherName}`;

      const section = await api.createSection({
        sectionName,
        classType,
        teacherId: selectedTeacher,
        courseId: coursesQ.data?.[0]?.id ?? '',
        scheduleDays,
        startTime,
        startDate,
        maxStudents: classType === 'Private' ? 1 : 20,
      });

      for (const studentId of selectedStudents) {
        await api.createEnrollment(section.id, { studentId });
      }

      setShowCreate(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      toast.success(`Section created with ${selectedStudents.size} student(s)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create section');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sections</h1>
          <p className="text-muted-foreground mt-1">{isAdmin ? 'Create and manage class sections.' : 'View your assigned sections.'}</p>
        </div>
        {isAdmin && <Button onClick={() => { setShowCreate(true); resetForm(); }} className="gap-1.5"><HiOutlinePlus size={16} /> New Section</Button>}
      </div>

      <div className="flex gap-2 flex-wrap">
        {SECTION_STATUSES.map(s => (
          <Button key={s} variant={filter === s ? 'default' : 'outline'} size="sm" onClick={() => setFilter(s)}>{s}</Button>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>{filter} Sections</CardTitle></CardHeader>
        <CardContent>
          {sectionsQ.isLoading && <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-muted/50 rounded-xl animate-pulse" />)}</div>}
          {sectionsQ.data && sectionsQ.data.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No {filter} sections.</p>}
          {sectionsQ.data && sectionsQ.data.length > 0 && (
            <Table>
              <TableHeader><TableRow><TableHead>Section</TableHead><TableHead>Teacher</TableHead><TableHead>Schedule</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {sectionsQ.data.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.sectionName}</TableCell>
                    <TableCell>{teacherMap.get(s.teacherId) ?? s.teacherId}</TableCell>
                    <TableCell>{s.scheduleDays} &middot; {s.startTime}</TableCell>
                    <TableCell><Badge variant={s.classType === 'Private' ? 'neutral' : 'success'}>{s.classType}</Badge></TableCell>
                    <TableCell><Badge variant={s.status === 'active' ? 'success' : 'neutral'}>{s.status}</Badge></TableCell>
                    <TableCell><Link to={`/sections/$sectionId`} params={{ sectionId: s.id }}><Button variant="ghost" size="sm">View</Button></Link></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Section</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-6 mt-4">
              <div>
                <Label className="text-sm font-semibold">Class Type</Label>
                <div className="flex gap-3 mt-2">
                  {CLASS_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => { setClassType(t); setSelectedStudents(new Set()); }}
                      className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${classType === t ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-border/60 hover:border-primary/30'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Teacher</Label>
                <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} required className={`${selectCls} mt-2`}>
                  <option value="">Select a teacher</option>
                  {teachersQ.data?.map(t => <option key={t.id} value={t.id}>{t.teacherName}</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">Students {classType === 'Private' ? '(select 1)' : `(select multiple)`}</Label>
                  <div className="flex gap-2">
                    <div className="relative"><HiOutlineMagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input value={studentFilter} onChange={e => setStudentFilter(e.target.value)} placeholder="Search name..." className="h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 w-40" />
                    </div>
                    <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="h-8 px-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="">All Levels</option>
                      {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
                  {filteredStudents.length === 0 && <p className="text-xs text-muted-foreground col-span-full py-4 text-center">No matching students.</p>}
                  {filteredStudents.map(s => {
                    const selected = selectedStudents.has(s.id);
                    return (
                      <button key={s.id} type="button" onClick={() => toggleStudent(s.id)}
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/60 hover:border-primary/20'}`}>
                        {classType !== 'Private' && <Checkbox checked={selected} className="mt-0.5 shrink-0" />}
                        {classType === 'Private' && <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${selected ? 'border-primary' : 'border-muted-foreground/40'}`}>{selected && <div className="w-2 h-2 rounded-full bg-primary" />}</div>}
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{s.studentName}</div>
                          <div className="flex gap-1.5 mt-1 flex-wrap">
                            <Badge variant="neutral" className="text-[10px]">{s.level}</Badge>
                            <Badge variant="neutral" className="text-[10px]">{s.classType}</Badge>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedStudents.size > 0 && <p className="text-xs text-primary mt-2 font-medium">{selectedStudents.size} student(s) selected</p>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Schedule Days</Label><Input value={scheduleDays} onChange={e => setScheduleDays(e.target.value)} placeholder="Mon,Wed,Fri" /></div>
                <div className="space-y-2"><Label>Start Time</Label><Input value={startTime} onChange={e => setStartTime(e.target.value)} type="time" /></div>
                <div className="space-y-2"><Label>Start Date</Label><Input value={startDate} onChange={e => setStartDate(e.target.value)} type="date" /></div>
              </div>

              <Button type="submit" disabled={creating || !selectedTeacher || selectedStudents.size === 0} className="w-full">
                {creating ? 'Creating...' : `Create Section (${selectedStudents.size} student${selectedStudents.size !== 1 ? 's' : ''})`}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
