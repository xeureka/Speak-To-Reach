import { useState, useEffect } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HiOutlineArrowLeft, HiOutlineCheckCircle, HiOutlineDocumentText } from 'react-icons/hi2';
import { toast } from 'sonner';

import { api, type SessionAttendance } from '../api';
import { useAuth } from '../auth';
import { ATTENDANCE_OPTIONS } from '../lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

function ReportField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value || <span className="text-muted-foreground italic">Not filled</span>}</p>
    </div>
  );
}

export function SessionActionPage() {
  const { sessionId } = useParams({ from: '/protected/sessions/$sessionId' });
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const sessions = useQuery({ queryKey: ['allSessions'], queryFn: () => api.classSessions({}), retry: false });
  const session = sessions.data?.find(s => s.id === sessionId);

  const section = useQuery({
    queryKey: ['section', session?.sectionId],
    queryFn: () => api.getSection(session!.sectionId),
    enabled: !!session?.sectionId,
    retry: false,
  });

  const enrollments = useQuery({
    queryKey: ['enrollments', session?.sectionId],
    queryFn: () => api.enrollments(session!.sectionId),
    enabled: !!session?.sectionId,
    retry: false,
  });

  const allStudents = useQuery({ queryKey: ['students'], queryFn: () => api.students({}), retry: false });

  const existingAttendance = useQuery({
    queryKey: ['attendance', sessionId],
    queryFn: () => api.getAttendance(sessionId),
    retry: false,
  });

  const existingReport = useQuery({
    queryKey: ['report', sessionId],
    queryFn: () => api.getReport(sessionId),
    retry: false,
  });

  const studentMap = new Map((allStudents.data ?? []).map(s => [s.id, s]));
  const enrolledStudents = (enrollments.data ?? [])
    .filter(e => e.status === 'active')
    .map(e => ({ ...e, student: studentMap.get(e.studentId) }))
    .filter(e => e.student);

  const isGroup = session?.sessionType === 'group';
  const isCompleted = session?.status === 'completed';

  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [report, setReport] = useState({
    homeworkGiven: '',
    vocabularyCovered: '',
    grammarCovered: '',
    speakingPractice: '',
    readingPractice: '',
    writingPractice: '',
    listeningPractice: '',
    generalNotes: '',
  });

  const [saving, setSaving] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  useEffect(() => {
    if (existingAttendance.data) {
      const map: Record<string, string> = {};
      for (const entry of existingAttendance.data) {
        map[entry.studentId] = entry.attendanceStatus;
      }
      setAttendance(map);
    }
  }, [existingAttendance.data]);

  useEffect(() => {
    if (existingReport.data) {
      setReport({
        homeworkGiven: existingReport.data.homeworkGiven ?? '',
        vocabularyCovered: existingReport.data.vocabularyCovered ?? '',
        grammarCovered: existingReport.data.grammarCovered ?? '',
        speakingPractice: existingReport.data.speakingPractice ?? '',
        readingPractice: existingReport.data.readingPractice ?? '',
        writingPractice: existingReport.data.writingPractice ?? '',
        listeningPractice: existingReport.data.listeningPractice ?? '',
        generalNotes: existingReport.data.generalNotes ?? '',
      });
    }
  }, [existingReport.data]);

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const entries = enrolledStudents.map(e => ({
        studentId: e.studentId,
        attendanceStatus: attendance[e.studentId] ?? 'Present',
      }));
      await api.submitAttendance(sessionId, entries);
      queryClient.invalidateQueries({ queryKey: ['attendance', sessionId] });
      toast.success('Attendance saved as draft');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveReport = async () => {
    setSaving(true);
    try {
      await api.submitReport(sessionId, { ...report, reportStatus: 'draft' });
      queryClient.invalidateQueries({ queryKey: ['report', sessionId] });
      toast.success('Report saved as draft');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteSession = async () => {
    setSaving(true);
    try {
      const entries = enrolledStudents.map(e => ({
        studentId: e.studentId,
        attendanceStatus: attendance[e.studentId] ?? 'Present',
      }));
      await api.submitAttendance(sessionId, entries);
      await api.submitReport(sessionId, { ...report, reportStatus: 'submitted' });
      await api.completeClassSession(sessionId);
      queryClient.invalidateQueries({ queryKey: ['allSessions'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['report', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'admin'] });
      toast.success('Session completed and submitted');
      setShowCompleteConfirm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete session');
    } finally {
      setSaving(false);
    }
  };

  if (sessions.isLoading) {
    return <div className="space-y-4"><div className="h-8 w-48 bg-muted rounded-xl animate-pulse" /><div className="h-64 bg-muted rounded-xl animate-pulse" /></div>;
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <Link to="/sessions" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <HiOutlineArrowLeft size={16} /> Back to Sessions
        </Link>
        <Card><CardContent className="p-8 text-center text-muted-foreground">Session not found.</CardContent></Card>
      </div>
    );
  }

  const hasUnsavedAttendance = enrolledStudents.some(e => attendance[e.studentId] && !existingAttendance.data?.some(a => a.studentId === e.studentId && a.attendanceStatus === attendance[e.studentId]));

  return (
    <div className="space-y-8">
      <div>
        <Link to="/sessions" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <HiOutlineArrowLeft size={16} /> Back to Sessions
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold tracking-tight">{session.lessonTitle ?? `Session #${session.sessionNumber}`}</h1>
          <Badge variant={session.sessionType === 'private' ? 'neutral' : 'success'}>{session.sessionType}</Badge>
          <Badge variant={isCompleted ? 'success' : session.status === 'cancelled' ? 'destructive' : 'neutral'}>{session.status}</Badge>
        </div>
        <p className="text-muted-foreground mt-1">{section.data?.sectionName ?? '...'} &middot; {session.sessionDate} &middot; {session.durationMinutes}min</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Attendance</CardTitle>
              {!isCompleted && existingAttendance.data && existingAttendance.data.length > 0 && <Badge variant="outline">Draft saved</Badge>}
              {isCompleted && <Badge variant="success">Submitted</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            {enrolledStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No students enrolled in this section.</p>
            ) : (
              <div className="space-y-4">
                {isGroup ? (
                  <Table>
                    <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {enrolledStudents.map(e => (
                        <TableRow key={e.studentId}>
                          <TableCell className="font-medium">{e.student!.studentName}</TableCell>
                          <TableCell>
                            <select
                              value={attendance[e.studentId] ?? 'Present'}
                              onChange={(ev) => setAttendance({ ...attendance, [e.studentId]: ev.target.value })}
                              disabled={isCompleted}
                              className="flex h-9 rounded-lg border border-border bg-background px-2.5 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                              {ATTENDANCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="space-y-3">
                    {enrolledStudents.map(e => (
                      <div key={e.studentId} className="flex items-center justify-between p-3.5 rounded-xl border border-border/60">
                        <div>
                          <div className="font-medium text-sm">{e.student!.studentName}</div>
                          <div className="text-xs text-muted-foreground">{e.student!.level} &middot; {e.student!.classType}</div>
                        </div>
                        <div className="flex gap-1.5">
                          {ATTENDANCE_OPTIONS.map(opt => (
                            <button
                              key={opt}
                              type="button"
                              disabled={isCompleted}
                              onClick={() => setAttendance({ ...attendance, [e.studentId]: opt })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${(attendance[e.studentId] ?? 'Present') === opt
                                ? opt === 'Present' ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                  : opt === 'Absent' ? 'bg-red-100 text-red-700 border-red-300'
                                  : opt === 'Late' ? 'bg-amber-100 text-amber-700 border-amber-300'
                                  : 'bg-gray-100 text-gray-700 border-gray-300'
                                : 'bg-background hover:bg-muted/50 border-border/60'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!isCompleted && (
                  <Button onClick={handleSaveAttendance} disabled={saving} variant="outline" className="gap-1.5">
                    {saving ? 'Saving...' : 'Save Attendance'}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session Report Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Session Report</CardTitle>
              {!isCompleted && existingReport.data && <Badge variant="outline">Draft saved</Badge>}
              {isCompleted && <Badge variant="success">Submitted</Badge>}
            </div>
            {isGroup && <p className="text-xs text-muted-foreground">One report covers the whole group.</p>}
            {!isGroup && enrolledStudents.length === 1 && <p className="text-xs text-muted-foreground">Report for {enrolledStudents[0]?.student?.studentName}.</p>}
          </CardHeader>
          <CardContent>
            {isCompleted ? (
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-4">
                  <HiOutlineDocumentText size={18} className="text-primary" />
                  <p className="text-sm font-medium">Submitted Report</p>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <ReportField label="Homework Given" value={report.homeworkGiven || existingReport.data?.homeworkGiven} />
                  <ReportField label="Vocabulary Covered" value={report.vocabularyCovered || existingReport.data?.vocabularyCovered} />
                  <ReportField label="Grammar Covered" value={report.grammarCovered || existingReport.data?.grammarCovered} />
                  <ReportField label="Speaking Practice" value={report.speakingPractice || existingReport.data?.speakingPractice} />
                  <ReportField label="Reading Practice" value={report.readingPractice || existingReport.data?.readingPractice} />
                  <ReportField label="Writing Practice" value={report.writingPractice || existingReport.data?.writingPractice} />
                  <ReportField label="Listening Practice" value={report.listeningPractice || existingReport.data?.listeningPractice} />
                </div>
                <ReportField label="General Notes" value={report.generalNotes || existingReport.data?.generalNotes} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Homework Given</Label>
                  <Textarea value={report.homeworkGiven} onChange={e => setReport({ ...report, homeworkGiven: e.target.value })} placeholder="Describe homework assigned..." rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Vocabulary Covered</Label><Input value={report.vocabularyCovered} onChange={e => setReport({ ...report, vocabularyCovered: e.target.value })} placeholder="Topics..." /></div>
                  <div className="space-y-2"><Label>Grammar Covered</Label><Input value={report.grammarCovered} onChange={e => setReport({ ...report, grammarCovered: e.target.value })} placeholder="Topics..." /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Speaking Practice</Label><Input value={report.speakingPractice} onChange={e => setReport({ ...report, speakingPractice: e.target.value })} placeholder="Activities..." /></div>
                  <div className="space-y-2"><Label>Reading Practice</Label><Input value={report.readingPractice} onChange={e => setReport({ ...report, readingPractice: e.target.value })} placeholder="Activities..." /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Writing Practice</Label><Input value={report.writingPractice} onChange={e => setReport({ ...report, writingPractice: e.target.value })} placeholder="Activities..." /></div>
                  <div className="space-y-2"><Label>Listening Practice</Label><Input value={report.listeningPractice} onChange={e => setReport({ ...report, listeningPractice: e.target.value })} placeholder="Activities..." /></div>
                </div>
                <div className="space-y-2">
                  <Label>General Notes</Label>
                  <Textarea value={report.generalNotes} onChange={e => setReport({ ...report, generalNotes: e.target.value })} placeholder="Additional observations..." rows={2} />
                </div>
                <Button onClick={handleSaveReport} disabled={saving} variant="outline" className="gap-1.5">
                  {saving ? 'Saving...' : 'Save Report'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!isCompleted && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Complete & Submit Session</p>
              <p className="text-xs text-muted-foreground mt-0.5">This will save all attendance and report data, then mark the session as completed. Submissions cannot be changed after.</p>
            </div>
            <Button onClick={() => setShowCompleteConfirm(true)} disabled={saving} className="gap-1.5 shrink-0 ml-4">
              <HiOutlineCheckCircle size={16} /> Complete Session
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCompleteConfirm} onOpenChange={setShowCompleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Session?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">This will submit the attendance and report to the admin and mark the session as completed. You won't be able to edit afterwards.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCompleteConfirm(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleCompleteSession} disabled={saving} className="flex-1">
                {saving ? 'Submitting...' : 'Yes, Complete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
