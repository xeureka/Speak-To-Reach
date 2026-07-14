import { handle } from 'hono/vercel';
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { cors } from 'hono/cors';
import { sign } from 'hono/jwt';
import { HTTPException } from 'hono/http-exception';
import process from 'node:process';
import {
  AuthUser, Teacher, Course, Student, Section, Enrollment, ClassSession,
  CreateTeacher, UpdateTeacher, CreateCourse, UpdateCourse, CreateStudent, UpdateStudent,
  CreateSection, UpdateSection, CreateEnrollment, CreateClassSession, UpdateClassSession,
  CreateSessionReport, AttendancePayload, DashboardData, ImportResult, PaymentSummary,
} from './domain/contracts.js';
import { drizzleRepository as repo } from './repositories/drizzle.js';
import { loadEnv } from './load-env.js';

loadEnv();

export const app = new OpenAPIHono();
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
    await repo.seedUsersAsync();
    const user = await repo.loginDB(email, password);
    if (!user) throw new HTTPException(401, { message: 'Invalid email or password' });
    const token = await sign({ sub: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + 86400 * 7 }, JWT_SECRET);
    return c.json({ token, user }, 200);
  },
);

app.openapi(
  createRoute({ method: 'get', path: '/api/auth/me', responses: { 200: { content: { 'application/json': { schema: AuthUser } }, description: 'OK' } } }),
  async (c) => {
    const userId = getUserId(c);
    if (!userId) throw new HTTPException(401, { message: 'Unauthorized' });
    const user = await repo.getUserFromDB(userId);
    if (!user) throw new HTTPException(401, { message: 'Unauthorized' });
    return c.json(user, 200);
  },
);

app.openapi(
  createRoute({
    method: 'post', path: '/api/auth/register',
    request: { body: { content: { 'application/json': { schema: z.object({ name: z.string(), email: z.string().email(), role: z.enum(['teacher']), teacherId: z.string().optional() }) } } } },
    responses: { 201: { content: { 'application/json': { schema: z.object({ id: z.string(), email: z.string(), password: z.string(), role: z.string() }) } }, description: 'Created' } },
  }),
  async (c) => {
    const userId = getUserId(c);
    if (!userId) throw new HTTPException(401, { message: 'Unauthorized' });
    const caller = await repo.getUserFromDB(userId);
    if (!caller || caller.role !== 'admin') throw new HTTPException(401, { message: 'Only admin can register users' });
    const body = c.req.valid('json');
    const { user, password } = await repo.createUserInDB({ name: body.name, email: body.email, role: 'teacher', teacherId: body.teacherId });
    return c.json({ id: user.id, email: user.email, password, role: user.role }, 201);
  },
);

app.openapi(
  createRoute({
    method: 'patch', path: '/api/auth/password',
    request: { body: { content: { 'application/json': { schema: z.object({ currentPassword: z.string(), newPassword: z.string().min(6) }) } } } },
    responses: { 200: { content: { 'application/json': { schema: z.object({ message: z.string() }) } }, description: 'OK' } },
  }),
  async (c) => {
    const userId = getUserId(c);
    if (!userId) throw new HTTPException(401, { message: 'Unauthorized' });
    const { currentPassword, newPassword } = c.req.valid('json');
    const result = await repo.updatePasswordInDB(userId, currentPassword, newPassword);
    if (!result.ok) throw new HTTPException(401, { message: result.message });
    return c.json({ message: 'Password updated' }, 200);
  },
);

// ── Teachers ──────────────────────────────────────────────────────────────────

app.openapi(
  createRoute({ method: 'get', path: '/api/teachers', request: { query: z.object({ status: z.enum(['active', 'inactive']).optional() }) }, responses: ok(z.array(Teacher)) }),
  async (c) => {
    const q = c.req.valid('query');
    const rows = await repo.listTeachers(q.status);
    return c.json(rows);
  },
);
app.openapi(
  createRoute({ method: 'post', path: '/api/teachers', request: { body: { content: { 'application/json': { schema: CreateTeacher } } } }, responses: created(Teacher) }),
  async (c) => {
    const { entity, password } = await repo.createTeacher(c.req.valid('json') as Record<string, unknown>);
    return c.json({ ...entity, password }, 201);
  },
);
app.openapi(
  createRoute({
    method: 'patch', path: '/api/teachers/{id}',
    request: { params: IdParam, body: { content: { 'application/json': { schema: UpdateTeacher } } } },
    responses: { 200: { content: { 'application/json': { schema: Teacher } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
  }),
  async (c) => {
    const updated = await repo.updateTeacher(c.req.valid('param').id, c.req.valid('json') as Record<string, unknown>);
    if (!updated) throw new HTTPException(404, { message: 'Teacher not found' });
    return c.json(updated, 200);
  },
);
app.openapi(
  createRoute({
    method: 'post', path: '/api/teachers/{id}/reset-password',
    request: { params: IdParam },
    responses: { 200: { content: { 'application/json': { schema: z.object({ email: z.string(), password: z.string() }) } }, description: 'Password reset' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
  }),
  async (c) => {
    const result = await repo.resetTeacherPassword(c.req.valid('param').id);
    if (!result) throw new HTTPException(404, { message: 'Teacher not found' });
    return c.json(result, 200);
  },
);
app.openapi(
  createRoute({
    method: 'get', path: '/api/teachers/{id}/students',
    request: { params: IdParam },
    responses: ok(z.array(Student)),
  }),
  async (c) => {
    const students = await repo.listTeacherStudents(c.req.valid('param').id);
    return c.json(students);
  },
);
app.openapi(
  createRoute({
    method: 'get', path: '/api/teachers/{id}/analytics',
    request: { params: IdParam },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.object({
              totalSections: z.number(),
              privateSections: z.number(),
              groupSections: z.number(),
              privateSectionNames: z.array(z.string()),
              groupSectionNames: z.array(z.string()),
              monthSessionsTotal: z.number(),
              monthSessionsCompleted: z.number(),
              monthHoursTotal: z.number(),
              totalStudents: z.number(),
              reportsSubmitted: z.number(),
              reportsDraft: z.number(),
              totalSessionsEver: z.number(),
              recentSessions: z.array(z.any()),
            }),
          },
        },
        description: 'Teacher analytics',
      },
    },
  }),
  async (c) => {
    const analytics = await repo.getTeacherAnalytics(c.req.valid('param').id);
    return c.json(analytics, 200);
  },
);

// ── Students ──────────────────────────────────────────────────────────────────

app.openapi(
  createRoute({
    method: 'get', path: '/api/students',
    request: { query: z.object({ status: z.enum(['Active', 'Paused', 'Completed']).optional(), classType: z.enum(['Private', 'Mini Group', 'Group']).optional(), level: z.enum(['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper Intermediate', 'Advanced']).optional() }) },
    responses: ok(z.array(Student)),
  }),
  async (c) => {
    const q = c.req.valid('query');
    const rows = await repo.listStudents({ status: q.status, classType: q.classType, level: q.level });
    return c.json(rows);
  },
);
app.openapi(
  createRoute({ method: 'post', path: '/api/students', request: { body: { content: { 'application/json': { schema: CreateStudent } } } }, responses: created(Student) }),
  async (c) => {
    const { entity } = await repo.createStudent(c.req.valid('json') as Record<string, unknown>);
    return c.json(entity, 201);
  },
);
app.openapi(
  createRoute({
    method: 'patch', path: '/api/students/{id}',
    request: { params: IdParam, body: { content: { 'application/json': { schema: UpdateStudent } } } },
    responses: { 200: { content: { 'application/json': { schema: Student } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
  }),
  async (c) => {
    const updated = await repo.updateStudent(c.req.valid('param').id, c.req.valid('json') as Record<string, unknown>);
    if (!updated) throw new HTTPException(404, { message: 'Student not found' });
    return c.json(updated, 200);
  },
);

// ── Courses ───────────────────────────────────────────────────────────────────

app.openapi(createRoute({ method: 'get', path: '/api/courses', responses: ok(z.array(Course)) }), async (c) => {
  const rows = await repo.listCourses();
  return c.json(rows);
});
app.openapi(
  createRoute({ method: 'post', path: '/api/courses', request: { body: { content: { 'application/json': { schema: CreateCourse } } } }, responses: created(Course) }),
  async (c) => {
    const created = await repo.createCourse(c.req.valid('json') as Record<string, unknown>);
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
    const updated = await repo.updateCourse(c.req.valid('param').id, c.req.valid('json') as Record<string, unknown>);
    if (!updated) throw new HTTPException(404, { message: 'Course not found' });
    return c.json(updated, 200);
  },
);

// ── Sections ──────────────────────────────────────────────────────────────────

app.openapi(
  createRoute({
    method: 'get', path: '/api/sections',
    request: { query: z.object({ status: z.enum(['active', 'inactive', 'completed']).optional(), teacherId: z.string().optional(), classType: z.enum(['Private', 'Mini Group', 'Group']).optional() }) },
    responses: ok(z.array(Section)),
  }),
  async (c) => {
    const q = c.req.valid('query');
    const rows = await repo.listSections(q);
    return c.json(rows);
  },
);
app.openapi(
  createRoute({ method: 'post', path: '/api/sections', request: { body: { content: { 'application/json': { schema: CreateSection } } } }, responses: created(Section) }),
  async (c) => {
    const created = await repo.createSection(c.req.valid('json') as Record<string, unknown>);
    return c.json(created, 201);
  },
);
app.openapi(
  createRoute({
    method: 'get', path: '/api/sections/{id}',
    request: { params: IdParam },
    responses: { 200: { content: { 'application/json': { schema: Section } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
  }),
  async (c) => {
    const section = await repo.getSection(c.req.valid('param').id);
    if (!section) throw new HTTPException(404, { message: 'Section not found' });
    return c.json(section, 200);
  },
);
app.openapi(
  createRoute({
    method: 'patch', path: '/api/sections/{id}',
    request: { params: IdParam, body: { content: { 'application/json': { schema: UpdateSection } } } },
    responses: { 200: { content: { 'application/json': { schema: Section } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
  }),
  async (c) => {
    const updated = await repo.updateSection(c.req.valid('param').id, c.req.valid('json') as Record<string, unknown>);
    if (!updated) throw new HTTPException(404, { message: 'Section not found' });
    return c.json(updated, 200);
  },
);
app.openapi(
  createRoute({
    method: 'post', path: '/api/sections/{id}/end',
    request: { params: IdParam },
    responses: { 200: { content: { 'application/json': { schema: Section } }, description: 'OK' } },
  }),
  async (c) => {
    const updated = await repo.endSection(c.req.valid('param').id);
    if (!updated) throw new HTTPException(404, { message: 'Section not found' });
    return c.json(updated, 200);
  },
);

// ── Enrollments ───────────────────────────────────────────────────────────────

app.openapi(
  createRoute({ method: 'get', path: '/api/sections/{id}/enrollments', request: { params: IdParam }, responses: ok(z.array(Enrollment)) }),
  async (c) => {
    const rows = await repo.listEnrollments(c.req.valid('param').id);
    return c.json(rows);
  },
);
app.openapi(
  createRoute({
    method: 'post', path: '/api/sections/{id}/enrollments',
    request: { params: IdParam, body: { content: { 'application/json': { schema: Enrollment.omit({ id: true, sectionId: true, createdAt: true, updatedAt: true }).partial({ enrollmentDate: true, notes: true, status: true }) } } } },
    responses: created(Enrollment),
  }),
  async (c) => {
    const sectionId = c.req.valid('param').id;
    const body = c.req.valid('json');
    const created = await repo.createEnrollment({ ...body, sectionId });
    return c.json(created, 201);
  },
);
app.openapi(
  createRoute({
    method: 'patch', path: '/api/enrollments/{id}',
    request: { params: IdParam, body: { content: { 'application/json': { schema: Enrollment.omit({ id: true, sectionId: true, createdAt: true, updatedAt: true }).partial() } } } },
    responses: { 200: { content: { 'application/json': { schema: Enrollment } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
  }),
  async (c) => {
    const updated = await repo.updateEnrollment(c.req.valid('param').id, c.req.valid('json') as Record<string, unknown>);
    if (!updated) throw new HTTPException(404, { message: 'Enrollment not found' });
    return c.json(updated, 200);
  },
);

// ── Class Sessions ────────────────────────────────────────────────────────────

app.openapi(
  createRoute({
    method: 'get', path: '/api/class-sessions',
    request: { query: z.object({ sectionId: z.string().optional(), date: z.string().optional(), status: z.enum(['scheduled', 'completed', 'cancelled']).optional(), teacherId: z.string().optional(), view: z.enum(['today']).optional() }) },
    responses: ok(z.array(ClassSession)),
  }),
  async (c) => {
    const q = c.req.valid('query');
    const rows = await repo.listClassSessions({ ...q, todayOnly: q.view === 'today' });
    return c.json(rows);
  },
);
app.openapi(
  createRoute({ method: 'post', path: '/api/class-sessions', request: { body: { content: { 'application/json': { schema: CreateClassSession } } } }, responses: created(ClassSession) }),
  async (c) => {
    const created = await repo.createClassSession(c.req.valid('json') as Record<string, unknown>);
    return c.json(created, 201);
  },
);
app.openapi(
  createRoute({
    method: 'post',
    path: '/api/class-sessions/bulk',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({ sessions: z.array(CreateClassSession) }),
          },
        },
      },
    },
    responses: created(z.array(ClassSession)),
  }),
  async (c) => {
    const { sessions } = c.req.valid('json');
    const result = await repo.bulkCreateClassSessions(sessions as Array<Record<string, unknown>>);
    return c.json(result, 201);
  },
);
app.openapi(
  createRoute({
    method: 'patch', path: '/api/class-sessions/{id}',
    request: { params: IdParam, body: { content: { 'application/json': { schema: UpdateClassSession } } } },
    responses: { 200: { content: { 'application/json': { schema: ClassSession } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
  }),
  async (c) => {
    const updated = await repo.updateClassSession(c.req.valid('param').id, c.req.valid('json') as Record<string, unknown>);
    if (!updated) throw new HTTPException(404, { message: 'Session not found' });
    return c.json(updated, 200);
  },
);
app.openapi(
  createRoute({
    method: 'post', path: '/api/class-sessions/{id}/complete',
    request: { params: IdParam },
    responses: { 200: { content: { 'application/json': { schema: ClassSession } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
  }),
  async (c) => {
    const updated = await repo.updateClassSession(c.req.valid('param').id, { status: 'completed' });
    if (!updated) throw new HTTPException(404, { message: 'Session not found' });
    return c.json(updated, 200);
  },
);

// ── Session Attendance ────────────────────────────────────────────────────────

const AttendanceResponse = z.object({ id: z.string(), classSessionId: z.string(), studentId: z.string(), attendanceStatus: z.string(), present: z.boolean(), absent: z.boolean(), late: z.boolean(), cancelled: z.boolean(), notes: z.string().nullable().optional(), createdAt: z.string(), updatedAt: z.string() });

app.openapi(
  createRoute({ method: 'get', path: '/api/class-sessions/{id}/attendance', request: { params: IdParam }, responses: ok(z.array(AttendanceResponse)) }),
  async (c) => {
    const rows = await repo.getAttendance(c.req.valid('param').id);
    return c.json(rows);
  },
);
app.openapi(
  createRoute({
    method: 'post', path: '/api/class-sessions/{id}/attendance',
    request: { params: IdParam, body: { content: { 'application/json': { schema: z.object({ entries: z.array(AttendancePayload) }) } } } },
    responses: { 200: { content: { 'application/json': { schema: z.array(AttendanceResponse) } }, description: 'OK' } },
  }),
  async (c) => {
    const classSessionId = c.req.valid('param').id;
    const { entries } = c.req.valid('json');
    const result = await repo.submitAttendance(classSessionId, entries);
    const userId = getUserId(c);
    if (userId) {
      const user = await repo.getUserFromDB(userId);
      await repo.logActivity(user?.teacherId ?? userId, 'attendance_marked', classSessionId, undefined, `Attendance marked for ${entries.length} students`);
    }
    return c.json(result, 200);
  },
);

// ── Session Reports ───────────────────────────────────────────────────────────

const ReportResponse = z.object({ id: z.string(), classSessionId: z.string(), teacherId: z.string(), reportStatus: z.string(), homeworkGiven: z.string().optional(), homeworkSubmitted: z.boolean().optional(), vocabularyCovered: z.string().optional(), grammarCovered: z.string().optional(), speakingPractice: z.string().optional(), readingPractice: z.string().optional(), writingPractice: z.string().optional(), listeningPractice: z.string().optional(), generalNotes: z.string().optional(), createdAt: z.string(), updatedAt: z.string() });

app.openapi(
  createRoute({ method: 'get', path: '/api/class-sessions/{id}/report', request: { params: IdParam }, responses: { 200: { content: { 'application/json': { schema: ReportResponse.nullable() } }, description: 'OK' } } }),
  async (c) => {
    const report = await repo.getReport(c.req.valid('param').id);
    return c.json(report, 200);
  },
);
app.openapi(
  createRoute({
    method: 'post', path: '/api/class-sessions/{id}/report',
    request: { params: IdParam, body: { content: { 'application/json': { schema: CreateSessionReport } } } },
    responses: { 200: { content: { 'application/json': { schema: ReportResponse.pick({ id: true, classSessionId: true, teacherId: true, reportStatus: true }) } }, description: 'OK' } },
  }),
  async (c) => {
    const classSessionId = c.req.valid('param').id;
    const userId = getUserId(c);
    const user = userId ? await repo.getUserFromDB(userId) : null;
    if (!user) throw new HTTPException(401, { message: 'Unauthorized' });
    const report = await repo.createReport(classSessionId, user.teacherId ?? user.id, c.req.valid('json') as Record<string, unknown>);
    await repo.logActivity(user.teacherId ?? user.id, 'report_submitted', classSessionId, undefined, 'Session report submitted');
    return c.json(report, 200);
  },
);

// ── Import ────────────────────────────────────────────────────────────────────

app.openapi(
  createRoute({ method: 'post', path: '/api/import/students', responses: { 200: { content: { 'application/json': { schema: ImportResult } }, description: 'OK' } } }),
  async (c) => {
    const contentType = c.req.header('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      throw new HTTPException(400, { message: 'Expected multipart/form-data with a "file" field' });
    }
    const body = await c.req.parseBody();
    const file = body['file'];
    if (!file || typeof file === 'string') {
      throw new HTTPException(400, { message: 'No file uploaded' });
    }
    const XLSX = await import('xlsx');
    const arrayBuffer = await (file as File).arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new HTTPException(400, { message: 'Spreadsheet is empty' });
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName]!);

    const result = await repo.importStudents(rows);
    return c.json(result, 200);
  },
);

// ── Activity Log ─────────────────────────────────────────────────────────────

const ActivityLogResponse = z.object({ id: z.string(), teacherId: z.string(), activityType: z.string(), classSessionId: z.string().optional(), sectionId: z.string().optional(), activityDate: z.string(), description: z.string().optional(), metadata: z.record(z.string(), z.unknown()).optional(), createdAt: z.string() });

app.openapi(
  createRoute({
    method: 'get', path: '/api/activity-log',
    request: { query: z.object({ teacherId: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional() }) },
    responses: ok(z.array(ActivityLogResponse)),
  }),
  async (c) => {
    const q = c.req.valid('query');
    const rows = await repo.getActivityLog({ teacherId: q.teacherId, startDate: q.startDate, endDate: q.endDate });
    return c.json(rows);
  },
);

// ── Reports Analytics ────────────────────────────────────────────────────────

const ReportsAnalyticsResponse = z.object({
  studentsWithLowAttendance: z.array(Student),
  teachersMissingLessonReports: z.array(Teacher),
  studentsBehindSchedule: z.array(Student),
});

app.openapi(
  createRoute({
    method: 'get', path: '/api/reports/analytics',
    request: { query: z.object({ teacherId: z.string().optional() }) },
    responses: ok(ReportsAnalyticsResponse),
  }),
  async (c) => {
    const q = c.req.valid('query');
    const data = await repo.reports(q.teacherId);
    return c.json(data);
  },
);

// ── Payments ──────────────────────────────────────────────────────────────────

app.openapi(
  createRoute({
    method: 'get', path: '/api/payments',
    request: { query: z.object({ month: z.string().optional(), teacherId: z.string().optional() }) },
    responses: ok(z.array(PaymentSummary)),
  }),
  async (c) => {
    const q = c.req.valid('query');
    const month = q.month ?? new Date().toISOString().slice(0, 7);
    const rows = await repo.paymentSummary(month, q.teacherId);
    return c.json(rows);
  },
);

// ── Dashboard ─────────────────────────────────────────────────────────────────

app.openapi(createRoute({ method: 'get', path: '/api/reports/admin', responses: ok(DashboardData) }), async (c) => {
  const data = await repo.dashboard();
  return c.json(data);
});

app.openapi(
  createRoute({ method: 'get', path: '/api/reports/teachers/{id}', request: { params: IdParam }, responses: ok(DashboardData) }),
  async (c) => {
    const data = await repo.dashboard(c.req.valid('param').id);
    return c.json(data);
  },
);

const StudentPageResponse = z.object({ student: Student, sections: z.array(Section), enrollments: z.array(Enrollment), attendance: z.array(z.any()) });

app.openapi(
  createRoute({
    method: 'get', path: '/api/reports/students/{id}',
    request: { params: IdParam },
    responses: { 200: { content: { 'application/json': { schema: StudentPageResponse } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
  }),
  async (c) => {
    const data = await repo.studentPage(c.req.valid('param').id);
    if (!data) throw new HTTPException(404, { message: 'Student not found' });
    return c.json(data, 200);
  },
);

// ── Docs ──────────────────────────────────────────────────────────────────────

app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: { title: 'Speak To Reach Management API', version: '2.0.0', description: 'Typesafe Hono RPC API for sections, attendance, reports, payments, and teacher management.' },
});

app.get('/api/docs', swaggerUI({ url: '/openapi.json' }));

export type AppType = typeof app;
export default handle(app);
