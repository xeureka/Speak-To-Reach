import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from '@tanstack/react-router';
import { HiOutlineArrowLeft } from 'react-icons/hi2';

import { api } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export function StudentPage() {
  const { studentId } = useParams({ from: '/protected/students/$studentId' });
  const data = useQuery({ queryKey: ['student', studentId], queryFn: () => api.studentPage(studentId), retry: false });

  const student = data.data?.student;

  return (
    <div className="space-y-8">
      <div>
        <Link to="/students" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <HiOutlineArrowLeft size={16} /> Back to Students
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{student?.studentName ?? 'Student'}</h1>
        <p className="text-muted-foreground mt-1">Level: {student?.level ?? '...'} &middot; {student?.classType}</p>
      </div>

      {data.isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-40 bg-muted/50 rounded-xl" /></CardContent></Card>)}
        </div>
      )}

      {data.data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Sections</CardTitle></CardHeader>
            <CardContent>
              {data.data.sections.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">Not enrolled in any sections.</p> : (
                <div className="space-y-2">
                  {data.data.sections.map(s => (
                    <Link key={s.id} to={`/sections/$sectionId`} params={{ sectionId: s.id }} className="block p-3.5 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all group">
                      <div className="font-medium text-sm group-hover:text-primary transition-colors">{s.sectionName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{s.scheduleDays} &middot; {s.startTime}</div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Attendance History</CardTitle></CardHeader>
            <CardContent>
              {data.data.attendance.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No attendance records.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Session</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.data.attendance.slice(0, 10).map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="text-sm font-mono">{a.classSessionId.slice(0, 12)}...</TableCell>
                        <TableCell><Badge variant={a.present ? 'success' : a.absent ? 'destructive' : 'warning'}>{a.attendanceStatus}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
