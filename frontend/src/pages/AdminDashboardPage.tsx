import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { HiOutlineArrowRight } from 'react-icons/hi2';

import { api, type DashboardData } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-[3rem] ${color} opacity-10`} />
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold mt-1.5 tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

export function AdminDashboardPage() {
  const dashboard = useQuery({ queryKey: ['dashboard', 'admin'], queryFn: api.adminDashboard, retry: false });
  const data = dashboard.data as DashboardData | undefined;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your teaching operations.</p>
      </div>

      {dashboard.isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="p-5"><div className="h-3 w-24 bg-muted rounded mb-3" /><div className="h-8 w-16 bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      )}

      {dashboard.isError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-5"><p className="text-destructive font-medium">Failed to load dashboard.</p></CardContent>
        </Card>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Active Sections" value={data.totalActiveSections} color="bg-primary" />
            <MetricCard label="Group Classes" value={data.activeGroupSections} color="bg-emerald-500" />
            <MetricCard label="Private Classes" value={data.activePrivateSections} color="bg-violet-500" />
            <MetricCard label="Active Teachers" value={data.totalActiveTeachers} color="bg-amber-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Active Sections</CardTitle>
                  <Link to="/sections"><Button variant="ghost" size="sm" className="gap-1.5 text-primary">View All <HiOutlineArrowRight size={14} /></Button></Link>
                </div>
              </CardHeader>
              <CardContent>
                {data.sections.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No active sections.</p>
                ) : (
                  <div className="space-y-2">
                    {data.sections.slice(0, 6).map((section) => (
                      <Link key={section.id} to={`/sections/$sectionId`} params={{ sectionId: section.id }} className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all group">
                        <div className="min-w-0">
                          <div className="font-medium text-sm group-hover:text-primary transition-colors truncate">{section.sectionName}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{section.scheduleDays} &middot; {section.startTime}</div>
                        </div>
                        <Badge variant={section.classType === 'Private' ? 'neutral' : 'success'} className="shrink-0 ml-3">{section.classType}</Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Today's Classes</CardTitle></CardHeader>
              <CardContent>
                {data.todaysClasses.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No classes scheduled today.</p>
                ) : (
                  <div className="space-y-2">
                    {data.todaysClasses.map((session) => (
                      <Link key={session.id} to={`/sessions/$sessionId`} params={{ sessionId: session.id }} className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all group">
                        <div className="min-w-0">
                          <div className="font-medium text-sm group-hover:text-primary transition-colors truncate">{session.lessonTitle ?? `Session #${session.sessionNumber}`}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{session.sessionDate} &middot; {session.durationMinutes}min</div>
                        </div>
                        <Badge variant={session.status === 'completed' ? 'success' : 'neutral'} className="shrink-0 ml-3">{session.status}</Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
