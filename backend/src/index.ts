import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { sign } from 'hono/jwt';
import { HTTPException } from 'hono/http-exception';
import process from 'node:process';
import {
  Assignment, AuthUser, Course, CreateAssignment, CreateCourse, CreateHomework,
  CreateSession, CreateStudent, CreateTeacher, DashboardData, Homework, Progress,
  Session, Student, Teacher, TeacherPerformance, UpdateAssignment, UpdateCourse,
  UpdateHomework, UpdateProgress, UpdateSession, UpdateStudent, UpdateTeacher,
} from './domain/contracts.js';
import { repository as mem } from './repositories/memory.js';
import { drizzleRepository as db } from './repositories/drizzle.js';

const USE_DB = Boolean(process.env.DATABASE_URL);
const repo = USE_DB ? db : mem;

const app = new OpenAPIHono();
app.use('*', cors());

const ErrorResponse = z.object({ message: z.string() });
const IdParam = z.object({ id: z.string() });
const JWT_SECRET = process.env.JWT_SECRET ?? 'speak-to-reach-dev-secret';

function getUserId(c: { req: { header: (name: string) => string | undefined } }): string | undefined {
  const auth = c.req.header('authorization');
  if (!auth?.startsWith('Bearer ')) return undefined;
  try {
    const payload = JSON.parse(atob(auth.slice(7).split('.')[1]!));
    return payload.sub as string;
  } catch { return undefined; }
}

const ok = <T extends z.ZodType>(schema: T) => ({
  200: { content: { 'application/json': { schema } }, description: 'OK' },
} as const);
const created = <T extends z.ZodType>(schema: T) => ({
  201: { content: { 'application/json': { schema } }, description: 'Created' },
} as const);

// ── Auth ──────────────────────────────────────────────────────────────────────

app.openapi(
  createRoute({
    method: 'post', path: '/api/auth/login',
    request: { body: { content: { 'application/json': { schema: z.object({ email: z.string().email(), password: z.string() }) } } } },
    responses: { 200: { content: { 'application/json': { schema: z.object({ token: z.string(), user: AuthUser }) } }, description: 'OK' } },
  }),
  async (c) => {
    const { email, password } = c.req.valid('json');
    const user = repo.users.find((u) => u.email === email);
    if (!user || user.password !== password) throw new HTTPException(401, { message: 'Invalid email or password' });
    const token = await sign({ sub: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + 86400 * 7 }, JWT_SECRET);
    const { password: _pw, ...safeUser } = user;
    return c.json({ token, user: safeUser }, 200);
  },
);

app.openapi(
  createRoute({ method: 'get', path: '/api/auth/me', responses: { 200: { content: { 'application/json': { schema: AuthUser } }, description: 'OK' } } }),
  async (c) => {
    const userId = getUserId(c);
    const user = repo.users.find((u) => u.id === userId);
    if (!user) throw new HTTPException(401, { message: 'Unauthorized' });
    const { password: _pw, ...safeUser } = user;
    return c.json(safeUser, 200);
  },
);

function genPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let pw = '';
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

app.openapi(
  createRoute({
    method: 'post', path: '/api/auth/register',
    request: { body: { content: { 'application/json': { schema: z.object({ name: z.string(), email: z.string().email(), role: z.enum(['teacher', 'student']), teacherId: z.string().optional(), studentId: z.string().optional() }) } } } },
    responses: { 201: { content: { 'application/json': { schema: z.object({ id: z.string(), email: z.string(), password: z.string(), role: z.string() }) } }, description: 'Created' }, 401: { content: { 'application/json': { schema: z.object({ message: z.string() }) } }, description: 'Unauthorized' } },
  }),
  async (c) => {
    const userId = getUserId(c);
    const caller = repo.users.find((u) => u.id === userId);
    if (!caller || caller.role !== 'admin') throw new HTTPException(401, { message: 'Only admin can register users' });
    const body = c.req.valid('json');
    const password = genPassword();
    const newUser = { id: `user-${body.role}-${Math.random().toString(36).slice(2, 7)}`, name: body.name, email: body.email, password, role: body.role, teacherId: body.teacherId, studentId: body.studentId };
    repo.users.push(newUser);
    return c.json({ id: newUser.id, email: newUser.email, password, role: newUser.role }, 201);
  },
);

app.openapi(
  createRoute({
    method: 'patch', path: '/api/auth/password',
    request: { body: { content: { 'application/json': { schema: z.object({ currentPassword: z.string(), newPassword: z.string().min(6) }) } } } },
    responses: { 200: { content: { 'application/json': { schema: z.object({ message: z.string() }) } }, description: 'OK' }, 401: { content: { 'application/json': { schema: z.object({ message: z.string() }) } }, description: 'Unauthorized' } },
  }),
  async (c) => {
    const userId = getUserId(c);
    const user = repo.users.find((u) => u.id === userId);
    if (!user) throw new HTTPException(401, { message: 'Unauthorized' });
    const { currentPassword, newPassword } = c.req.valid('json');
    if (user.password !== currentPassword) throw new HTTPException(401, { message: 'Current password is incorrect' });
    user.password = newPassword;
    return c.json({ message: 'Password updated' }, 200);
  },
);

// ── Teachers ──────────────────────────────────────────────────────────────────

app.openapi(
  createRoute({ method: 'get', path: '/api/teachers', request: { query: z.object({ status: z.enum(['active', 'inactive']).optional() }) }, responses: ok(z.array(Teacher)) }),
  async (c) => {
    const q = c.req.valid('query');
    const rows = USE_DB ? await (repo as typeof db).listTeachers(q.status) : (repo as typeof mem).teachers.filter((t) => !q.status || t.status === q.status);
    return c.json(rows);
  },
);
app.openapi(
  createRoute({ method: 'post', path: '/api/teachers', request: { body: { content: { 'application/json': { schema: CreateTeacher } } } }, responses: created(Teacher) }),
  async (c) => {
    const created = USE_DB ? await (repo as typeof db).createTeacher(c.req.valid('json') as Record<string, unknown>) : (repo as typeof mem).create((repo as typeof mem).teachers, { status: 'active', ...c.req.valid('json') } as any);
    return c.json(created, 201);
  },
);
app.openapi(
  createRoute({
    method: 'patch', path: '/api/teachers/{id}',
    request: { params: IdParam, body: { content: { 'application/json': { schema: UpdateTeacher } } } },
    responses: { 200: { content: { 'application/json': { schema: Teacher } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const updated = USE_DB ? await (repo as typeof db).updateTeacher(id, c.req.valid('json') as Record<string, unknown>) : (repo as typeof mem).update((repo as typeof mem).teachers, id, c.req.valid('json'));
    if (!updated) throw new HTTPException(404, { message: 'Teacher not found' });
    return c.json(updated, 200);
  },
);

// ── Students ──────────────────────────────────────────────────────────────────

app.openapi(
  createRoute({
    method: 'get', path: '/api/students',
    request: { query: z.object({ status: z.enum(['Active', 'Paused', 'Completed']).optional(), classType: z.enum(['Private', 'Mini Group']).optional(), level: z.enum(['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper Intermediate', 'Advanced']).optional() }) },
    responses: ok(z.array(Student)),
  }),
  async (c) => {
    const q = c.req.valid('query');
    const rows = USE_DB ? await (repo as typeof db).listStudents({ status: q.status, classType: q.classType, level: q.level }) : (repo as typeof mem).students.filter((s) => (!q.status || s.status === q.status) && (!q.classType || s.classType === q.classType) && (!q.level || s.level === q.level));
    return c.json(rows);
  },
);
app.openapi(
  createRoute({ method: 'post', path: '/api/students', request: { body: { content: { 'application/json': { schema: CreateStudent } } } }, responses: created(Student) }),
  async (c) => {
    const created = USE_DB ? await (repo as typeof db).createStudent(c.req.valid('json') as Record<string, unknown>) : (repo as typeof mem).create((repo as typeof mem).students, { status: 'Active', ...c.req.valid('json') } as any);
    return c.json(created, 201);
  },
);
app.openapi(
  createRoute({
    method: 'patch', path: '/api/students/{id}',
    request: { params: IdParam, body: { content: { 'application/json': { schema: UpdateStudent } } } },
    responses: { 200: { content: { 'application/json': { schema: Student } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const updated = USE_DB ? await (repo as typeof db).updateStudent(id, c.req.valid('json') as Record<string, unknown>) : (repo as typeof mem).update((repo as typeof mem).students, id, c.req.valid('json'));
    if (!updated) throw new HTTPException(404, { message: 'Student not found' });
    return c.json(updated, 200);
  },
);

// ── Courses ───────────────────────────────────────────────────────────────────

app.openapi(createRoute({ method: 'get', path: '/api/courses', responses: ok(z.array(Course)) }), async (c) => {
  const rows = USE_DB ? await (repo as typeof db).listCourses() : (repo as typeof mem).courses;
  return c.json(rows);
});
app.openapi(
  createRoute({ method: 'post', path: '/api/courses', request: { body: { content: { 'application/json': { schema: CreateCourse } } } }, responses: created(Course) }),
  async (c) => {
    const created = USE_DB ? await (repo as typeof db).createCourse(c.req.valid('json') as Record<string, unknown>) : (repo as typeof mem).create((repo as typeof mem).courses, c.req.valid('json') as any);
    return c.json(created, 201);
  },
);
app.openapi(
  createRoute({
    method: 'patch', path: '/api/courses/{id}',
    request: { params: IdParam, body: { content: { 'application/json': { schema: UpdateCourse } } } },
    responses: { 200: { content: { 'application/json': { schema: Course } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const updated = USE_DB ? await (repo as typeof db).updateCourse(id, c.req.valid('json') as Record<string, unknown>) : (repo as typeof mem).update((repo as typeof mem).courses, id, c.req.valid('json'));
    if (!updated) throw new HTTPException(404, { message: 'Course not found' });
    return c.json(updated, 200);
  },
);

// ── Assignments ───────────────────────────────────────────────────────────────

app.openapi(
  createRoute({
    method: 'get', path: '/api/assignments',
    request: { query: z.object({ status: z.enum(['Active', 'Upcoming', 'Ended', 'Cancelled']).optional(), teacherId: z.string().optional(), studentId: z.string().optional() }) },
    responses: ok(z.array(Assignment)),
  }),
  async (c) => {
    const q = c.req.valid('query');
    const rows = USE_DB ? await (repo as typeof db).listAssignments({ status: q.status, teacherId: q.teacherId, studentId: q.studentId }) : (repo as typeof mem).assignments.filter((a) => (!q.status || a.status === q.status) && (!q.teacherId || a.teacherId === q.teacherId) && (!q.studentId || a.studentId === q.studentId));
    return c.json(rows);
  },
);
app.openapi(
  createRoute({ method: 'post', path: '/api/assignments', request: { body: { content: { 'application/json': { schema: CreateAssignment } } } }, responses: created(Assignment) }),
  async (c) => {
    const created = USE_DB ? await (repo as typeof db).createAssignment(c.req.valid('json') as Record<string, unknown>) : (repo as typeof mem).create((repo as typeof mem).assignments, { status: 'Active', ...c.req.valid('json') } as any);
    return c.json(created, 201);
  },
);
app.openapi(
  createRoute({
    method: 'patch', path: '/api/assignments/{id}',
    request: { params: IdParam, body: { content: { 'application/json': { schema: UpdateAssignment } } } },
    responses: { 200: { content: { 'application/json': { schema: Assignment } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const updated = USE_DB ? await (repo as typeof db).updateAssignment(id, c.req.valid('json') as Record<string, unknown>) : (repo as typeof mem).update((repo as typeof mem).assignments, id, c.req.valid('json'));
    if (!updated) throw new HTTPException(404, { message: 'Assignment not found' });
    return c.json(updated, 200);
  },
);
app.openapi(
  createRoute({
    method: 'post', path: '/api/assignments/{id}/end', request: { params: IdParam },
    responses: { 200: { content: { 'application/json': { schema: Assignment } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const updated = USE_DB ? await (repo as typeof db).endAssignment(id) : (repo as typeof mem).endAssignment(id);
    if (!updated) throw new HTTPException(404, { message: 'Assignment not found' });
    return c.json(updated, 200);
  },
);

// ── Sessions ──────────────────────────────────────────────────────────────────

app.openapi(
  createRoute({
    method: 'get', path: '/api/sessions',
    request: { query: z.object({ view: z.enum(['today', 'this-week', 'calendar']).optional(), teacherId: z.string().optional(), studentId: z.string().optional() }) },
    responses: ok(z.array(Session)),
  }),
  async (c) => {
    const q = c.req.valid('query');
    const rows = USE_DB ? await (repo as typeof db).listSessions({ view: q.view, teacherId: q.teacherId, studentId: q.studentId }) : (() => {
      const today = new Date().toISOString().slice(0, 10);
      return (repo as typeof mem).sessions.filter((s) => (!q.teacherId || s.teacherId === q.teacherId) && (!q.studentId || s.studentId === q.studentId) && (q.view !== 'today' || s.sessionDate === today));
    })();
    return c.json(rows);
  },
);
app.openapi(
  createRoute({ method: 'post', path: '/api/sessions', request: { body: { content: { 'application/json': { schema: CreateSession } } } }, responses: created(Session) }),
  async (c) => {
    const body = c.req.valid('json');
    const created = USE_DB ? await (repo as typeof db).createSession({ ...body, present: body.attendance === 'Present', absent: body.attendance === 'Absent', late: body.attendance === 'Late', cancelled: body.attendance === 'Cancelled', homeworkSubmitted: false } as Record<string, unknown>) : (repo as typeof mem).create((repo as typeof mem).sessions, {
      ...body, present: body.attendance === 'Present', absent: body.attendance === 'Absent',
      late: body.attendance === 'Late', cancelled: body.attendance === 'Cancelled', homeworkSubmitted: false,
    } as any);
    return c.json(created, 201);
  },
);
app.openapi(
  createRoute({
    method: 'patch', path: '/api/sessions/{id}',
    request: { params: IdParam, body: { content: { 'application/json': { schema: UpdateSession } } } },
    responses: { 200: { content: { 'application/json': { schema: Session } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const updated = USE_DB ? await (repo as typeof db).updateSession(id, c.req.valid('json') as Record<string, unknown>) : (repo as typeof mem).update((repo as typeof mem).sessions, id, c.req.valid('json'));
    if (!updated) throw new HTTPException(404, { message: 'Session not found' });
    return c.json(updated, 200);
  },
);

// ── Homework ──────────────────────────────────────────────────────────────────

app.openapi(
  createRoute({
    method: 'get', path: '/api/homework',
    request: { query: z.object({ status: z.enum(['pending', 'completed']).optional(), teacherId: z.string().optional(), studentId: z.string().optional() }) },
    responses: ok(z.array(Homework)),
  }),
  async (c) => {
    const q = c.req.valid('query');
    const rows = USE_DB ? await (repo as typeof db).listHomework({ status: q.status, teacherId: q.teacherId, studentId: q.studentId }) : (repo as typeof mem).homework.filter((h) => (!q.teacherId || h.teacherId === q.teacherId) && (!q.studentId || h.studentId === q.studentId) && (q.status !== 'pending' || !h.submitted) && (q.status !== 'completed' || h.submitted));
    return c.json(rows);
  },
);
app.openapi(
  createRoute({ method: 'post', path: '/api/homework', request: { body: { content: { 'application/json': { schema: CreateHomework } } } }, responses: created(Homework) }),
  async (c) => {
    const created = USE_DB ? await (repo as typeof db).createHomework({ submitted: false, ...c.req.valid('json') } as Record<string, unknown>) : (repo as typeof mem).create((repo as typeof mem).homework, { submitted: false, ...c.req.valid('json') } as any);
    return c.json(created, 201);
  },
);
app.openapi(
  createRoute({
    method: 'patch', path: '/api/homework/{id}',
    request: { params: IdParam, body: { content: { 'application/json': { schema: UpdateHomework } } } },
    responses: { 200: { content: { 'application/json': { schema: Homework } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const updated = USE_DB ? await (repo as typeof db).updateHomework(id, c.req.valid('json') as Record<string, unknown>) : (repo as typeof mem).update((repo as typeof mem).homework, id, c.req.valid('json'));
    if (!updated) throw new HTTPException(404, { message: 'Homework not found' });
    return c.json(updated, 200);
  },
);

// ── Progress ──────────────────────────────────────────────────────────────────

app.openapi(createRoute({ method: 'get', path: '/api/progress', responses: ok(z.array(Progress)) }), async (c) => {
  const rows = USE_DB ? await (repo as typeof db).listProgress() : (repo as typeof mem).progress;
  return c.json(rows);
});
app.openapi(
  createRoute({
    method: 'patch', path: '/api/progress/{id}',
    request: { params: IdParam, body: { content: { 'application/json': { schema: UpdateProgress } } } },
    responses: { 200: { content: { 'application/json': { schema: Progress } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const updated = USE_DB ? await (repo as typeof db).updateProgress(id, c.req.valid('json') as Record<string, unknown>) : (repo as typeof mem).update((repo as typeof mem).progress, id, c.req.valid('json'));
    if (!updated) throw new HTTPException(404, { message: 'Progress not found' });
    return c.json(updated, 200);
  },
);

// ── Performance ───────────────────────────────────────────────────────────────

app.openapi(createRoute({ method: 'get', path: '/api/performance/teachers', responses: ok(z.array(TeacherPerformance)) }), async (c) => {
  const rows = USE_DB ? await (repo as typeof db).performance() : (repo as typeof mem).performance();
  return c.json(rows);
});
app.openapi(createRoute({ method: 'get', path: '/api/performance/teachers/{id}', request: { params: IdParam }, responses: ok(z.array(TeacherPerformance)) }), async (c) => {
  const rows = USE_DB ? await (repo as typeof db).performance(c.req.valid('param').id) : (repo as typeof mem).performance(c.req.valid('param').id);
  return c.json(rows);
});

// ── Reports ───────────────────────────────────────────────────────────────────

const StudentPageData = z.object({ student: Student, teacher: Teacher.optional(), course: Course.optional(), attendanceHistory: z.array(Session), lessonHistory: z.array(Session), homework: z.array(Homework), progress: Progress.optional(), teacherNotes: z.array(z.string()) });

app.openapi(createRoute({ method: 'get', path: '/api/reports/admin', responses: ok(DashboardData) }), async (c) => {
  const data = USE_DB ? await (repo as typeof db).dashboard() : (repo as typeof mem).dashboard();
  return c.json(data);
});
app.openapi(createRoute({ method: 'get', path: '/api/reports/teachers/{id}', request: { params: IdParam }, responses: ok(DashboardData) }), async (c) => {
  const data = USE_DB ? await (repo as typeof db).dashboard(c.req.valid('param').id) : (repo as typeof mem).dashboard(c.req.valid('param').id);
  return c.json(data);
});
app.openapi(
  createRoute({
    method: 'get', path: '/api/reports/students/{id}', request: { params: IdParam },
    responses: { 200: { content: { 'application/json': { schema: StudentPageData } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
  }),
  async (c) => {
    const studentId = c.req.valid('param').id;
    if (USE_DB) {
      const dbRepo = repo as typeof db;
      const allStudents = await dbRepo.listStudents();
      const student = allStudents.find((s) => s.id === studentId);
      if (!student) throw new HTTPException(404, { message: 'Student not found' });
      const [allTeachers, allCourses, allSessions, allHomework, allProgress] = await Promise.all([
        dbRepo.listTeachers(), dbRepo.listCourses(), dbRepo.listSessions({ studentId }),
        dbRepo.listHomework({ studentId }), dbRepo.listProgress(),
      ]);
      const lessonHistory = allSessions;
      const progress = allProgress.find((p) => p.studentId === studentId);
      return c.json({
        student, teacher: allTeachers.find((t) => t.id === student.assignedTeacherId),
        course: allCourses.find((c) => c.id === student.assignedCourseId), attendanceHistory: lessonHistory, lessonHistory,
        homework: allHomework, progress,
        teacherNotes: lessonHistory.map((s) => s.teacherNotes).filter((n): n is string => Boolean(n)),
      }, 200);
    }
    const student = (repo as typeof mem).students.find((s) => s.id === studentId);
    if (!student) throw new HTTPException(404, { message: 'Student not found' });
    const lessonHistory = (repo as typeof mem).sessions.filter((s) => s.studentId === studentId);
    return c.json({
      student, teacher: (repo as typeof mem).teachers.find((t) => t.id === student.assignedTeacherId),
      course: (repo as typeof mem).courses.find((c) => c.id === student.assignedCourseId), attendanceHistory: lessonHistory, lessonHistory,
      homework: (repo as typeof mem).homework.filter((h) => h.studentId === studentId),
      progress: (repo as typeof mem).progress.find((p) => p.studentId === studentId),
      teacherNotes: lessonHistory.map((s) => s.teacherNotes).filter((n): n is string => Boolean(n)),
    }, 200);
  },
);

app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: { title: 'Speak To Reach Management API', version: '1.0.0', description: 'Typesafe Hono RPC API for teachers, students, classes, sessions, attendance, homework, progress, reports, and Notion setup.' },
});

export type AppType = typeof app;
export default app;
