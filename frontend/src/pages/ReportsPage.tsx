import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { api, type DashboardData, type ClassSession } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export function ReportsPage() {
  const dashboard = useQuery({ queryKey: ['dashboard', 'admin'], queryFn: api.adminDashboard, retry: false });
  const analytics = useQuery({ queryKey: ['reportsAnalytics'], queryFn: () => api.reportsAnalytics(), retry: false });
  const data = dashboard.data as DashboardData | undefined;

  const sortedActivity = useMemo(() => {
    if (!data) return [];
    return [...data.recentActivity].sort((a: ClassSession, b: ClassSession) => b.sessionDate.localeCompare(a.sessionDate));
  }, [data]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1">Sections overview and teacher activity.</p>
      </div>

      {dashboard.isLoading && <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-40 bg-muted/50 rounded-xl" /></CardContent></Card>)}</div>}

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Active Sections</p><p className="text-2xl font-bold mt-1">{data.totalActiveSections}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Active Teachers</p><p className="text-2xl font-bold mt-1">{data.totalActiveTeachers}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Group Classes</p><p className="text-2xl font-bold mt-1">{data.activeGroupSections}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Private Classes</p><p className="text-2xl font-bold mt-1">{data.activePrivateSections}</p></CardContent></Card>
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>
              {sortedActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No recent activity.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedActivity.map(s => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <Link to={`/sessions/$sessionId`} params={{ sessionId: s.id }} className="font-medium hover:text-primary transition-colors">
                            {s.lessonTitle ?? `Session #${s.sessionNumber}`}
                          </Link>
                        </TableCell>
                        <TableCell>{s.sessionDate}</TableCell>
                        <TableCell><Badge variant={s.status === 'completed' ? 'success' : 'neutral'}>{s.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Teachers Missing Reports Today</CardTitle></CardHeader>
            <CardContent>
              {analytics.isLoading && <div className="h-24 bg-muted/50 rounded-xl animate-pulse" />}
              {analytics.data && analytics.data.teachersMissingLessonReports.length === 0 && (
                <p className="text-sm text-muted-foreground py-8 text-center">All teachers have submitted reports today.</p>
              )}
              {analytics.data && analytics.data.teachersMissingLessonReports.length > 0 && (
                <Table>
                  <TableHeader><TableRow><TableHead>Teacher</TableHead><TableHead>Email</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {analytics.data.teachersMissingLessonReports.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.teacherName}</TableCell>
                        <TableCell>{t.email}</TableCell>
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
