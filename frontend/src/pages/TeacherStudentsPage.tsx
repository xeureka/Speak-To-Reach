import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { api } from '../api';
import { useAuth } from '../auth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

export function TeacherStudentsPage() {
  const { user } = useAuth();
  const teacherId = user?.teacherId ?? '';

  const students = useQuery({
    queryKey: ['teacherStudents', teacherId],
    queryFn: () => api.teacherStudents(teacherId),
    enabled: !!teacherId,
    retry: false,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Students</h1>
        <p className="text-muted-foreground mt-1">Students assigned to your sections.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Assigned Students ({students.data?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {students.isLoading && <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-muted/50 rounded-xl animate-pulse" />)}</div>}
          {students.data && students.data.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No students assigned to you yet.</p>}
          {students.data && students.data.length > 0 && (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Level</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {students.data.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.studentName}</TableCell>
                    <TableCell><Badge variant="neutral">{s.level}</Badge></TableCell>
                    <TableCell>{s.classType}</TableCell>
                    <TableCell><Badge variant={s.status === 'Active' ? 'success' : 'neutral'}>{s.status}</Badge></TableCell>
                    <TableCell><Link to={`/students/$studentId`} params={{ studentId: s.id }}><Button variant="ghost" size="sm">View</Button></Link></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
