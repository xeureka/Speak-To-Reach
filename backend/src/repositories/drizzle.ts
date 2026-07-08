import { eq, and, inArray, sql } from 'drizzle-orm';
import { getDb } from '../db/connection.js';
import * as s from '../db/schema.js';
import type {
  AssignmentDto, CourseDto, HomeworkDto, ProgressDto, SessionDto, StudentDto,
  TeacherDto, TeacherPerformanceDto,
} from '../domain/contracts.js';

type User = {
  id: string; name: string; email: string; password: string;
  role: 'admin' | 'teacher' | 'student'; teacherId?: string; studentId?: string;
};

const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);
const id = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export class DrizzleRepository {
  // In-memory users for auth (DB users table has hashed passwords, we keep plain for dev)
  users: User[] = [
    { id: 'user-admin', name: 'Admin User', email: 'admin@speaktoreach.local', password: 'admin123', role: 'admin' },
    { id: 'user-teacher-1', name: 'Maya Tesfaye', email: 'maya@speaktoreach.local', password: 'teacher123', role: 'teacher', teacherId: 'teacher-1' },
    { id: 'user-teacher-2', name: 'Jonas Bekele', email: 'jonas@speaktoreach.local', password: 'teacher123', role: 'teacher', teacherId: 'teacher-2' },
    { id: 'user-student-1', name: 'Sara Ahmed', email: 'sara@example.com', password: 'student123', role: 'student', studentId: 'student-1' },
  ];

  private _db: ReturnType<typeof getDb> | null = null;
  private get db() {
    if (!this._db) this._db = getDb();
    return this._db;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  private mapTeacher(t: typeof s.teachers.$inferSelect): TeacherDto {
    return { id: t.id, teacherName: t.teacherName, phone: t.phone ?? undefined, email: t.email, status: t.status, hireDate: t.hireDate ?? undefined, notes: t.notes ?? undefined, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
  }
  private mapStudent(t: typeof s.students.$inferSelect): StudentDto {
    return { id: t.id, studentName: t.studentName, phone: t.phone ?? undefined, email: t.email ?? undefined, level: t.level, classType: t.classType, status: t.status, registrationDate: t.registrationDate, assignedTeacherId: t.assignedTeacherId ?? undefined, assignedCourseId: t.assignedCourseId ?? undefined, notes: t.notes ?? undefined, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
  }
  private mapCourse(t: typeof s.courses.$inferSelect): CourseDto {
    return { id: t.id, courseName: t.courseName, level: t.level, totalUnits: t.totalUnits, totalLessons: t.totalLessons, description: t.description ?? undefined, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
  }
  private mapAssignment(t: typeof s.assignments.$inferSelect): AssignmentDto {
    return { id: t.id, assignmentName: t.assignmentName, teacherId: t.teacherId, studentId: t.studentId, courseId: t.courseId, days: t.days, startTime: t.startTime, endTime: t.endTime ?? undefined, startDate: t.startDate, endDate: t.endDate ?? undefined, mode: t.mode, status: t.status, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
  }
  private mapSession(t: typeof s.sessions.$inferSelect): SessionDto {
    return { id: t.id, sessionName: t.sessionName, sessionDate: t.sessionDate, teacherId: t.teacherId, studentId: t.studentId, assignmentId: t.assignmentId, lessonNumber: t.lessonNumber, lessonTitle: t.lessonTitle, attendance: t.attendance, present: t.present, absent: t.absent, late: t.late, cancelled: t.cancelled, durationMinutes: t.durationMinutes ?? undefined, homeworkGiven: t.homeworkGiven ?? undefined, homeworkSubmitted: t.homeworkSubmitted, vocabularyCovered: t.vocabularyCovered ?? undefined, grammarCovered: t.grammarCovered ?? undefined, speakingPractice: t.speakingPractice ?? undefined, readingPractice: t.readingPractice ?? undefined, writingPractice: t.writingPractice ?? undefined, listeningPractice: t.listeningPractice ?? undefined, teacherNotes: t.teacherNotes ?? undefined, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
  }
  private mapHomework(t: typeof s.homework.$inferSelect): HomeworkDto {
    return { id: t.id, homework: t.homework, studentId: t.studentId, teacherId: t.teacherId, sessionId: t.sessionId ?? undefined, dueDate: t.dueDate, submitted: t.submitted, score: t.score ? Number(t.score) : undefined, feedback: t.feedback ?? undefined, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
  }
  private mapProgress(t: typeof s.progress.$inferSelect): ProgressDto {
    return { id: t.id, studentId: t.studentId, teacherId: t.teacherId, currentUnit: t.currentUnit, currentLesson: t.currentLesson, lastLessonDate: t.lastLessonDate ?? undefined, completionPercentage: Number(t.completionPercentage), strengths: t.strengths ?? undefined, weaknesses: t.weaknesses ?? undefined, recommendedFocus: t.recommendedFocus ?? undefined, manualOverrideReason: t.manualOverrideReason ?? undefined, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
  }

  // ── Auth ───────────────────────────────────────────────────────────────────────

  login(email: string, password: string) {
    return this.users.find((u) => u.email === email && u.password === password) ?? null;
  }
  getMe(userId = 'user-admin') {
    return this.users.find((u) => u.id === userId) ?? this.users[0]!;
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────────

  async listTeachers(status?: string) {
    const rows = await this.db.select().from(s.teachers).where(status ? eq(s.teachers.status, status as 'active' | 'inactive') : undefined);
    return rows.map(this.mapTeacher);
  }
  async createTeacher(data: Record<string, unknown>) {
    const rec = { id: id('tch'), teacherName: String(data.teacherName ?? ''), email: String(data.email ?? ''), phone: String(data.phone ?? ''), status: (data.status as 'active' | 'inactive') ?? 'active', hireDate: String(data.hireDate ?? ''), notes: String(data.notes ?? '') };
    await this.db.insert(s.teachers).values(rec);
    return this.mapTeacher(rec as typeof s.teachers.$inferSelect);
  }
  async updateTeacher(id: string, data: Record<string, unknown>) {
    const existing = await this.db.select().from(s.teachers).where(eq(s.teachers.id, id)).limit(1);
    if (!existing.length) return null;
    await this.db.update(s.teachers).set(data as any).where(eq(s.teachers.id, id));
    const updated = await this.db.select().from(s.teachers).where(eq(s.teachers.id, id)).limit(1);
    return this.mapTeacher(updated[0]!);
  }

  async listStudents(filters?: { status?: string; classType?: string; level?: string }) {
    const conditions = [];
    if (filters?.status) conditions.push(eq(s.students.status, filters.status as any));
    if (filters?.classType) conditions.push(eq(s.students.classType, filters.classType as any));
    if (filters?.level) conditions.push(eq(s.students.level, filters.level as any));
    const rows = await this.db.select().from(s.students).where(conditions.length ? and(...conditions) : undefined);
    return rows.map(this.mapStudent);
  }
  async createStudent(data: Record<string, unknown>) {
    const rec = { id: id('stu'), studentName: String(data.studentName ?? ''), phone: String(data.phone ?? ''), email: String(data.email ?? ''), level: data.level as any, classType: data.classType as any, status: (data.status as any) ?? 'Active', registrationDate: String(data.registrationDate ?? today()), assignedTeacherId: data.assignedTeacherId as string | undefined, assignedCourseId: data.assignedCourseId as string | undefined, notes: String(data.notes ?? '') };
    await this.db.insert(s.students).values(rec);
    return this.mapStudent(rec as typeof s.students.$inferSelect);
  }
  async updateStudent(id: string, data: Record<string, unknown>) {
    const existing = await this.db.select().from(s.students).where(eq(s.students.id, id)).limit(1);
    if (!existing.length) return null;
    await this.db.update(s.students).set(data as any).where(eq(s.students.id, id));
    const updated = await this.db.select().from(s.students).where(eq(s.students.id, id)).limit(1);
    return this.mapStudent(updated[0]!);
  }

  async listCourses() {
    const rows = await this.db.select().from(s.courses);
    return rows.map(this.mapCourse);
  }
  async createCourse(data: Record<string, unknown>) {
    const rec = { id: id('crs'), courseName: String(data.courseName ?? ''), level: data.level as any, totalUnits: Number(data.totalUnits), totalLessons: Number(data.totalLessons), description: String(data.description ?? '') };
    await this.db.insert(s.courses).values(rec);
    return this.mapCourse(rec as typeof s.courses.$inferSelect);
  }
  async updateCourse(id: string, data: Record<string, unknown>) {
    const existing = await this.db.select().from(s.courses).where(eq(s.courses.id, id)).limit(1);
    if (!existing.length) return null;
    await this.db.update(s.courses).set(data as any).where(eq(s.courses.id, id));
    const updated = await this.db.select().from(s.courses).where(eq(s.courses.id, id)).limit(1);
    return this.mapCourse(updated[0]!);
  }

  async listAssignments(filters?: { status?: string; teacherId?: string; studentId?: string }) {
    const conditions = [];
    if (filters?.status) conditions.push(eq(s.assignments.status, filters.status as any));
    if (filters?.teacherId) conditions.push(eq(s.assignments.teacherId, filters.teacherId));
    if (filters?.studentId) conditions.push(eq(s.assignments.studentId, filters.studentId));
    const rows = await this.db.select().from(s.assignments).where(conditions.length ? and(...conditions) : undefined);
    return rows.map(this.mapAssignment);
  }
  async createAssignment(data: Record<string, unknown>) {
    const rec = { id: id('asg'), assignmentName: String(data.assignmentName ?? ''), teacherId: String(data.teacherId ?? ''), studentId: String(data.studentId ?? ''), courseId: String(data.courseId ?? ''), days: String(data.days ?? ''), startTime: String(data.startTime ?? '00:00'), endTime: String(data.endTime ?? ''), startDate: String(data.startDate ?? today()), endDate: String(data.endDate ?? ''), mode: data.mode as any, status: (data.status as any) ?? 'Active' };
    await this.db.insert(s.assignments).values(rec);
    return this.mapAssignment(rec as typeof s.assignments.$inferSelect);
  }
  async updateAssignment(id: string, data: Record<string, unknown>) {
    const existing = await this.db.select().from(s.assignments).where(eq(s.assignments.id, id)).limit(1);
    if (!existing.length) return null;
    await this.db.update(s.assignments).set(data as any).where(eq(s.assignments.id, id));
    const updated = await this.db.select().from(s.assignments).where(eq(s.assignments.id, id)).limit(1);
    return this.mapAssignment(updated[0]!);
  }
  async endAssignment(id: string) {
    const existing = await this.db.select().from(s.assignments).where(eq(s.assignments.id, id)).limit(1);
    if (!existing.length) return null;
    await this.db.update(s.assignments).set({ status: 'Ended', endDate: today() } as any).where(eq(s.assignments.id, id));
    const updated = await this.db.select().from(s.assignments).where(eq(s.assignments.id, id)).limit(1);
    return this.mapAssignment(updated[0]!);
  }

  async listSessions(filters?: { view?: string; teacherId?: string; studentId?: string }) {
    const conditions = [];
    if (filters?.teacherId) conditions.push(eq(s.sessions.teacherId, filters.teacherId));
    if (filters?.studentId) conditions.push(eq(s.sessions.studentId, filters.studentId));
    if (filters?.view === 'today') conditions.push(eq(s.sessions.sessionDate, today()));
    const rows = await this.db.select().from(s.sessions).where(conditions.length ? and(...conditions) : undefined).orderBy(s.sessions.sessionDate);
    return rows.map(this.mapSession);
  }
  async createSession(data: Record<string, unknown>) {
    const rec = { id: id('ses'), sessionName: String(data.sessionName ?? ''), sessionDate: String(data.sessionDate ?? today()), teacherId: String(data.teacherId ?? ''), studentId: String(data.studentId ?? ''), assignmentId: String(data.assignmentId ?? ''), lessonNumber: Number(data.lessonNumber ?? 1), lessonTitle: String(data.lessonTitle ?? ''), attendance: (data.attendance as any) ?? 'Present', present: Boolean(data.present ?? false), absent: Boolean(data.absent ?? false), late: Boolean(data.late ?? false), cancelled: Boolean(data.cancelled ?? false), durationMinutes: data.durationMinutes ? Number(data.durationMinutes) : null, homeworkGiven: String(data.homeworkGiven ?? ''), homeworkSubmitted: Boolean(data.homeworkSubmitted ?? false), vocabularyCovered: String(data.vocabularyCovered ?? ''), grammarCovered: String(data.grammarCovered ?? ''), speakingPractice: String(data.speakingPractice ?? ''), readingPractice: String(data.readingPractice ?? ''), writingPractice: String(data.writingPractice ?? ''), listeningPractice: String(data.listeningPractice ?? ''), teacherNotes: String(data.teacherNotes ?? '') };
    await this.db.insert(s.sessions).values(rec);
    return this.mapSession(rec as typeof s.sessions.$inferSelect);
  }
  async updateSession(id: string, data: Record<string, unknown>) {
    const existing = await this.db.select().from(s.sessions).where(eq(s.sessions.id, id)).limit(1);
    if (!existing.length) return null;
    await this.db.update(s.sessions).set(data as any).where(eq(s.sessions.id, id));
    const updated = await this.db.select().from(s.sessions).where(eq(s.sessions.id, id)).limit(1);
    return this.mapSession(updated[0]!);
  }

  async listHomework(filters?: { status?: string; teacherId?: string; studentId?: string }) {
    const conditions = [];
    if (filters?.teacherId) conditions.push(eq(s.homework.teacherId, filters.teacherId));
    if (filters?.studentId) conditions.push(eq(s.homework.studentId, filters.studentId));
    if (filters?.status === 'pending') conditions.push(eq(s.homework.submitted, false));
    if (filters?.status === 'completed') conditions.push(eq(s.homework.submitted, true));
    const rows = await this.db.select().from(s.homework).where(conditions.length ? and(...conditions) : undefined);
    return rows.map(this.mapHomework);
  }
  async createHomework(data: Record<string, unknown>) {
    const rec = { id: id('hwk'), homework: String(data.homework ?? ''), studentId: String(data.studentId ?? ''), teacherId: String(data.teacherId ?? ''), sessionId: data.sessionId ? String(data.sessionId) : null, dueDate: String(data.dueDate ?? today()), submitted: Boolean(data.submitted ?? false), score: data.score ? String(data.score) : null, feedback: String(data.feedback ?? '') };
    await this.db.insert(s.homework).values(rec);
    return this.mapHomework(rec as typeof s.homework.$inferSelect);
  }
  async updateHomework(id: string, data: Record<string, unknown>) {
    const existing = await this.db.select().from(s.homework).where(eq(s.homework.id, id)).limit(1);
    if (!existing.length) return null;
    await this.db.update(s.homework).set(data as any).where(eq(s.homework.id, id));
    const updated = await this.db.select().from(s.homework).where(eq(s.homework.id, id)).limit(1);
    return this.mapHomework(updated[0]!);
  }

  async listProgress() {
    const rows = await this.db.select().from(s.progress);
    return rows.map(this.mapProgress);
  }
  async updateProgress(id: string, data: Record<string, unknown>) {
    const existing = await this.db.select().from(s.progress).where(eq(s.progress.id, id)).limit(1);
    if (!existing.length) return null;
    await this.db.update(s.progress).set(data as any).where(eq(s.progress.id, id));
    const updated = await this.db.select().from(s.progress).where(eq(s.progress.id, id)).limit(1);
    return this.mapProgress(updated[0]!);
  }

  // ── Performance / Reports ──────────────────────────────────────────────────────

  async performance(teacherId?: string): Promise<TeacherPerformanceDto[]> {
    const teacherRows = await this.db.select().from(s.teachers).where(teacherId ? eq(s.teachers.id, teacherId) : undefined);
    const results: TeacherPerformanceDto[] = [];
    for (const teacher of teacherRows) {
      const tAssignments = await this.db.select().from(s.assignments).where(eq(s.assignments.teacherId, teacher.id));
      const tSessions = await this.db.select().from(s.sessions).where(eq(s.sessions.teacherId, teacher.id));
      const attended = tSessions.filter((s) => s.present || s.late).length;
      const tHomework = await this.db.select().from(s.homework).where(eq(s.homework.teacherId, teacher.id));
      const submittedHw = tHomework.filter((h) => h.submitted).length;
      results.push({
        teacherId: teacher.id, teacherName: teacher.teacherName,
        totalAssignedClasses: tAssignments.length, classesCompleted: tSessions.length,
        attendanceReportsSubmitted: tSessions.length,
        studentAttendancePercentage: tSessions.length ? Math.round((attended / tSessions.length) * 100) : 0,
        homeworkCompletionPercentage: tHomework.length ? Math.round((submittedHw / tHomework.length) * 100) : 0,
        notes: teacher.notes ?? undefined,
      });
    }
    return results;
  }

  async reports(teacherId?: string) {
    const allSessions = teacherId
      ? await this.db.select().from(s.sessions).where(eq(s.sessions.teacherId, teacherId))
      : await this.db.select().from(s.sessions);
    const allStudents = await this.db.select().from(s.students);
    const allTeachers = await this.db.select().from(s.teachers);
    const allProgress = await this.db.select().from(s.progress);

    const todayDate = today();
    const lowAttendanceStudentIds = new Set(
      allStudents.filter((student) => {
        const studentSessions = allSessions.filter((s) => s.studentId === student.id);
        if (studentSessions.length < 2) return false;
        const attended = studentSessions.filter((s) => s.present || s.late).length;
        return attended / studentSessions.length < 0.75;
      }).map((s) => s.id),
    );
    const reportedTeacherIds = new Set(allSessions.filter((s) => s.sessionDate === todayDate).map((s) => s.teacherId));
    const behindStudentIds = new Set(allProgress.filter((p) => Number(p.completionPercentage) < 15).map((p) => p.studentId));

    return {
      studentsWithLowAttendance: allStudents.filter((s) => lowAttendanceStudentIds.has(s.id)).map(this.mapStudent),
      teachersMissingLessonReports: allTeachers.filter((t) => t.status === 'active' && !reportedTeacherIds.has(t.id)).map(this.mapTeacher),
      studentsBehindSchedule: allStudents.filter((s) => behindStudentIds.has(s.id)).map(this.mapStudent),
    };
  }

  async dashboard(teacherId?: string) {
    const allAssignments = teacherId
      ? await this.db.select().from(s.assignments).where(eq(s.assignments.teacherId, teacherId))
      : await this.db.select().from(s.assignments);
    const allSessions = teacherId
      ? await this.db.select().from(s.sessions).where(eq(s.sessions.teacherId, teacherId))
      : await this.db.select().from(s.sessions);
    const allHomework = teacherId
      ? await this.db.select().from(s.homework).where(eq(s.homework.teacherId, teacherId))
      : await this.db.select().from(s.homework);
    const allProgress = teacherId
      ? await this.db.select().from(s.progress).where(eq(s.progress.teacherId, teacherId))
      : await this.db.select().from(s.progress);
    const allStudents = teacherId
      ? await this.db.select().from(s.students).where(eq(s.students.assignedTeacherId, teacherId))
      : await this.db.select().from(s.students);

    const todayDate = today();
    const perf = await this.performance(teacherId);
    const rep = await this.reports(teacherId);

    return {
      todayClasses: allAssignments.filter((a) => a.status === 'Active').map(this.mapAssignment),
      todayAttendance: allSessions.filter((s) => s.sessionDate === todayDate).map(this.mapSession),
      upcomingClasses: allAssignments.filter((a) => ['Active', 'Upcoming'].includes(a.status)).slice(0, 8).map(this.mapAssignment),
      recentLessonReports: allSessions.slice(0, 8).map(this.mapSession),
      teacherPerformance: perf,
      studentProgress: allProgress.slice(0, 8).map(this.mapProgress),
      homeworkPending: allHomework.filter((h) => !h.submitted).slice(0, 8).map(this.mapHomework),
      recentlyRegisteredStudents: allStudents.slice(0, 8).map(this.mapStudent),
      reports: rep,
    };
  }
}

export const drizzleRepository = new DrizzleRepository();
