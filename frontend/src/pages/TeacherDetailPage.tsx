import { useParams, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { HiOutlineArrowLeft, HiOutlineAcademicCap, HiOutlineUserGroup, HiOutlineClock, HiOutlineBookOpen, HiOutlineCalendarDays, HiOutlineDocumentText } from 'react-icons/hi2';

import { api } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: typeof HiOutlineAcademicCap; color: string }) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-[2.5rem] ${color} opacity-10`} />
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${color} opacity-15`}>
            <Icon size={20} className={`${color.replace('bg-', 'text-')}`} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TeacherDetailPage() {
  const { teacherId } = useParams({ from: '/protected/teachers/$teacherId' });

  const teachers = useQuery({ queryKey: ['teachers'], queryFn: () => api.teachers(), retry: false });
  const teacher = teachers.data?.find(t => t.id === teacherId);

  const analytics = useQuery({
    queryKey: ['teacherAnalytics', teacherId],
    queryFn: () => api.teacherAnalytics(teacherId),
    enabled: !!teacherId,
    retry: false,
  });

  const data = analytics.data;

  return (
    <div className="space-y-8">
      <div>
        <Link to="/teachers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <HiOutlineArrowLeft size={16} /> Back to Teachers
        </Link>
        {teacher && (
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{teacher.teacherName}</h1>
            <p className="text-muted-foreground mt-1">{teacher.email} &middot; {teacher.phone ?? 'No phone'}</p>
          </div>
        )}
      </div>

      {analytics.isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="p-5"><div className="h-16 bg-muted/50 rounded-xl" /></CardContent></Card>
          ))}
        </div>
      )}

      {data && (
        <>
          {/* Top Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Sections" value={data.totalSections} icon={HiOutlineAcademicCap} color="bg-primary" />
            <StatCard label="Students" value={data.totalStudents} icon={HiOutlineUserGroup} color="bg-emerald-500" />
            <StatCard label="Sessions This Month" value={`${data.monthSessionsCompleted}/${data.monthSessionsTotal}`} icon={HiOutlineCalendarDays} color="bg-violet-500" />
            <StatCard label="Hours This Month" value={data.monthHoursTotal} icon={HiOutlineClock} color="bg-amber-500" />
          </div>

          {/* Course Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/10">
                    <HiOutlineUserGroup size={16} className="text-violet-600" />
                  </div>
                  Private Classes
                  <Badge variant="neutral" className="ml-auto">{data.privateSections}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.privateSectionNames.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No private sections assigned.</p>
                ) : (
                  <div className="space-y-2">
                    {data.privateSectionNames.map((name, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/5 border border-violet-200/50">
                        <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                        <span className="text-sm font-medium">{name}</span>
                        <Badge variant="neutral" className="ml-auto text-xs">1:1</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10">
                    <HiOutlineUserGroup size={16} className="text-emerald-600" />
                  </div>
                  Group Classes
                  <Badge variant="neutral" className="ml-auto">{data.groupSections}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.groupSectionNames.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No group sections assigned.</p>
                ) : (
                  <div className="space-y-2">
                    {data.groupSectionNames.map((name, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-200/50">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-sm font-medium">{name}</span>
                        <Badge variant="success" className="ml-auto text-xs">Group</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Reports Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10">
                  <HiOutlineDocumentText size={16} className="text-amber-600" />
                </div>
                Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-2xl font-bold">{data.reportsSubmitted}</p>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div>
                    <p className="text-2xl font-bold">{data.reportsDraft}</p>
                    <p className="text-xs text-muted-foreground">Drafts</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                  <div>
                    <p className="text-2xl font-bold">{data.totalSessionsEver - data.reportsSubmitted - data.reportsDraft}</p>
                    <p className="text-xs text-muted-foreground">No Report</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Sessions - Horizontal Scroll */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                  <HiOutlineCalendarDays size={16} className="text-primary" />
                </div>
                Recent Sessions
                <span className="text-xs font-normal text-muted-foreground ml-1">({data.recentSessions.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No sessions yet.</p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {data.recentSessions.map((session) => (
                    <Link
                      key={session.id}
                      to={`/sessions/$sessionId`}
                      params={{ sessionId: session.id }}
                      className="flex-shrink-0 w-56 p-4 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={session.sectionClassType === 'Private' ? 'neutral' : 'success'} className="text-xs">{session.sectionClassType}</Badge>
                        <Badge variant={session.status === 'completed' ? 'success' : 'neutral'} className="text-xs">{session.status}</Badge>
                      </div>
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{session.sectionName}</p>
                      <p className="text-xs text-muted-foreground mt-1">{session.sessionDate}</p>
                      <p className="text-xs text-muted-foreground">Session #{session.sessionNumber}</p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
