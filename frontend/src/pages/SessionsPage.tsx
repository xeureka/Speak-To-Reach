import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { HiOutlineCheckCircle } from 'react-icons/hi2';
import { toast } from 'sonner';

import { api } from '../api';
import { useAuth } from '../auth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

export function SessionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'today' | 'all'>('today');

  const isTeacher = user?.role === 'teacher';
  const teacherId = isTeacher ? user?.teacherId : undefined;

  const sessions = useQuery({
    queryKey: ['sessions', view, teacherId],
    queryFn: () => api.classSessions({ ...(view === 'today' ? { view: 'today' as const } : {}), teacherId }),
    retry: false,
  });
  const sections = useQuery({
    queryKey: ['sections', teacherId],
    queryFn: () => api.sections(teacherId ? { teacherId } : {}),
    retry: false,
  });

  const sectionMap = new Map((sections.data ?? []).map(s => [s.id, s]));

  const handleComplete = async (id: string) => {
    try {
      await api.completeClassSession(id);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session completed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground mt-1">{isTeacher ? 'Your class sessions.' : 'View and manage class sessions.'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === 'today' ? 'default' : 'outline'} size="sm" onClick={() => setView('today')}>Today</Button>
          <Button variant={view === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setView('all')}>All</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>{view === 'today' ? "Today's Sessions" : 'All Sessions'}</CardTitle></CardHeader>
        <CardContent>
          {sessions.isLoading && <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-muted/50 rounded-xl animate-pulse" />)}</div>}
          {sessions.data && sessions.data.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No sessions found.</p>}
          {sessions.data && sessions.data.length > 0 && (
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Section</TableHead><TableHead>Lesson</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {sessions.data.map(s => {
                  const sec = sectionMap.get(s.sectionId);
                  return (
                    <TableRow key={s.id}>
                      <TableCell>{s.sessionDate}</TableCell>
                      <TableCell className="font-medium">{sec?.sectionName ?? s.sectionId}</TableCell>
                      <TableCell>{s.lessonTitle ?? `#${s.sessionNumber}`}</TableCell>
                      <TableCell><Badge variant={s.sessionType === 'private' ? 'neutral' : 'success'}>{s.sessionType}</Badge></TableCell>
                      <TableCell><Badge variant={s.status === 'completed' ? 'success' : s.status === 'cancelled' ? 'destructive' : 'neutral'}>{s.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          <Link to="/sessions/$sessionId" params={{ sessionId: s.id }}>
                            <Button variant="ghost" size="sm">Open</Button>
                          </Link>
                          {s.status !== 'completed' && (
                            <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 gap-1" onClick={() => handleComplete(s.id)}>
                              <HiOutlineCheckCircle size={14} /> Done
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
