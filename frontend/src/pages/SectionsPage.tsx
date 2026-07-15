import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { HiOutlinePlus, HiOutlineMagnifyingGlass, HiOutlineXMark, HiOutlineArrowsUpDown } from 'react-icons/hi2';
import { toast } from 'sonner';

import { api, type Student } from '../api';
import { useAuth } from '../auth';
import { CLASS_TYPES, SECTION_STATUSES, LEVELS } from '../lib/constants';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

const selectCls = "flex h-10 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

type SortKey = 'name' | 'level' | 'email';

export function SectionsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('active');

  const sectionsQ = useQuery({ queryKey: ['sections', filter], queryFn: () => api.sections({ status: filter }), retry: false });
  const teachersQ = useQuery({ queryKey: ['teachers'], queryFn: () => api.teachers({ status: 'active' }), retry: false });
  const coursesQ = useQuery({ queryKey: ['courses'], queryFn: api.courses, retry: false });
  const studentsQ = useQuery({ queryKey: ['students'], queryFn: () => api.students({ status: 'Active' }), retry: false });

  const teacherMap = useMemo(() => new Map((teachersQ.data ?? []).map(t => [t.id, t.teacherName])), [teachersQ.data]);

  // --- Create Section form state ---
  const [classType, setClassType] = useState('Group');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [scheduleDays, setScheduleDays] = useState('Mon,Wed,Fri');
  const [startTime, setStartTime] = useState('09:00');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [creating, setCreating] = useState(false);

  // --- Student Selector modal state ---
  const [showSelector, setShowSelector] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState('');
  const [selectorLevel, setSelectorLevel] = useState('');
  const [selectorSort, setSelectorSort] = useState<SortKey>('name');
  const [tempSelected, setTempSelected] = useState<Set<string>>(new Set());

  // --- Selected preview removal state ---
  const [selectedForRemoval, setSelectedForRemoval] = useState<Set<string>>(new Set());

  const resetForm = () => {
    setClassType('Group');
    setSelectedTeacher('');
    setSelectedStudents(new Set());
    setSelectedForRemoval(new Set());
    setScheduleDays('Mon,Wed,Fri');
    setStartTime('09:00');
    setStartDate(new Date().toISOString().slice(0, 10));
  };

  // --- Student Selector logic ---
  const selectorStudents = useMemo(() => {
    const all = studentsQ.data ?? [];
    const filtered = all.filter(s => {
      if (classType === 'Private' && s.classType !== 'Private') return false;
      if (selectorLevel && s.level !== selectorLevel) return false;
      if (selectorSearch) {
        const q = selectorSearch.toLowerCase();
        if (!s.studentName.toLowerCase().includes(q) && !(s.email ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    });

    const levelOrder = [...LEVELS];
    filtered.sort((a, b) => {
      switch (selectorSort) {
        case 'level': return levelOrder.indexOf(a.level as typeof LEVELS[number]) - levelOrder.indexOf(b.level as typeof LEVELS[number]);
        case 'email': return (a.email ?? '').localeCompare(b.email ?? '');
        default: return a.studentName.localeCompare(b.studentName);
      }
    });
    return filtered;
  }, [studentsQ.data, classType, selectorLevel, selectorSearch, selectorSort]);

  const openSelector = () => {
    setTempSelected(new Set(selectedStudents));
    setSelectorSearch('');
    setSelectorLevel('');
    setSelectorSort('name');
    setShowSelector(true);
  };

  const confirmSelector = () => {
    setSelectedStudents(new Set(tempSelected));
    setShowSelector(false);
  };

  const toggleTempStudent = (id: string) => {
    if (classType === 'Private') {
      setTempSelected(new Set([id]));
    } else {
      setTempSelected(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    }
  };

  const removeStudent = (id: string) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setSelectedForRemoval(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleRemoval = (id: string) => {
    setSelectedForRemoval(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const removeSelectedStudents = () => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      for (const id of selectedForRemoval) next.delete(id);
      return next;
    });
    setSelectedForRemoval(new Set());
  };

  const selectedStudentList = useMemo(() => {
    const all = studentsQ.data ?? [];
    return all.filter(s => selectedStudents.has(s.id));
  }, [studentsQ.data, selectedStudents]);

  // --- Create Section ---
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
              <TableHeader>
                <TableRow>
                  <TableHead>Section</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
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

      {/* ==================== CREATE SECTION MODAL (large) ==================== */}
      {isAdmin && (
        <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) resetForm(); }}>
          <DialogContent className="max-w-5xl max-h-[92vh]">
            <DialogHeader><DialogTitle>Create Section</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-6 mt-4">
              {/* Class Type */}
              <div>
                <Label className="text-sm font-semibold">Class Type</Label>
                <div className="flex gap-3 mt-2">
                  {CLASS_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => { setClassType(t); setSelectedStudents(new Set()); }}
                      className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${classType === t ? 'border-primary bg-primary/5 text-primary' : 'border-border/60 hover:border-primary/30'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Teacher */}
              <div>
                <Label>Teacher</Label>
                <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} required className={`${selectCls} mt-2`}>
                  <option value="">Select a teacher</option>
                  {teachersQ.data?.map(t => <option key={t.id} value={t.id}>{t.teacherName}</option>)}
                </select>
              </div>

              {/* Student Selection Area */}
              <div className="border border-border/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    Students {classType === 'Private' ? '(select 1)' : `(select multiple)`}
                    {selectedStudents.size > 0 && <span className="ml-2 text-primary font-normal">— {selectedStudents.size} selected</span>}
                  </Label>
                  <div className="flex items-center gap-2">
                    {selectedForRemoval.size > 0 && (
                      <Button type="button" variant="outline" size="sm" onClick={removeSelectedStudents} className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5">
                        <HiOutlineXMark size={14} /> Remove ({selectedForRemoval.size})
                      </Button>
                    )}
                    <Button type="button" variant="outline" size="sm" onClick={openSelector} className="gap-1.5">
                      <HiOutlinePlus size={14} /> Select Students
                    </Button>
                  </div>
                </div>

                {selectedStudentList.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border/60 rounded-lg">
                    No students selected. Click "Select Students" to choose.
                  </p>
                ) : (
                  <div className="border border-border/60 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Level</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedStudentList.map(s => (
                          <TableRow key={s.id} className={selectedForRemoval.has(s.id) ? 'bg-destructive/5' : ''}>
                            <TableCell>
                              <Checkbox
                                checked={selectedForRemoval.has(s.id)}
                                onChange={() => toggleRemoval(s.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{s.studentName}</TableCell>
                            <TableCell><Badge variant="neutral">{s.level}</Badge></TableCell>
                            <TableCell className="text-muted-foreground">{s.email ?? '-'}</TableCell>
                            <TableCell>
                              <button type="button" onClick={() => removeStudent(s.id)} className="p-1 rounded hover:bg-muted transition-colors">
                                <HiOutlineXMark size={14} className="text-muted-foreground hover:text-destructive" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Schedule Days</Label><Input value={scheduleDays} onChange={e => setScheduleDays(e.target.value)} placeholder="Mon,Wed,Fri" /></div>
                <div className="space-y-2"><Label>Start Time</Label><Input value={startTime} onChange={e => setStartTime(e.target.value)} type="time" /></div>
                <div className="space-y-2"><Label>Start Date</Label><Input value={startDate} onChange={e => setStartDate(e.target.value)} type="date" /></div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={creating || !selectedTeacher || selectedStudents.size === 0}>
                  {creating ? 'Creating...' : `Create Section (${selectedStudents.size} student${selectedStudents.size !== 1 ? 's' : ''})`}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ==================== STUDENT SELECTOR MODAL (second modal) ==================== */}
      <Dialog open={showSelector} onOpenChange={setShowSelector}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader><DialogTitle>Select Students</DialogTitle></DialogHeader>

          {/* Search, Filter, Sort Controls */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <HiOutlineMagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={selectorSearch}
                onChange={e => setSelectorSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="h-9 pl-8 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-full"
              />
            </div>
            <select value={selectorLevel} onChange={e => setSelectorLevel(e.target.value)} className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">All Levels</option>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <div className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-background text-sm">
              <HiOutlineArrowsUpDown size={14} className="text-muted-foreground" />
              <select value={selectorSort} onChange={e => setSelectorSort(e.target.value as SortKey)} className="bg-transparent focus:outline-none text-sm cursor-pointer">
                <option value="name">Name</option>
                <option value="level">Level</option>
                <option value="email">Email</option>
              </select>
            </div>
          </div>

          {/* Selection count */}
          {tempSelected.size > 0 && (
            <p className="text-xs text-primary font-medium mt-2">{tempSelected.size} student(s) selected</p>
          )}

          {/* Student Table */}
          <div className="border border-border rounded-xl overflow-hidden mt-2 max-h-[50vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Class Type</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectorStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No matching students.</TableCell>
                  </TableRow>
                )}
                {selectorStudents.map(s => {
                  const selected = tempSelected.has(s.id);
                  return (
                    <TableRow
                      key={s.id}
                      className={`cursor-pointer transition-colors ${selected ? 'bg-primary/5' : 'hover:bg-muted/40'}`}
                      onClick={() => toggleTempStudent(s.id)}
                    >
                      <TableCell>
                        <Checkbox checked={selected} className="pointer-events-none" />
                      </TableCell>
                      <TableCell className="font-medium">{s.studentName}</TableCell>
                      <TableCell><Badge variant="neutral">{s.level}</Badge></TableCell>
                      <TableCell>{s.classType}</TableCell>
                      <TableCell className="text-muted-foreground">{s.email ?? '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Confirm / Cancel */}
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={() => setShowSelector(false)}>Cancel</Button>
            <Button type="button" onClick={confirmSelector} disabled={tempSelected.size === 0}>
              Confirm Selection ({tempSelected.size})
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
