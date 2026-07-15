import { useState, useEffect } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HiOutlineArrowLeft, HiOutlineStop, HiOutlinePencilSquare, HiOutlineCalendarDays } from 'react-icons/hi2';
import { toast } from 'sonner';

import { api } from '../api';
import { useAuth } from '../auth';
import { CLASS_TYPES, SECTION_STATUSES } from '../lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

const selectCls = "flex h-10 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

function generateSchedule(
  startDate: string,
  endDate: string,
  selectedDays: string[],
  startTime: string,
  endTime: string,
  classType: string,
): Array<{ sessionDate: string; sessionNumber: number; sessionType: string; startTime: string; endTime: string }> {
  if (!selectedDays.length || !startDate || !endDate) return [];
  const sessions: Array<{ sessionDate: string; sessionNumber: number; sessionType: string; startTime: string; endTime: string }> = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayNumbers = selectedDays.map(d => DAYS_OF_WEEK.indexOf(d as typeof DAYS_OF_WEEK[number]));
  let sessionNum = 1;
  const current = new Date(start);

  while (current <= end) {
    if (dayNumbers.includes(current.getDay() === 0 ? 6 : current.getDay() - 1)) {
      const dateStr = current.toISOString().slice(0, 10);
      sessions.push({
        sessionDate: dateStr,
        sessionNumber: sessionNum++,
        sessionType: classType === 'Private' ? 'private' : 'group',
        startTime,
        endTime,
      });
    }
    current.setDate(current.getDate() + 1);
  }
  return sessions;
}

export function SectionDetailPage() {
  const { sectionId } = useParams({ from: '/protected/sections/$sectionId' });
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState('students');

  const section = useQuery({ queryKey: ['section', sectionId], queryFn: () => api.getSection(sectionId), retry: false });
  const enrollments = useQuery({ queryKey: ['enrollments', sectionId], queryFn: () => api.enrollments(sectionId), retry: false });
  const sessions = useQuery({ queryKey: ['classSessions', sectionId], queryFn: () => api.classSessions({ sectionId }), retry: false });
  const allStudents = useQuery({ queryKey: ['students'], queryFn: () => api.students({ status: 'Active' }), retry: false });
  const teachersQ = useQuery({ queryKey: ['teachers'], queryFn: () => api.teachers({ status: 'active' }), retry: false });
  const coursesQ = useQuery({ queryKey: ['courses'], queryFn: api.courses, retry: false });

  const [showEnroll, setShowEnroll] = useState(false);
  const [showSession, setShowSession] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [sessionNumber, setSessionNumber] = useState('1');
  const [lessonTitle, setLessonTitle] = useState('');
  const [ending, setEnding] = useState(false);

  const [schedStart, setSchedStart] = useState(new Date().toISOString().slice(0, 10));
  const [schedEnd, setSchedEnd] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [schedDays, setSchedDays] = useState<string[]>([]);
  const [schedStartHour, setSchedStartHour] = useState('09:00');
  const [schedEndHour, setSchedEndHour] = useState('10:00');
  const [scheduling, setScheduling] = useState(false);
  const [schedPreview, setSchedPreview] = useState<Array<{ sessionDate: string; sessionNumber: number }>>([]);

  const data = section.data;

  useEffect(() => {
    if (data) {
      setSchedStartHour(data.startTime || '09:00');
      setSchedEndHour(data.endTime || '10:00');
    }
  }, [data]);

  const enrolledStudentIds = new Set((enrollments.data ?? []).map(e => e.studentId));
  const availableStudents = (allStudents.data ?? []).filter(s => !enrolledStudentIds.has(s.id) && s.status === 'Active');
  const studentMap = new Map((allStudents.data ?? []).map(s => [s.id, s]));

  const [editForm, setEditForm] = useState({
    sectionName: '', classType: 'Group', teacherId: '', courseId: '', scheduleDays: '', startTime: '', endTime: '', maxStudents: 20,
  });

  const openEdit = () => {
    if (!data) return;
    setEditForm({
      sectionName: data.sectionName, classType: data.classType, teacherId: data.teacherId, courseId: data.courseId,
      scheduleDays: data.scheduleDays, startTime: data.startTime, endTime: data.endTime ?? '', maxStudents: data.maxStudents ?? 20,
    });
    setShowEdit(true);
  };

  const handleEndSection = async () => {
    setEnding(true);
    try {
      await api.endSection(sectionId);
      queryClient.invalidateQueries({ queryKey: ['section', sectionId] });
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      toast.success('Section ended');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally { setEnding(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSection(sectionId, editForm);
      setShowEdit(false);
      queryClient.invalidateQueries({ queryKey: ['section', sectionId] });
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      toast.success('Section updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const toggleSchedDay = (day: string) => {
    setSchedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const updateSchedPreview = () => {
    const preview = generateSchedule(schedStart, schedEnd, schedDays, schedStartHour, schedEndHour, data?.classType ?? 'Group');
    setSchedPreview(preview);
  };

  const handleScheduleSubmit = async () => {
    if (!data || schedDays.length === 0) return;
    setScheduling(true);
    try {
      const sessions = generateSchedule(schedStart, schedEnd, schedDays, schedStartHour, schedEndHour, data.classType).map(s => ({
        sectionId,
        sessionDate: s.sessionDate,
        sessionNumber: s.sessionNumber,
        sessionType: s.sessionType,
        lessonTitle: undefined,
        durationMinutes: 60,
        status: 'scheduled',
      }));
      await api.bulkCreateClassSessions(sessions);
      setShowSchedule(false);
      setSchedDays([]);
      setSchedPreview([]);
      queryClient.invalidateQueries({ queryKey: ['classSessions', sectionId] });
      toast.success(`${sessions.length} sessions scheduled`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to schedule sessions');
    } finally { setScheduling(false); }
  };

  return (
    <div className="space-y-8">
      <div>
        <Link to="/sections" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <HiOutlineArrowLeft size={16} /> Back to Sections
        </Link>

        {data ? (
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold tracking-tight">{data.sectionName}</h1>
                <Badge variant={data.classType === 'Private' ? 'neutral' : 'success'}>{data.classType}</Badge>
                <Badge variant={data.status === 'active' ? 'success' : 'neutral'}>{data.status}</Badge>
              </div>
              <p className="text-muted-foreground mt-1">{data.scheduleDays} &middot; {data.startTime}-{data.endTime ?? '?'} &middot; Start: {data.startDate}</p>
            </div>
            {isAdmin && data.status === 'active' && (
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={openEdit} className="gap-1.5"><HiOutlinePencilSquare size={14} /> Edit</Button>
                <Button variant="outline" size="sm" onClick={handleEndSection} disabled={ending} className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/5"><HiOutlineStop size={14} /> End</Button>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {section.isLoading && <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-32 bg-muted/50 rounded-xl" /></CardContent></Card>)}</div>}

      {data && (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger active={tab === 'students'} onClick={() => setTab('students')}>Students</TabsTrigger>
            <TabsTrigger active={tab === 'schedule'} onClick={() => setTab('schedule')}>Schedule</TabsTrigger>
            <TabsTrigger active={tab === 'reports'} onClick={() => setTab('reports')}>Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Enrolled Students ({enrollments.data?.length ?? 0})</CardTitle>
                  {isAdmin && <Button size="sm" onClick={() => setShowEnroll(true)} className="gap-1.5">+ Enroll</Button>}
                </div>
              </CardHeader>
              <CardContent>
                {(enrollments.data?.length ?? 0) === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No students enrolled.</p> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Enrolled</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(enrollments.data ?? []).map(e => {
                        const stu = studentMap.get(e.studentId);
                        return (
                          <TableRow key={e.id}>
                            <TableCell className="font-medium">{stu?.studentName ?? e.studentId}</TableCell>
                            <TableCell><Badge variant="neutral">{stu?.level ?? '-'}</Badge></TableCell>
                            <TableCell>{e.enrollmentDate}</TableCell>
                            <TableCell><Badge variant={e.status === 'active' ? 'success' : 'neutral'}>{e.status}</Badge></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Class Sessions</CardTitle>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowSchedule(true)} className="gap-1.5"><HiOutlineCalendarDays size={14} /> Schedule</Button>
                      <Button size="sm" onClick={() => setShowSession(true)} className="gap-1.5">+ Session</Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {(sessions.data?.length ?? 0) === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No sessions scheduled.</p> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>#</TableHead>
                        <TableHead>Lesson</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(sessions.data ?? []).map(s => (
                        <TableRow key={s.id}>
                          <TableCell>{s.sessionDate}</TableCell>
                          <TableCell>{s.sessionNumber}</TableCell>
                          <TableCell>{s.lessonTitle ?? '-'}</TableCell>
                          <TableCell><Badge variant={s.sessionType === 'private' ? 'neutral' : 'success'}>{s.sessionType}</Badge></TableCell>
                          <TableCell><Badge variant={s.status === 'completed' ? 'success' : 'neutral'}>{s.status}</Badge></TableCell>
                          <TableCell><Link to="/sessions/$sessionId" params={{ sessionId: s.id }}><Button variant="ghost" size="sm">Open</Button></Link></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader><CardTitle>Session Reports</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground py-8 text-center">Open individual sessions from the Schedule tab to view and submit reports.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!section.isLoading && !data && <p className="text-red-600">Section not found.</p>}

      {isAdmin && (
        <>
          {/* Edit Section Modal */}
          <Dialog open={showEdit} onOpenChange={setShowEdit}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Edit Section</DialogTitle></DialogHeader>
              <form onSubmit={handleEdit} className="space-y-4 mt-4">
                <div className="space-y-2"><Label>Section Name</Label><Input value={editForm.sectionName} onChange={e => setEditForm({ ...editForm, sectionName: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Class Type</Label><select value={editForm.classType} onChange={e => setEditForm({ ...editForm, classType: e.target.value })} className={selectCls}>{CLASS_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                  <div className="space-y-2"><Label>Status</Label>
                    <select value={editForm.classType} onChange={e => setEditForm({ ...editForm, classType: e.target.value })} className={selectCls} disabled>
                      {SECTION_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Teacher</Label><select value={editForm.teacherId} onChange={e => setEditForm({ ...editForm, teacherId: e.target.value })} required className={selectCls}><option value="">Select teacher</option>{teachersQ.data?.map(t => <option key={t.id} value={t.id}>{t.teacherName}</option>)}</select></div>
                <div className="space-y-2"><Label>Course</Label><select value={editForm.courseId} onChange={e => setEditForm({ ...editForm, courseId: e.target.value })} required className={selectCls}><option value="">Select course</option>{coursesQ.data?.map(c => <option key={c.id} value={c.id}>{c.courseName}</option>)}</select></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Schedule Days</Label><Input value={editForm.scheduleDays} onChange={e => setEditForm({ ...editForm, scheduleDays: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Start Time</Label><Input value={editForm.startTime} onChange={e => setEditForm({ ...editForm, startTime: e.target.value })} type="time" /></div>
                  <div className="space-y-2"><Label>End Time</Label><Input value={editForm.endTime} onChange={e => setEditForm({ ...editForm, endTime: e.target.value })} type="time" /></div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Enroll Student Modal */}
          <Dialog open={showEnroll} onOpenChange={setShowEnroll}>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Enroll Student</DialogTitle></DialogHeader>
              <form onSubmit={async (e) => { e.preventDefault(); if (!selectedStudent) return; await api.createEnrollment(sectionId, { studentId: selectedStudent }); setShowEnroll(false); setSelectedStudent(''); queryClient.invalidateQueries({ queryKey: ['enrollments', sectionId] }); toast.success('Student enrolled'); }} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Student</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Class Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableStudents.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No available students to enroll.</TableCell>
                        </TableRow>
                      )}
                      {availableStudents.map(s => (
                        <TableRow
                          key={s.id}
                          className={`cursor-pointer transition-colors ${selectedStudent === s.id ? 'bg-primary/5' : 'hover:bg-muted/40'}`}
                          onClick={() => setSelectedStudent(s.id)}
                        >
                          <TableCell>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedStudent === s.id ? 'border-primary' : 'border-muted-foreground/40'}`}>
                              {selectedStudent === s.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{s.studentName}</TableCell>
                          <TableCell><Badge variant="neutral">{s.level}</Badge></TableCell>
                          <TableCell>{s.classType}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={!selectedStudent}>Enroll</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Session Modal */}
          <Dialog open={showSession} onOpenChange={setShowSession}>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Session</DialogTitle></DialogHeader>
              <form onSubmit={async (e) => { e.preventDefault(); await api.createClassSession({ sectionId, sessionDate, sessionNumber: Number(sessionNumber), lessonTitle: lessonTitle || undefined, sessionType: data?.classType === 'Private' ? 'private' : 'group' }); setShowSession(false); setLessonTitle(''); queryClient.invalidateQueries({ queryKey: ['classSessions', sectionId] }); toast.success('Session created'); }} className="space-y-4 mt-4">
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Session #</Label><Input type="number" value={sessionNumber} onChange={e => setSessionNumber(e.target.value)} min={1} required /></div>
                <div className="space-y-2"><Label>Lesson Title</Label><Input value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} placeholder="Optional" /></div>
                <div className="flex justify-end pt-2">
                  <Button type="submit">Create Session</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Schedule Recurring Sessions Modal */}
          <Dialog open={showSchedule} onOpenChange={(open) => { setShowSchedule(open); if (!open) { setSchedDays([]); setSchedPreview([]); } }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Schedule Recurring Sessions</DialogTitle></DialogHeader>
              <div className="space-y-5 mt-4">
              <p className="text-sm text-muted-foreground">Generate multiple sessions at once based on a weekly schedule pattern.</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={schedStart} onChange={e => { setSchedStart(e.target.value); setTimeout(updateSchedPreview, 0); }} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={schedEnd} onChange={e => { setSchedEnd(e.target.value); setTimeout(updateSchedPreview, 0); }} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Class Days</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => { toggleSchedDay(day); setTimeout(updateSchedPreview, 0); }}
                      className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border ${
                        schedDays.includes(day)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:border-primary/40 hover:bg-primary/5'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" value={schedStartHour} onChange={e => { setSchedStartHour(e.target.value); setTimeout(updateSchedPreview, 0); }} />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" value={schedEndHour} onChange={e => { setSchedEndHour(e.target.value); setTimeout(updateSchedPreview, 0); }} />
                </div>
              </div>

              {schedPreview.length > 0 && (
                <div className="border border-border rounded-xl p-4 bg-muted/30 max-h-56 overflow-y-auto">
                  <p className="text-sm font-medium mb-3">{schedPreview.length} sessions will be created:</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {schedPreview.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground py-1 px-2 rounded-lg bg-background/60">
                        <span className="font-medium text-foreground">#{s.sessionNumber}</span>
                        <span>{s.sessionDate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => { setShowSchedule(false); setSchedDays([]); setSchedPreview([]); }} className="flex-1">Cancel</Button>
                <Button onClick={handleScheduleSubmit} disabled={scheduling || schedDays.length === 0 || schedPreview.length === 0} className="flex-1">
                  {scheduling ? 'Scheduling...' : `Create ${schedPreview.length} Sessions`}
                </Button>
              </div>
            </div>
          </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
