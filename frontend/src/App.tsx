import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type React from 'react';
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRootRoute, createRoute, createRouter, Link, Outlet, RouterProvider, useLocation, useParams, useRouter } from '@tanstack/react-router';

import { AuthProvider, useAuth } from './auth';
import { api, type Assignment, type DashboardData, type Homework, type Progress, type Session, type Student, type Teacher, type TeacherPerformance, type User } from './api';
import { HiOutlineHome, HiOutlineAcademicCap, HiOutlineUserGroup, HiOutlineBookOpen, HiOutlineClipboardDocumentList, HiOutlineCalendarDays, HiOutlinePencilSquare, HiOutlineChartBarSquare, HiOutlineChatBubbleLeftRight, HiOutlineShieldCheck, HiOutlineUser, HiOutlineArrowRightOnRectangle, HiOutlineChevronDoubleLeft, HiOutlineChevronDoubleRight } from 'react-icons/hi2';
import './App.css';

const queryClient = new QueryClient();

function MetricCard({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return <section className="metric-card"><span>{label}</span><strong>{value}</strong><small>{hint}</small></section>;
}

function Table<T extends { id: string }>({ rows, columns }: { rows: T[]; columns: { label: string; render: (row: T) => React.ReactNode }[] }) {
  return (
    <div className="table-wrap"><table><thead><tr>{columns.map((c) => <th key={c.label}>{c.label}</th>)}</tr></thead><tbody>
      {rows.map((row) => <tr key={row.id}>{columns.map((c) => <td key={c.label}>{c.render(row)}</td>)}</tr>)}
    </tbody></table></div>
  );
}

function Skeleton() { return <div className="skeleton" aria-label="Loading" />; }

function Badge({ children }: { children: React.ReactNode }) { return <span className="badge">{children}</span>; }

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="panel"><header><h2>{title}</h2></header>{children}</section>;
}

function Page({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (<><header className="page-header"><div><h1>{title}</h1><p>{subtitle}</p></div></header><div className="divider" />{children}</>);
}

function StudentList({ rows, linked = false }: { rows: Student[]; linked?: boolean }) {
  const columns = useMemo(() => [
    { label: 'Student', render: (r: Student) => linked ? <Link to="/students/$studentId" params={{ studentId: r.id }}>{r.studentName}</Link> : r.studentName },
    { label: 'Level', render: (r: Student) => r.level },
    { label: 'Type', render: (r: Student) => r.classType },
    { label: 'Status', render: (r: Student) => <Badge>{r.status}</Badge> },
  ], [linked]);
  return <Table rows={rows} columns={columns} />;
}

function TeacherList({ rows }: { rows: Teacher[] }) {
  return <Table rows={rows} columns={[{ label: 'Teacher', render: (r) => r.teacherName }, { label: 'Email', render: (r) => r.email }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> }]} />;
}

function CourseList({ rows }: { rows: { id: string; courseName: string; level: string; totalUnits: number; totalLessons: number }[] }) {
  return <Table rows={rows} columns={[{ label: 'Course', render: (r) => r.courseName }, { label: 'Level', render: (r) => r.level }, { label: 'Units', render: (r) => r.totalUnits }, { label: 'Lessons', render: (r) => r.totalLessons }]} />;
}

function AssignmentList({ rows }: { rows: Assignment[] }) {
  return <Table rows={rows} columns={[{ label: 'Assignment', render: (r) => r.assignmentName }, { label: 'Days', render: (r) => r.days }, { label: 'Time', render: (r) => r.startTime }, { label: 'Mode', render: (r) => r.mode }, { label: 'Status', render: (r) => <Badge>{r.status}</Badge> }]} />;
}

function SessionList({ rows }: { rows: Session[] }) {
  return <Table rows={rows} columns={[{ label: 'Session', render: (r) => r.sessionName }, { label: 'Date', render: (r) => r.sessionDate }, { label: 'Lesson', render: (r) => `${r.lessonNumber}. ${r.lessonTitle}` }, { label: 'Attendance', render: (r) => <Badge>{r.attendance}</Badge> }]} />;
}

function HomeworkList({ rows }: { rows: Homework[] }) {
  return <Table rows={rows} columns={[{ label: 'Homework', render: (r) => r.homework }, { label: 'Due', render: (r) => r.dueDate }, { label: 'Submitted', render: (r) => r.submitted ? 'Yes' : 'No' }, { label: 'Score', render: (r) => r.score ?? '-' }]} />;
}

function ProgressList({ rows }: { rows: Progress[] }) {
  return <Table rows={rows} columns={[{ label: 'Student', render: (r) => r.studentId }, { label: 'Unit', render: (r) => r.currentUnit }, { label: 'Lesson', render: (r) => r.currentLesson }, { label: 'Complete', render: (r) => `${r.completionPercentage}%` }]} />;
}

function CalendarView({ rows }: { rows: Session[] }) {
  return <div className="calendar-grid">{rows.map((r) => <article key={r.id} className="calendar-item"><strong>{r.sessionDate}</strong><span>{r.lessonTitle}</span><Badge>{r.attendance}</Badge></article>)}</div>;
}

function DashboardGrid({ data }: { data: DashboardData }) {
  return (
    <>
      <div className="metrics-grid">
        <MetricCard label="Today's Classes" value={data.todayClasses.length} hint="Active filtered class views" />
        <MetricCard label="Attendance Today" value={data.todayAttendance.length} hint="Session reports submitted" />
        <MetricCard label="Pending Homework" value={data.homeworkPending.length} hint="Open homework records" />
        <MetricCard label="Low Attendance" value={data.reports.studentsWithLowAttendance.length} hint="Below 75%" />
      </div>
      <div className="dashboard-grid">
        <Panel title="Today's Classes"><AssignmentList rows={data.todayClasses} /></Panel>
        <Panel title="Recent Lesson Reports"><SessionList rows={data.recentLessonReports} /></Panel>
        <Panel title="Teacher Performance">
          <Table rows={data.teacherPerformance.map((r): TeacherPerformance & { id: string } => ({ ...r, id: r.teacherId }))} columns={[
            { label: 'Teacher', render: (r) => r.teacherName },
            { label: 'Completed', render: (r) => r.classesCompleted },
            { label: 'Attendance', render: (r) => `${r.studentAttendancePercentage}%` },
            { label: 'Homework', render: (r) => `${r.homeworkCompletionPercentage}%` },
          ]} />
        </Panel>
        <Panel title="Student Progress"><ProgressList rows={data.studentProgress} /></Panel>
      </div>
    </>
  );
}

function roleRedirect(user: User): string {
  if (user.role === 'teacher') return '/teacher';
  if (user.role === 'student' && user.studentId) return `/students/${user.studentId}`;
  return '/';
}

function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      router.navigate({ to: roleRedirect(user) });
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (em: string, pw: string) => {
    setEmail(em);
    setPassword(pw);
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-brand">
          <div><strong>Speak To Reach</strong><small>Management System</small></div>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '8px' }}>
          <div
            onClick={() => fillCredentials('admin@speaktoreach.local', 'admin123')}
            style={{ padding: '12px 8px', border: '1px solid #dce3e1', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', background: email === 'admin@speaktoreach.local' ? '#e8f5f3' : '#fff', fontWeight: 600 }}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px', lineHeight: 1 }}><HiOutlineShieldCheck size={28} /></div>
            <div style={{ fontSize: '13px' }}>Admin</div>
          </div>
          <div
            onClick={() => fillCredentials('maya@speaktoreach.local', 'teacher123')}
            style={{ padding: '12px 8px', border: '1px solid #dce3e1', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', background: email === 'maya@speaktoreach.local' ? '#e8f5f3' : '#fff', fontWeight: 600 }}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px', lineHeight: 1 }}><HiOutlineAcademicCap size={28} /></div>
            <div style={{ fontSize: '13px' }}>Teacher</div>
          </div>
          <div
            onClick={() => fillCredentials('sara@example.com', 'student123')}
            style={{ padding: '12px 8px', border: '1px solid #dce3e1', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', background: email === 'sara@example.com' ? '#e8f5f3' : '#fff', fontWeight: 600 }}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px', lineHeight: 1 }}><HiOutlineUser size={28} /></div>
            <div style={{ fontSize: '13px' }}>Student</div>
          </div>
        </div>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
      </form>
    </div>
  );
}

function RootLayout() {
  return <Outlet />;
}

function ProtectedLayout() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const location = useLocation();
  const [sidebarCompact, setSidebarCompact] = useState(() => localStorage.getItem('sidebar-compact') === 'true');

  useEffect(() => {
    if (!isLoading && !user) {
      router.navigate({ to: '/login' });
    }
  }, [isLoading, user, router]);

  const adminOnly = useMemo(() => ['/', '/courses', '/assignments', '/sessions', '/homework', '/reports'], []);
  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin' && adminOnly.includes(location.pathname)) {
      router.navigate({ to: user.role === 'teacher' ? '/teacher' : `/students/${user.studentId}` });
    } else if (user.role === 'student') {
      const myPage = user.studentId ? `/students/${user.studentId}` : '/login';
      if (location.pathname !== myPage) {
        router.navigate({ to: myPage });
      }
    }
  }, [user, location.pathname, adminOnly, router]);

  if (isLoading) return <div className="loading-screen"><Skeleton /></div>;
  if (!user) return null;

  const toggleCompact = () => {
    const next = !sidebarCompact;
    setSidebarCompact(next);
    localStorage.setItem('sidebar-compact', String(next));
  };

  const navItems = useMemo(() => {
    if (user.role === 'admin') {
      return [
        { to: '/', icon: HiOutlineHome, label: 'Dashboard' },
        { to: '/students', icon: HiOutlineUserGroup, label: 'Students' },
        { to: '/courses', icon: HiOutlineBookOpen, label: 'Courses' },
        { to: '/assignments', icon: HiOutlineClipboardDocumentList, label: 'Assignments' },
        { to: '/sessions', icon: HiOutlineCalendarDays, label: 'Sessions' },
        { to: '/homework', icon: HiOutlinePencilSquare, label: 'Homework' },
        { to: '/reports', icon: HiOutlineChartBarSquare, label: 'Reports' },
      ];
    }
    if (user.role === 'teacher') {
      return [
        { to: '/teacher', icon: HiOutlineAcademicCap, label: 'Teacher Dashboard' },
        { to: '/students', icon: HiOutlineUserGroup, label: 'Students' },
      ];
    }
    return [
      { to: `/students/${user.studentId}`, icon: HiOutlineUser, label: 'My Page' },
    ];
  }, [user.role, user.studentId]);

  return (
    <div className={`app-shell ${sidebarCompact ? 'app-shell-compact' : ''}`}>
      <aside className={`sidebar ${sidebarCompact ? 'sidebar-compact' : ''}`}>
        <div className="brand">
          <div className="brand-icon"><HiOutlineChatBubbleLeftRight size={24} /></div>
          <div>
            <strong>Speak To Reach</strong>
            {!sidebarCompact && <small>{user.name}</small>}
          </div>
        </div>
        <nav>
          {navItems.map((item) => (
            <Link key={item.to} to={item.to}>
              <item.icon size={20} /> {!sidebarCompact && item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          {!sidebarCompact && (
            <>
              <small>{user.name}</small>
              <small>{user.email}</small>
            </>
          )}
          <button onClick={logout} type="button" className="logout-btn"><HiOutlineArrowRightOnRectangle size={18} /> {!sidebarCompact && 'Sign Out'}</button>
          <button onClick={toggleCompact} type="button" className="logout-btn">
            {sidebarCompact ? <HiOutlineChevronDoubleRight size={18} /> : <HiOutlineChevronDoubleLeft size={18} />}
          </button>
        </div>
      </aside>
      <main className="content"><Outlet /></main>
    </div>
  );
}

function AdminDashboard() {
  const qc = useQueryClient();
  const dashboard = useQuery({ queryKey: ['dashboard', 'admin'], queryFn: api.adminDashboard, retry: false });

  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherMsg, setTeacherMsg] = useState<string | null>(null);
  const registerTeacher = useMutation({
    mutationFn: async () => {
      const reg = await api.registerUser({ name: teacherName, email: teacherEmail, role: 'teacher' });
      await api.createTeacher({ teacherName, email: teacherEmail });
      return reg.password;
    },
    onSuccess: (password) => {
      setTeacherMsg(`Teacher created. Password: ${password}`);
      setTeacherName('');
      setTeacherEmail('');
      qc.invalidateQueries({ queryKey: ['teachers'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => {
      setTeacherMsg(err instanceof Error ? err.message : 'Failed to create teacher.');
    },
  });

  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentLevel, setStudentLevel] = useState('Beginner');
  const [studentClassType, setStudentClassType] = useState('Private');
  const [studentMsg, setStudentMsg] = useState<string | null>(null);
  const registerStudent = useMutation({
    mutationFn: async () => {
      const reg = await api.registerUser({ name: studentName, email: studentEmail, role: 'student' });
      await api.createStudent({ studentName, email: studentEmail, level: studentLevel, classType: studentClassType });
      return reg.password;
    },
    onSuccess: (password) => {
      setStudentMsg(`Student created. Password: ${password}`);
      setStudentName('');
      setStudentEmail('');
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => {
      setStudentMsg(err instanceof Error ? err.message : 'Failed to create student.');
    },
  });

  const teachers = useQuery({ queryKey: ['teachers'], queryFn: () => api.teachers(), retry: false });
  const students = useQuery({ queryKey: ['students', 'Active'], queryFn: () => api.students({ status: 'Active' }), retry: false });
  const courses = useQuery({ queryKey: ['courses'], queryFn: api.courses, retry: false });

  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [assignStudentId, setAssignStudentId] = useState('');
  const [assignCourseId, setAssignCourseId] = useState('');
  const [planType, setPlanType] = useState('Private');
  const [assignMsg, setAssignMsg] = useState<string | null>(null);
  const createAssignment = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.createAssignment(body),
    onSuccess: () => {
      setAssignMsg('Assignment created successfully.');
      qc.invalidateQueries({ queryKey: ['assignments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => {
      setAssignMsg(err instanceof Error ? err.message : 'Failed to create assignment.');
    },
  });

  const msgStyle: React.CSSProperties = {
    padding: '8px 14px',
    margin: '8px 18px',
    background: '#f0fdf4',
    color: '#166534',
    border: '1px solid #bbf7d0',
    borderRadius: '7px',
    fontSize: '14px',
  };

  return (
    <Page title="Admin Dashboard" subtitle="Manage teachers, students, assignments, and view operational data.">
      {dashboard.isLoading ? <Skeleton /> : dashboard.data ? (
        <>
          <DashboardGrid data={dashboard.data} />

          <div className="dashboard-grid" style={{ marginTop: '18px' }}>
            <section className="panel">
              <header><h2>Register New Teacher</h2></header>
              {teacherMsg && <div style={msgStyle}>{teacherMsg}</div>}
              <form className="inline-form" onSubmit={(e) => { e.preventDefault(); registerTeacher.mutate(); }}>
                <input value={teacherName} onChange={(e) => setTeacherName(e.target.value)} placeholder="Teacher name" required />
                <input value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)} type="email" placeholder="Email" required />
                <button type="submit" disabled={registerTeacher.isPending || !teacherName || !teacherEmail}>Create Teacher</button>
              </form>
            </section>
            <section className="panel">
              <header><h2>Register New Student</h2></header>
              {studentMsg && <div style={msgStyle}>{studentMsg}</div>}
              <form className="inline-form" onSubmit={(e) => { e.preventDefault(); registerStudent.mutate(); }}>
                <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Student name" required />
                <input value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} type="email" placeholder="Email" required />
                <select value={studentLevel} onChange={(e) => setStudentLevel(e.target.value)}>
                  {['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper Intermediate', 'Advanced'].map((l) => <option key={l}>{l}</option>)}
                </select>
                <select value={studentClassType} onChange={(e) => setStudentClassType(e.target.value)}>
                  {['Private', 'Mini Group', 'Group'].map((t) => <option key={t}>{t}</option>)}
                </select>
                <button type="submit" disabled={registerStudent.isPending || !studentName || !studentEmail}>Create Student</button>
              </form>
            </section>
          </div>

          <section className="panel" style={{ marginTop: '18px' }}>
            <header><h2>Assign Student to Teacher</h2></header>
            {assignMsg && <div style={msgStyle}>{assignMsg}</div>}
            <form className="inline-form" onSubmit={(e) => {
              e.preventDefault();
              if (!assignTeacherId || !assignStudentId || !assignCourseId) return;
              const tn = teachers.data?.find((t) => t.id === assignTeacherId)?.teacherName ?? '';
              const sn = students.data?.find((s) => s.id === assignStudentId)?.studentName ?? '';
              createAssignment.mutate({
                assignmentName: `${planType} - ${tn} / ${sn}`,
                teacherId: assignTeacherId,
                studentId: assignStudentId,
                courseId: assignCourseId,
                days: 'Mon,Wed,Fri',
                startTime: '09:00',
                startDate: new Date().toISOString().slice(0, 10),
                mode: planType,
              });
            }}>
              <select value={assignTeacherId} onChange={(e) => setAssignTeacherId(e.target.value)}>
                <option value="">Select teacher</option>
                {teachers.data?.map((t) => <option key={t.id} value={t.id}>{t.teacherName}</option>)}
              </select>
              <select value={assignStudentId} onChange={(e) => setAssignStudentId(e.target.value)}>
                <option value="">Select student</option>
                {students.data?.map((s) => <option key={s.id} value={s.id}>{s.studentName}</option>)}
              </select>
              <select value={assignCourseId} onChange={(e) => setAssignCourseId(e.target.value)}>
                <option value="">Select course</option>
                {courses.data?.map((c) => <option key={c.id} value={c.id}>{c.courseName}</option>)}
              </select>
              <select value={planType} onChange={(e) => setPlanType(e.target.value)}>
                {['Classroom', 'Online', 'Private', 'Mini Group'].map((p) => <option key={p}>{p}</option>)}
              </select>
              <button type="submit" disabled={createAssignment.isPending || !assignTeacherId || !assignStudentId || !assignCourseId}>Create Assignment</button>
            </form>
          </section>
        </>
      ) : <p>No data available.</p>}
    </Page>
  );
}

function TeacherDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const teacherId = user?.teacherId ?? '';

  const assignments = useQuery({
    queryKey: ['assignments', teacherId],
    queryFn: () => api.assignments({ teacherId, status: 'Active' }),
    retry: false,
  });

  const allStudents = useQuery({
    queryKey: ['students', 'Active'],
    queryFn: () => api.students({ status: 'Active' }),
    retry: false,
  });
  const myStudents = useMemo(
    () => (allStudents.data ?? []).filter((s) => s.assignedTeacherId === teacherId),
    [allStudents.data, teacherId],
  );

  const [reportAssignmentId, setReportAssignmentId] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportLessonTitle, setReportLessonTitle] = useState('');
  const [reportAttendance, setReportAttendance] = useState('Present');
  const [reportNotes, setReportNotes] = useState('');
  const [reportMsg, setReportMsg] = useState<string | null>(null);
  const createSession = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.createSession(body),
    onSuccess: () => {
      setReportMsg('Session report submitted.');
      setReportLessonTitle('');
      setReportNotes('');
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => {
      setReportMsg(err instanceof Error ? err.message : 'Failed to submit session.');
    },
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const changePassword = useMutation({
    mutationFn: () => api.changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      setPwMsg('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
    },
    onError: (err) => {
      setPwMsg(err instanceof Error ? err.message : 'Password change failed.');
    },
  });

  const msgStyle: React.CSSProperties = {
    padding: '8px 14px',
    margin: '8px 18px',
    background: '#f0fdf4',
    color: '#166534',
    border: '1px solid #bbf7d0',
    borderRadius: '7px',
    fontSize: '14px',
  };

  return (
    <Page title="Teacher Dashboard" subtitle={`Welcome, ${user?.name ?? 'Teacher'}.`}>
      <div className="dashboard-grid">
        <section className="panel">
          <header><h2>My Schedule</h2></header>
          {assignments.data ? <AssignmentList rows={assignments.data} /> : <Skeleton />}
        </section>
        <section className="panel">
          <header><h2>My Students</h2></header>
          {allStudents.data ? (
            myStudents.length > 0 ? <StudentList rows={myStudents} linked /> : <p>No students assigned.</p>
          ) : <Skeleton />}
        </section>
      </div>
      <div className="dashboard-grid" style={{ marginTop: '18px' }}>
        <section className="panel">
          <header><h2>Submit Session Report</h2></header>
          {reportMsg && <div style={msgStyle}>{reportMsg}</div>}
          <form className="inline-form" onSubmit={(e) => {
            e.preventDefault();
            const selected = assignments.data?.find((a) => a.id === reportAssignmentId);
            if (!selected) return;
            createSession.mutate({
              sessionName: `${selected.assignmentName} - ${reportLessonTitle || 'Lesson'}`,
              sessionDate: reportDate,
              teacherId,
              studentId: selected.studentId,
              assignmentId: reportAssignmentId,
              lessonNumber: 1,
              lessonTitle: reportLessonTitle,
              attendance: reportAttendance,
              present: reportAttendance === 'Present',
              absent: reportAttendance === 'Absent',
              late: reportAttendance === 'Late',
              cancelled: reportAttendance === 'Cancelled',
              durationMinutes: 60,
              teacherNotes: reportNotes,
              homeworkSubmitted: false,
            });
          }}>
            <select value={reportAssignmentId} onChange={(e) => setReportAssignmentId(e.target.value)} required>
              <option value="">Select assignment</option>
              {assignments.data?.map((a) => <option key={a.id} value={a.id}>{a.assignmentName}</option>)}
            </select>
            <input value={reportDate} onChange={(e) => setReportDate(e.target.value)} type="date" required />
            <input value={reportLessonTitle} onChange={(e) => setReportLessonTitle(e.target.value)} placeholder="Lesson title" required />
            <select value={reportAttendance} onChange={(e) => setReportAttendance(e.target.value)}>
              {['Present', 'Absent', 'Late', 'Cancelled'].map((a) => <option key={a}>{a}</option>)}
            </select>
            <textarea value={reportNotes} onChange={(e) => setReportNotes(e.target.value)} placeholder="Notes (optional)" rows={4} />
            <button type="submit" disabled={createSession.isPending || !reportAssignmentId}>Submit</button>
          </form>
        </section>
        <section className="panel">
          <header><h2>Change Password</h2></header>
          {pwMsg && <div style={msgStyle}>{pwMsg}</div>}
          <form className="inline-form" onSubmit={(e) => { e.preventDefault(); changePassword.mutate(); }}>
            <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" placeholder="Current password" required />
            <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="New password" required />
            <button type="submit" disabled={changePassword.isPending}>Change Password</button>
          </form>
        </section>
      </div>
    </Page>
  );
}

function StudentPage() {
  const { studentId } = useParams({ from: '/protected/students/$studentId' });

  const data = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => api.studentPage(studentId),
    retry: false,
  });

  const assignments = useQuery({
    queryKey: ['assignments', 'student', studentId],
    queryFn: () => api.assignments({ studentId }),
    retry: false,
  });

  const sessions = useQuery({
    queryKey: ['sessions', 'student', studentId],
    queryFn: () => api.sessions({ studentId }),
    retry: false,
  });

  const homework = useQuery({
    queryKey: ['homework', 'student', studentId],
    queryFn: () => api.homework({ studentId }),
    retry: false,
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const changePassword = useMutation({
    mutationFn: () => api.changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      setPwMsg('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
    },
    onError: (err) => {
      setPwMsg(err instanceof Error ? err.message : 'Password change failed.');
    },
  });

  const studentInfo = data.data?.student;

  const msgStyle: React.CSSProperties = {
    padding: '8px 14px',
    margin: '8px 18px',
    background: '#f0fdf4',
    color: '#166534',
    border: '1px solid #bbf7d0',
    borderRadius: '7px',
    fontSize: '14px',
  };

  return (
    <Page title={studentInfo?.studentName ?? 'Student'} subtitle={`Level: ${studentInfo?.level ?? '...'}`}>
      {data.data ? (
        <>
          <div className="dashboard-grid">
            <section className="panel">
              <header><h2>My Teacher</h2></header>
              <div style={{ padding: '16px 18px' }}>
                <p>{data.data.teacher?.teacherName ?? 'No teacher assigned.'}</p>
                {data.data.teacher?.email && <small>{data.data.teacher.email}</small>}
              </div>
            </section>
            <section className="panel">
              <header><h2>My Schedule</h2></header>
              {assignments.data ? <AssignmentList rows={assignments.data} /> : <Skeleton />}
            </section>
          </div>
          <div className="dashboard-grid" style={{ marginTop: '18px' }}>
            <section className="panel">
              <header><h2>Lesson History</h2></header>
              {sessions.data ? <SessionList rows={sessions.data} /> : <Skeleton />}
            </section>
            <section className="panel">
              <header><h2>Homework</h2></header>
              {homework.data ? <HomeworkList rows={homework.data} /> : <Skeleton />}
            </section>
          </div>
          <section className="panel" style={{ marginTop: '18px' }}>
            <header><h2>Change Password</h2></header>
            {pwMsg && <div style={msgStyle}>{pwMsg}</div>}
            <form className="inline-form" onSubmit={(e) => { e.preventDefault(); changePassword.mutate(); }}>
              <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" placeholder="Current password" required />
              <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="New password" required />
              <button type="submit" disabled={changePassword.isPending}>Change Password</button>
            </form>
          </section>
        </>
      ) : <Skeleton />}
    </Page>
  );
}

function StudentsPage() {
  const [status, setStatus] = useState('Active');
  const students = useQuery({ queryKey: ['students', status], queryFn: () => api.students({ status }), retry: false });
  return (
    <Page title="Students" subtitle="Filtered student views.">
      <div className="toolbar">{['Active', 'Paused', 'Completed'].map((s) => <button className={status === s ? 'active' : ''} key={s} type="button" onClick={() => setStatus(s)}>{s}</button>)}</div>
      {students.data ? <StudentList rows={students.data} linked /> : <Skeleton />}
    </Page>
  );
}

function CoursesPage() {
  const qc = useQueryClient();
  const courses = useQuery({ queryKey: ['courses'], queryFn: api.courses, retry: false });
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [units, setUnits] = useState('8');
  const [lessons, setLessons] = useState('32');
  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.createCourse(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); setShowForm(false); },
  });
  return (
    <Page title="Courses" subtitle="Manage courses, levels, and lesson counts.">
      <div className="toolbar">
        <button type="button" className="action-btn" onClick={() => setShowForm(!showForm)}>+ New Course</button>
      </div>
      {showForm && (
        <form className="inline-form" onSubmit={(e) => { e.preventDefault(); create.mutate({ courseName: name, level, totalUnits: Number(units), totalLessons: Number(lessons) }); }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Course name" required />
          <select value={level} onChange={(e) => setLevel(e.target.value)}>{['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper Intermediate', 'Advanced'].map((l) => <option key={l}>{l}</option>)}</select>
          <input value={units} onChange={(e) => setUnits(e.target.value)} placeholder="Units" type="number" required />
          <input value={lessons} onChange={(e) => setLessons(e.target.value)} placeholder="Lessons" type="number" required />
          <button type="submit" disabled={create.isPending}>Save</button>
        </form>
      )}
      {courses.data ? <CourseList rows={courses.data} /> : <Skeleton />}
    </Page>
  );
}

function AssignmentsPage() {
  const qc = useQueryClient();
  const assignments = useQuery({ queryKey: ['assignments'], queryFn: () => api.assignments({ status: 'Active' }), retry: false });
  const teachers = useQuery({ queryKey: ['teachers'], queryFn: () => api.teachers(), retry: false });
  const students = useQuery({ queryKey: ['students'], queryFn: () => api.students(), retry: false });
  const courses = useQuery({ queryKey: ['courses'], queryFn: api.courses, retry: false });
  const [showForm, setShowForm] = useState(false);
  const [fields, setFields] = useState({ assignmentName: '', teacherId: '', studentId: '', courseId: '', days: 'Mon,Wed,Fri', startTime: '09:00', startDate: new Date().toISOString().slice(0, 10), mode: 'Online' });
  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.createAssignment(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assignments'] }); setShowForm(false); },
  });
  return (
    <Page title="Class Assignments" subtitle="Active classes, grouped by teacher and student.">
      <div className="toolbar">
        <button type="button" className="action-btn" onClick={() => setShowForm(!showForm)}>+ New Assignment</button>
      </div>
      {showForm && (
        <form className="inline-form" onSubmit={(e) => { e.preventDefault(); create.mutate(fields); }}>
          <input value={fields.assignmentName} onChange={(e) => setFields({ ...fields, assignmentName: e.target.value })} placeholder="Assignment name" required />
          <select value={fields.teacherId} onChange={(e) => setFields({ ...fields, teacherId: e.target.value })} required>
            <option value="">Select teacher</option>
            {teachers.data?.map((t) => <option key={t.id} value={t.id}>{t.teacherName}</option>)}
          </select>
          <select value={fields.studentId} onChange={(e) => setFields({ ...fields, studentId: e.target.value })} required>
            <option value="">Select student</option>
            {students.data?.map((s) => <option key={s.id} value={s.id}>{s.studentName}</option>)}
          </select>
          <select value={fields.courseId} onChange={(e) => setFields({ ...fields, courseId: e.target.value })} required>
            <option value="">Select course</option>
            {courses.data?.map((c) => <option key={c.id} value={c.id}>{c.courseName}</option>)}
          </select>
          <select value={fields.mode} onChange={(e) => setFields({ ...fields, mode: e.target.value })} required>
            {['Classroom', 'Online', 'Private', 'Mini Group'].map((m) => <option key={m}>{m}</option>)}
          </select>
          <input value={fields.days} onChange={(e) => setFields({ ...fields, days: e.target.value })} placeholder="Days (Mon,Wed,Fri)" required />
          <input value={fields.startTime} onChange={(e) => setFields({ ...fields, startTime: e.target.value })} type="time" required />
          <input value={fields.startDate} onChange={(e) => setFields({ ...fields, startDate: e.target.value })} type="date" required />
          <button type="submit" disabled={create.isPending || !fields.teacherId || !fields.studentId || !fields.courseId}>Save</button>
        </form>
      )}
      {assignments.data ? <AssignmentList rows={assignments.data} /> : <Skeleton />}
    </Page>
  );
}

function SessionsPage() {
  const qc = useQueryClient();
  const [view, setView] = useState<'today' | 'this-week' | 'calendar'>('today');
  const sessions = useQuery({ queryKey: ['sessions', view], queryFn: () => api.sessions({ view }), retry: false });
  const [showForm, setShowForm] = useState(false);
  const [fields, setFields] = useState({ sessionName: 'New Session', sessionDate: new Date().toISOString().slice(0, 10), teacherId: 'teacher-1', studentId: 'student-1', assignmentId: 'assignment-1', lessonNumber: 1, lessonTitle: 'Lesson', attendance: 'Present', durationMinutes: 60 });
  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.createSession(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sessions'] }); setShowForm(false); },
  });
  return (
    <Page title="Class Sessions" subtitle="One completed lesson per record.">
      <div className="toolbar">
        {(['today', 'this-week', 'calendar'] as const).map((v) => <button className={view === v ? 'active' : ''} key={v} type="button" onClick={() => setView(v)}>{v}</button>)}
        <button type="button" className="action-btn" onClick={() => setShowForm(!showForm)}>+ New Session</button>
      </div>
      {showForm && (
        <form className="inline-form" onSubmit={(e) => { e.preventDefault(); create.mutate(fields); }}>
          <input value={fields.sessionName} onChange={(e) => setFields({ ...fields, sessionName: e.target.value })} placeholder="Session name" required />
          <input value={fields.lessonTitle} onChange={(e) => setFields({ ...fields, lessonTitle: e.target.value })} placeholder="Lesson title" required />
          <input value={fields.sessionDate} onChange={(e) => setFields({ ...fields, sessionDate: e.target.value })} type="date" required />
          <select value={fields.attendance} onChange={(e) => setFields({ ...fields, attendance: e.target.value })}>
            {['Present', 'Absent', 'Late', 'Cancelled'].map((a) => <option key={a}>{a}</option>)}
          </select>
          <button type="submit" disabled={create.isPending}>Save</button>
        </form>
      )}
      {view === 'calendar' ? <CalendarView rows={sessions.data ?? []} /> : sessions.data ? <SessionList rows={sessions.data} /> : <Skeleton />}
    </Page>
  );
}

function HomeworkPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<'pending' | 'completed'>('pending');
  const homework = useQuery({ queryKey: ['homework', status], queryFn: () => api.homework({ status }), retry: false });
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState('Practice vocabulary');
  const dueDate = new Date().toISOString().slice(0, 10);
  const studentId = 'student-1';
  const teacherId = 'teacher-1';
  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.createHomework(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['homework'] }); setShowForm(false); },
  });
  return (
    <Page title="Homework" subtitle="Pending and completed with score and feedback.">
      <div className="toolbar">
        <button className={status === 'pending' ? 'active' : ''} type="button" onClick={() => setStatus('pending')}>Pending</button>
        <button className={status === 'completed' ? 'active' : ''} type="button" onClick={() => setStatus('completed')}>Completed</button>
        <button type="button" className="action-btn" onClick={() => setShowForm(!showForm)}>+ New Homework</button>
      </div>
      {showForm && (
        <form className="inline-form" onSubmit={(e) => { e.preventDefault(); create.mutate({ homework: text, studentId, teacherId, dueDate }); }}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Homework description" required />
          <button type="submit" disabled={create.isPending}>Save</button>
        </form>
      )}
      {homework.data ? <HomeworkList rows={homework.data} /> : <Skeleton />}
    </Page>
  );
}

function ReportsPage() {
  const dashboard = useQuery({ queryKey: ['dashboard', 'admin'], queryFn: api.adminDashboard, retry: false });
  const reports = dashboard.data?.reports;
  const allSessions = useQuery({ queryKey: ['sessions', 'all'], queryFn: () => api.sessions(), retry: false });
  const teachers = useQuery({ queryKey: ['teachers', 'all'], queryFn: () => api.teachers(), retry: false });
  const students = useQuery({ queryKey: ['students', 'all'], queryFn: () => api.students(), retry: false });

  const teacherMap = useMemo(
    () => new Map((teachers.data ?? []).map((t) => [t.id, t.teacherName])),
    [teachers.data],
  );
  const studentMap = useMemo(
    () => new Map((students.data ?? []).map((s) => [s.id, s.studentName])),
    [students.data],
  );

  const recentSessions = useMemo(
    () => (allSessions.data ?? []).slice().sort((a, b) => b.sessionDate.localeCompare(a.sessionDate)),
    [allSessions.data],
  );

  const sessionColumns = useMemo(() => [
    { label: 'Date', render: (r: Session) => r.sessionDate },
    { label: 'Teacher', render: (r: Session) => teacherMap.get(r.teacherId) ?? r.teacherId },
    { label: 'Student', render: (r: Session) => studentMap.get(r.studentId) ?? r.studentId },
    { label: 'Lesson', render: (r: Session) => r.lessonTitle },
    { label: 'Attendance', render: (r: Session) => <Badge>{r.attendance}</Badge> },
    { label: 'Notes', render: (r: Session) => r.teacherNotes || '-' },
    { label: 'Homework', render: (r: Session) => r.homeworkSubmitted ? <Badge>Yes</Badge> : <Badge>No</Badge> },
  ], [teacherMap, studentMap]);

  return (
    <Page title="Reports" subtitle="Computed views for attendance risk, missing reports, schedule drift, and active accounts.">
      {reports ? (
        <>
          <div className="dashboard-grid">
            <Panel title="Students with Low Attendance">{reports.studentsWithLowAttendance.length > 0 ? <StudentList rows={reports.studentsWithLowAttendance} /> : <p>None.</p>}</Panel>
            <Panel title="Teachers with Missing Lesson Reports">{reports.teachersMissingLessonReports.length > 0 ? <TeacherList rows={reports.teachersMissingLessonReports} /> : <p>None.</p>}</Panel>
            <Panel title="Students Behind Schedule">{reports.studentsBehindSchedule.length > 0 ? <StudentList rows={reports.studentsBehindSchedule} /> : <p>None.</p>}</Panel>
          </div>
          <div className="dashboard-grid" style={{ marginTop: '18px' }}>
            <section className="panel">
              <header><h2>Submitted Session Reports</h2></header>
              {recentSessions.length > 0 ? <Table rows={recentSessions} columns={sessionColumns} /> : <p>None.</p>}
            </section>
          </div>
        </>
      ) : <Skeleton />}
    </Page>
  );
}

const rootRoute = createRootRoute({ component: RootLayout });
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: LoginRoute });

function LoginRoute() {
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (user) {
      router.navigate({ to: roleRedirect(user) });
    }
  }, [user, router]);
  if (user) return null;
  return <LoginPage />;
}

const protectedRoute = createRoute({ getParentRoute: () => rootRoute, id: 'protected', component: ProtectedLayout });
const indexRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/', component: AdminDashboard });
const teacherRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/teacher', component: TeacherDashboard });
const studentsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/students', component: StudentsPage });
const studentRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/students/$studentId', component: StudentPage });
const coursesRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/courses', component: CoursesPage });
const assignmentsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/assignments', component: AssignmentsPage });
const sessionsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/sessions', component: SessionsPage });
const homeworkRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/homework', component: HomeworkPage });
const reportsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/reports', component: ReportsPage });

const routeTree = rootRoute.addChildren([loginRoute, protectedRoute.addChildren([indexRoute, teacherRoute, studentsRoute, studentRoute, coursesRoute, assignmentsRoute, sessionsRoute, homeworkRoute, reportsRoute])]);
const router = createRouter({ routeTree });

declare module '@tanstack/react-router' { interface Register { router: typeof router; } }

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
