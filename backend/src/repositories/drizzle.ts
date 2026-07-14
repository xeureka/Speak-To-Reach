import { eq, and, inArray, sql } from 'drizzle-orm';
import { getDb } from '../db/connection.js';
import * as s from '../db/schema.js';
import type {
  TeacherDto, StudentDto, CourseDto, SectionDto, EnrollmentDto,
  ClassSessionDto, SessionAttendanceDto, SessionReportDto,
  TeacherActivityLogDto, StudentPreferenceDto,
} from '../domain/contracts.js';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;
const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);
const id = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
const genPassword = () => {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let pw = '';
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
};

function mapUser(t: typeof s.users.$inferSelect) {
  return { id: t.id, name: t.name, email: t.email, role: t.role as 'admin' | 'teacher', teacherId: t.teacherId ?? undefined };
}

export class DrizzleRepository {
  private _db: ReturnType<typeof getDb> | null = null;
  private get db() {
    if (!this._db) this._db = getDb();
    return this._db;
  }

  private str(v: unknown) { return v ? String(v) : null; }
  private num(v: unknown) { return v ? Number(v) : null; }

  // ── Mappers ──────────────────────────────────────────────────────────────────

  private mapTeacher(t: typeof s.teachers.$inferSelect): TeacherDto {
    return { id: t.id, teacherName: t.teacherName, phone: t.phone ?? undefined, email: t.email, status: t.status, hireDate: t.hireDate ?? undefined, notes: t.notes ?? undefined, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
  }
  private mapStudent(t: typeof s.students.$inferSelect): StudentDto {
    return { id: t.id, studentName: t.studentName, phone: t.phone ?? undefined, email: t.email ?? undefined, level: t.level, classType: t.classType, status: t.status, registrationDate: t.registrationDate, notes: t.notes ?? undefined, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
  }
  private mapCourse(t: typeof s.courses.$inferSelect): CourseDto {
    return { id: t.id, courseName: t.courseName, level: t.level, totalUnits: t.totalUnits, totalLessons: t.totalLessons, description: t.description ?? undefined, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
  }
  private mapSection(t: typeof s.sections.$inferSelect): SectionDto {
    return { id: t.id, sectionName: t.sectionName, classType: t.classType, teacherId: t.teacherId, courseId: t.courseId, scheduleDays: t.scheduleDays, startTime: t.startTime, endTime: t.endTime ?? undefined, startDate: t.startDate, endDate: t.endDate ?? undefined, maxStudents: t.maxStudents ?? undefined, status: t.status, notes: t.notes ?? undefined, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
  }
  private mapEnrollment(t: typeof s.enrollments.$inferSelect): EnrollmentDto {
    return { id: t.id, studentId: t.studentId, sectionId: t.sectionId, enrollmentDate: t.enrollmentDate, status: t.status as EnrollmentDto['status'], notes: t.notes ?? undefined, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
  }
  private mapClassSession(t: typeof s.classSessions.$inferSelect): ClassSessionDto {
    return { id: t.id, sectionId: t.sectionId, sessionDate: t.sessionDate, sessionNumber: t.sessionNumber, lessonTitle: t.lessonTitle ?? undefined, lessonNumber: t.lessonNumber ?? undefined, sessionType: t.sessionType, durationMinutes: t.durationMinutes ?? undefined, status: t.status as ClassSessionDto['status'], teacherNotes: t.teacherNotes ?? undefined, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
  }
  private mapAttendance(t: typeof s.sessionAttendance.$inferSelect): SessionAttendanceDto {
    return { id: t.id, classSessionId: t.classSessionId, studentId: t.studentId, attendanceStatus: t.attendanceStatus, present: t.present, absent: t.absent, late: t.late, cancelled: t.cancelled, notes: t.notes ?? undefined, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
  }
  private mapReport(t: typeof s.sessionReports.$inferSelect): SessionReportDto {
    return { id: t.id, classSessionId: t.classSessionId, teacherId: t.teacherId, reportStatus: t.reportStatus, homeworkGiven: t.homeworkGiven ?? undefined, homeworkSubmitted: t.homeworkSubmitted ?? undefined, vocabularyCovered: t.vocabularyCovered ?? undefined, grammarCovered: t.grammarCovered ?? undefined, speakingPractice: t.speakingPractice ?? undefined, readingPractice: t.readingPractice ?? undefined, writingPractice: t.writingPractice ?? undefined, listeningPractice: t.listeningPractice ?? undefined, generalNotes: t.generalNotes ?? undefined, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
  }
  private mapActivityLog(t: typeof s.teacherActivityLog.$inferSelect): TeacherActivityLogDto {
    return { id: t.id, teacherId: t.teacherId, activityType: t.activityType, classSessionId: t.classSessionId ?? undefined, sectionId: t.sectionId ?? undefined, activityDate: t.activityDate, description: t.description ?? undefined, metadata: (t.metadata as Record<string, unknown>) ?? undefined, createdAt: t.createdAt.toISOString() };
  }
  private mapPreference(t: typeof s.studentPreferences.$inferSelect): StudentPreferenceDto {
    return { id: t.id, studentId: t.studentId, preferredDays: t.preferredDays ?? undefined, preferredTimeStart: t.preferredTimeStart ?? undefined, preferredTimeEnd: t.preferredTimeEnd ?? undefined, preferredClassType: t.preferredClassType ?? undefined, preferredTeacherId: t.preferredTeacherId ?? undefined, notes: t.notes ?? undefined, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
  }

  // ── Auth ─────────────────────────────────────────────────────────────────────

  private _seeded = false;

  async seedUsersAsync() {
    if (this._seeded) return;
    const existing = await this.db.select().from(s.users);
    const hash = (pw: string) => bcrypt.hashSync(pw, BCRYPT_ROUNDS);
    const defaultUsers = [
      { id: 'user-admin', name: 'Admin User', email: 'admin@speaktoreach.local', password: 'admin123', role: 'admin' as const },
      { id: 'user-teacher-1', name: 'Maya Tesfaye', email: 'maya@speaktoreach.local', password: 'teacher123', role: 'teacher' as const, teacherId: 'teacher-1' },
      { id: 'user-teacher-2', name: 'Jonas Bekele', email: 'jonas@speaktoreach.local', password: 'teacher123', role: 'teacher' as const, teacherId: 'teacher-2' },
    ];
    for (const u of defaultUsers) {
      const row = existing.find((r) => r.id === u.id);
      if (!row) {
        const { password, ...rest } = u;
        await this.db.insert(s.users).values({ ...rest, passwordHash: hash(password) });
      } else if (!row.passwordHash.startsWith('$2')) {
        await this.db.update(s.users).set({ passwordHash: hash(u.password) }).where(eq(s.users.id, u.id));
      }
    }
    this._seeded = true;
  }

  async loginDB(email: string, password: string) {
    const [row] = await this.db.select().from(s.users).where(eq(s.users.email, email)).limit(1);
    if (!row) return null;
    if (!bcrypt.compareSync(password, row.passwordHash)) return null;
    return mapUser(row);
  }

  async getUserFromDB(userId: string) {
    const [row] = await this.db.select().from(s.users).where(eq(s.users.id, userId)).limit(1);
    if (!row) return null;
    return mapUser(row);
  }

  async updatePasswordInDB(userId: string, currentPassword: string, newPassword: string) {
    const [row] = await this.db.select().from(s.users).where(eq(s.users.id, userId)).limit(1);
    if (!row) return { ok: false, message: 'User not found' } as const;
    if (!bcrypt.compareSync(currentPassword, row.passwordHash)) return { ok: false, message: 'Current password is incorrect' } as const;
    await this.db.update(s.users).set({ passwordHash: bcrypt.hashSync(newPassword, BCRYPT_ROUNDS) }).where(eq(s.users.id, userId));
    return { ok: true, message: 'Password updated' } as const;
  }

  async createUserInDB(data: { name: string; email: string; role: 'teacher'; teacherId?: string }) {
    const password = genPassword();
    const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
    const [existing] = await this.db.select().from(s.users).where(eq(s.users.email, data.email)).limit(1);
    if (existing) {
      await this.db.update(s.users).set({ passwordHash, name: data.name, teacherId: data.teacherId ?? null }).where(eq(s.users.email, data.email));
      return { user: mapUser({ ...existing, name: data.name, passwordHash, teacherId: data.teacherId ?? null }), password };
    }
    const userId = `user-${data.role}-${Math.random().toString(36).slice(2, 7)}`;
    await this.db.insert(s.users).values({ id: userId, name: data.name, email: data.email, passwordHash, role: data.role, teacherId: data.teacherId });
    return { user: mapUser({ id: userId, name: data.name, email: data.email, passwordHash: '', role: data.role, teacherId: data.teacherId ?? null, createdAt: new Date(), updatedAt: new Date(), createdBy: null, updatedBy: null }), password };
  }

  // ── Teachers ─────────────────────────────────────────────────────────────────

  async listTeachers(status?: string) {
    const rows = await this.db.select().from(s.teachers).where(status ? eq(s.teachers.status, status as 'active' | 'inactive') : undefined);
    return rows.map(this.mapTeacher);
  }
  async createTeacher(data: Record<string, unknown>) {
    const email = String(data.email ?? '');
    const [existing] = email ? await this.db.select().from(s.teachers).where(eq(s.teachers.email, email)).limit(1) : [];
    if (existing) {
      const { password } = await this.createUserInDB({ name: String(data.teacherName ?? existing.teacherName), email, role: 'teacher', teacherId: existing.id });
      return { entity: this.mapTeacher(existing), password };
    }
    const rec = { id: id('tch'), teacherName: String(data.teacherName ?? ''), email, phone: this.str(data.phone), status: (data.status as 'active' | 'inactive') ?? 'active', hireDate: this.str(data.hireDate), notes: this.str(data.notes) };
    const [inserted] = await this.db.insert(s.teachers).values(rec).returning();
    if (!inserted) throw new Error('Failed to create teacher');
    const { password } = await this.createUserInDB({ name: String(data.teacherName ?? ''), email, role: 'teacher', teacherId: inserted.id });
    return { entity: this.mapTeacher(inserted), password };
  }
  async updateTeacher(id: string, data: Record<string, unknown>) {
    const existing = await this.db.select().from(s.teachers).where(eq(s.teachers.id, id)).limit(1);
    if (!existing.length) return null;
    await this.db.update(s.teachers).set(data as any).where(eq(s.teachers.id, id));
    const updated = await this.db.select().from(s.teachers).where(eq(s.teachers.id, id)).limit(1);
    return this.mapTeacher(updated[0]!);
  }
  async resetTeacherPassword(teacherId: string) {
    const teacher = await this.db.select().from(s.teachers).where(eq(s.teachers.id, teacherId)).limit(1);
    if (!teacher.length) return null;
    const email = teacher[0]!.email;
    const [user] = await this.db.select().from(s.users).where(eq(s.users.teacherId, teacherId)).limit(1);
    if (!user) return null;
    const newPassword = genPassword();
    const passwordHash = bcrypt.hashSync(newPassword, BCRYPT_ROUNDS);
    await this.db.update(s.users).set({ passwordHash }).where(eq(s.users.id, user.id));
    return { email, password: newPassword };
  }

  // ── Students ─────────────────────────────────────────────────────────────────

  async listStudents(filters?: { status?: string; classType?: string; level?: string }) {
    const conditions = [];
    if (filters?.status) conditions.push(eq(s.students.status, filters.status as any));
    if (filters?.classType) conditions.push(eq(s.students.classType, filters.classType as any));
    if (filters?.level) conditions.push(eq(s.students.level, filters.level as any));
    const rows = await this.db.select().from(s.students).where(conditions.length ? and(...conditions) : undefined);
    return rows.map(this.mapStudent);
  }
  async listTeacherStudents(teacherId: string) {
    const teacherSections = await this.db.select().from(s.sections).where(eq(s.sections.teacherId, teacherId));
    if (!teacherSections.length) return [];
    const sectionIds = teacherSections.map(sec => sec.id);
    const enrollments = await this.db.select().from(s.enrollments).where(inArray(s.enrollments.sectionId, sectionIds));
    if (!enrollments.length) return [];
    const studentIds = [...new Set(enrollments.map(e => e.studentId))];
    const studentRows = await this.db.select().from(s.students).where(inArray(s.students.id, studentIds));
    return studentRows.map(this.mapStudent);
  }
  async createStudent(data: Record<string, unknown>) {
    const rec = { id: id('stu'), studentName: String(data.studentName ?? ''), phone: this.str(data.phone), email: this.str(data.email), level: data.level as any, classType: data.classType as any, status: (data.status as any) ?? 'Active', registrationDate: String(data.registrationDate ?? today()), notes: this.str(data.notes) };
    const [inserted] = await this.db.insert(s.students).values(rec).returning();
    if (!inserted) throw new Error('Failed to create student');
    return { entity: this.mapStudent(inserted) };
  }
  async updateStudent(id: string, data: Record<string, unknown>) {
    const existing = await this.db.select().from(s.students).where(eq(s.students.id, id)).limit(1);
    if (!existing.length) return null;
    await this.db.update(s.students).set(data as any).where(eq(s.students.id, id));
    const updated = await this.db.select().from(s.students).where(eq(s.students.id, id)).limit(1);
    return this.mapStudent(updated[0]!);
  }

  // ── Courses ──────────────────────────────────────────────────────────────────

  async listCourses() {
    return (await this.db.select().from(s.courses)).map(this.mapCourse);
  }
  async createCourse(data: Record<string, unknown>) {
    const rec = { id: id('crs'), courseName: String(data.courseName ?? ''), level: data.level as any, totalUnits: Number(data.totalUnits), totalLessons: Number(data.totalLessons), description: this.str(data.description) };
    const [inserted] = await this.db.insert(s.courses).values(rec).returning();
    if (!inserted) throw new Error('Failed to create course');
    return this.mapCourse(inserted);
  }
  async updateCourse(id: string, data: Record<string, unknown>) {
    const existing = await this.db.select().from(s.courses).where(eq(s.courses.id, id)).limit(1);
    if (!existing.length) return null;
    await this.db.update(s.courses).set(data as any).where(eq(s.courses.id, id));
    const updated = await this.db.select().from(s.courses).where(eq(s.courses.id, id)).limit(1);
    return this.mapCourse(updated[0]!);
  }

  // ── Sections ─────────────────────────────────────────────────────────────────

  async listSections(filters?: { status?: string; teacherId?: string; classType?: string }) {
    const conditions = [];
    if (filters?.status) conditions.push(eq(s.sections.status, filters.status as any));
    if (filters?.teacherId) conditions.push(eq(s.sections.teacherId, filters.teacherId));
    if (filters?.classType) conditions.push(eq(s.sections.classType, filters.classType as any));
    const rows = await this.db.select().from(s.sections).where(conditions.length ? and(...conditions) : undefined);
    return rows.map(this.mapSection);
  }
  async createSection(data: Record<string, unknown>) {
    const rec = { id: id('sec'), sectionName: String(data.sectionName ?? ''), classType: data.classType as any, teacherId: String(data.teacherId ?? ''), courseId: String(data.courseId ?? ''), scheduleDays: String(data.scheduleDays ?? ''), startTime: String(data.startTime ?? '09:00'), endTime: this.str(data.endTime), startDate: String(data.startDate ?? today()), endDate: this.str(data.endDate), maxStudents: this.num(data.maxStudents) ?? 20, status: (data.status as any) ?? 'active', notes: this.str(data.notes) };
    const [inserted] = await this.db.insert(s.sections).values(rec).returning();
    if (!inserted) throw new Error('Failed to create section');
    return this.mapSection(inserted);
  }
  async getSection(id: string) {
    const [row] = await this.db.select().from(s.sections).where(eq(s.sections.id, id)).limit(1);
    return row ? this.mapSection(row) : null;
  }
  async updateSection(id: string, data: Record<string, unknown>) {
    const existing = await this.db.select().from(s.sections).where(eq(s.sections.id, id)).limit(1);
    if (!existing.length) return null;
    await this.db.update(s.sections).set(data as any).where(eq(s.sections.id, id));
    const updated = await this.db.select().from(s.sections).where(eq(s.sections.id, id)).limit(1);
    return this.mapSection(updated[0]!);
  }
  async endSection(id: string) {
    const existing = await this.db.select().from(s.sections).where(eq(s.sections.id, id)).limit(1);
    if (!existing.length) return null;
    await this.db.update(s.sections).set({ status: 'completed', endDate: today() } as any).where(eq(s.sections.id, id));
    const updated = await this.db.select().from(s.sections).where(eq(s.sections.id, id)).limit(1);
    return this.mapSection(updated[0]!);
  }

  // ── Enrollments ──────────────────────────────────────────────────────────────

  async listEnrollments(sectionId: string) {
    const rows = await this.db.select().from(s.enrollments).where(eq(s.enrollments.sectionId, sectionId));
    return rows.map(this.mapEnrollment);
  }
  async createEnrollment(data: Record<string, unknown>) {
    const rec = { id: id('enr'), studentId: String(data.studentId ?? ''), sectionId: String(data.sectionId ?? ''), enrollmentDate: String(data.enrollmentDate ?? today()), status: (data.status as string) ?? 'active', notes: this.str(data.notes) };
    const [inserted] = await this.db.insert(s.enrollments).values(rec).returning();
    if (!inserted) throw new Error('Failed to create enrollment');
    return this.mapEnrollment(inserted);
  }
  async updateEnrollment(id: string, data: Record<string, unknown>) {
    const existing = await this.db.select().from(s.enrollments).where(eq(s.enrollments.id, id)).limit(1);
    if (!existing.length) return null;
    await this.db.update(s.enrollments).set(data as any).where(eq(s.enrollments.id, id));
    const updated = await this.db.select().from(s.enrollments).where(eq(s.enrollments.id, id)).limit(1);
    return this.mapEnrollment(updated[0]!);
  }

  // ── Class Sessions ───────────────────────────────────────────────────────────

  async listClassSessions(filters?: { sectionId?: string; date?: string; status?: string; teacherId?: string; todayOnly?: boolean }) {
    const conditions = [];
    if (filters?.sectionId) conditions.push(eq(s.classSessions.sectionId, filters.sectionId));
    if (filters?.date) conditions.push(eq(s.classSessions.sessionDate, filters.date));
    if (filters?.status) conditions.push(eq(s.classSessions.status, filters.status));
    if (filters?.todayOnly) conditions.push(eq(s.classSessions.sessionDate, today()));
    if (filters?.teacherId) {
      const sectionIds = (await this.db.select({ id: s.sections.id }).from(s.sections).where(eq(s.sections.teacherId, filters.teacherId))).map(r => r.id);
      if (sectionIds.length) conditions.push(sql`${s.classSessions.sectionId} IN (${sql.join(sectionIds.map(id => sql`${id}`), sql`, `)})`);
    }
    const rows = await this.db.select().from(s.classSessions).where(conditions.length ? and(...conditions) : undefined).orderBy(s.classSessions.sessionDate);
    return rows.map(this.mapClassSession);
  }
  async createClassSession(data: Record<string, unknown>) {
    const rec = { id: id('css'), sectionId: String(data.sectionId ?? ''), sessionDate: String(data.sessionDate ?? today()), sessionNumber: Number(data.sessionNumber ?? 1), lessonTitle: this.str(data.lessonTitle), lessonNumber: this.num(data.lessonNumber), sessionType: data.sessionType as any, durationMinutes: this.num(data.durationMinutes) ?? 60, status: (data.status as string) ?? 'scheduled', teacherNotes: this.str(data.teacherNotes) };
    const [inserted] = await this.db.insert(s.classSessions).values(rec).returning();
    if (!inserted) throw new Error('Failed to create class session');
    return this.mapClassSession(inserted);
  }
  async bulkCreateClassSessions(sessions: Array<Record<string, unknown>>) {
    const records = sessions.map(data => ({
      id: id('css'),
      sectionId: String(data.sectionId ?? ''),
      sessionDate: String(data.sessionDate ?? today()),
      sessionNumber: Number(data.sessionNumber ?? 1),
      lessonTitle: this.str(data.lessonTitle),
      lessonNumber: this.num(data.lessonNumber),
      sessionType: data.sessionType as any,
      durationMinutes: this.num(data.durationMinutes) ?? 60,
      status: (data.status as string) ?? 'scheduled',
      teacherNotes: this.str(data.teacherNotes),
    }));
    const inserted = await this.db.insert(s.classSessions).values(records).returning();
    return inserted.map(this.mapClassSession);
  }
  async updateClassSession(id: string, data: Record<string, unknown>) {
    const existing = await this.db.select().from(s.classSessions).where(eq(s.classSessions.id, id)).limit(1);
    if (!existing.length) return null;
    await this.db.update(s.classSessions).set(data as any).where(eq(s.classSessions.id, id));
    const updated = await this.db.select().from(s.classSessions).where(eq(s.classSessions.id, id)).limit(1);
    return this.mapClassSession(updated[0]!);
  }

  // ── Session Attendance ───────────────────────────────────────────────────────

  async getAttendance(classSessionId: string) {
    const rows = await this.db.select().from(s.sessionAttendance).where(eq(s.sessionAttendance.classSessionId, classSessionId));
    return rows.map(this.mapAttendance);
  }
  async submitAttendance(classSessionId: string, entries: Array<{ studentId: string; attendanceStatus: string; notes?: string }>) {
    await this.db.delete(s.sessionAttendance).where(eq(s.sessionAttendance.classSessionId, classSessionId));
    const records = entries.map(e => ({
      id: id('att'),
      classSessionId,
      studentId: e.studentId,
      attendanceStatus: e.attendanceStatus as any,
      present: e.attendanceStatus === 'Present',
      absent: e.attendanceStatus === 'Absent',
      late: e.attendanceStatus === 'Late',
      cancelled: e.attendanceStatus === 'Cancelled',
      notes: e.notes ?? null,
    }));
    if (records.length) await this.db.insert(s.sessionAttendance).values(records);
    return records.map(r => ({ ...r, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
  }

  // ── Session Reports ──────────────────────────────────────────────────────────

  async getReport(classSessionId: string) {
    const [row] = await this.db.select().from(s.sessionReports).where(eq(s.sessionReports.classSessionId, classSessionId)).limit(1);
    return row ? this.mapReport(row) : null;
  }
  async createReport(classSessionId: string, teacherId: string, data: Record<string, unknown>) {
    const existing = await this.db.select().from(s.sessionReports).where(eq(s.sessionReports.classSessionId, classSessionId)).limit(1);
    if (existing.length) {
      const cur = existing[0]!;
      await this.db.update(s.sessionReports).set({ reportStatus: (data.reportStatus as any) ?? cur.reportStatus, homeworkGiven: this.str(data.homeworkGiven) ?? cur.homeworkGiven, vocabularyCovered: this.str(data.vocabularyCovered) ?? cur.vocabularyCovered, grammarCovered: this.str(data.grammarCovered) ?? cur.grammarCovered, speakingPractice: this.str(data.speakingPractice) ?? cur.speakingPractice, readingPractice: this.str(data.readingPractice) ?? cur.readingPractice, writingPractice: this.str(data.writingPractice) ?? cur.writingPractice, listeningPractice: this.str(data.listeningPractice) ?? cur.listeningPractice, generalNotes: this.str(data.generalNotes) ?? cur.generalNotes } as any).where(eq(s.sessionReports.classSessionId, classSessionId));
      const updated = await this.db.select().from(s.sessionReports).where(eq(s.sessionReports.classSessionId, classSessionId)).limit(1);
      return this.mapReport(updated[0]!);
    }
    const rec = { id: id('rpt'), classSessionId, teacherId, reportStatus: (data.reportStatus as any) ?? 'draft', homeworkGiven: this.str(data.homeworkGiven), homeworkSubmitted: Boolean(data.homeworkSubmitted ?? false), vocabularyCovered: this.str(data.vocabularyCovered), grammarCovered: this.str(data.grammarCovered), speakingPractice: this.str(data.speakingPractice), readingPractice: this.str(data.readingPractice), writingPractice: this.str(data.writingPractice), listeningPractice: this.str(data.listeningPractice), generalNotes: this.str(data.generalNotes) };
    const [inserted] = await this.db.insert(s.sessionReports).values(rec).returning();
    if (!inserted) throw new Error('Failed to create report');
    return this.mapReport(inserted);
  }
  async updateReport(id: string, data: Record<string, unknown>) {
    const existing = await this.db.select().from(s.sessionReports).where(eq(s.sessionReports.id, id)).limit(1);
    if (!existing.length) return null;
    await this.db.update(s.sessionReports).set(data as any).where(eq(s.sessionReports.id, id));
    const updated = await this.db.select().from(s.sessionReports).where(eq(s.sessionReports.id, id)).limit(1);
    return this.mapReport(updated[0]!);
  }

  // ── Activity Log ─────────────────────────────────────────────────────────────

  async logActivity(teacherId: string, activityType: string, classSessionId?: string, sectionId?: string, description?: string, metadata?: Record<string, unknown>) {
    const rec = { id: id('act'), teacherId, activityType: activityType as any, classSessionId: classSessionId ?? null, sectionId: sectionId ?? null, activityDate: today(), description: description ?? null, metadata: metadata ?? null };
    const [inserted] = await this.db.insert(s.teacherActivityLog).values(rec).returning();
    return inserted ? this.mapActivityLog(inserted) : null;
  }
  async getActivityLog(filters?: { teacherId?: string; startDate?: string; endDate?: string }) {
    const conditions = [];
    if (filters?.teacherId) conditions.push(eq(s.teacherActivityLog.teacherId, filters.teacherId));
    if (filters?.startDate) conditions.push(sql`${s.teacherActivityLog.activityDate} >= ${filters.startDate}`);
    if (filters?.endDate) conditions.push(sql`${s.teacherActivityLog.activityDate} <= ${filters.endDate}`);
    const rows = await this.db.select().from(s.teacherActivityLog).where(conditions.length ? and(...conditions) : undefined).orderBy(s.teacherActivityLog.activityDate);
    return rows.map(this.mapActivityLog);
  }

  // ── Student Import ───────────────────────────────────────────────────────────

  async importStudents(rows: Array<Record<string, unknown>>) {
    const imported: Array<Record<string, unknown>> = [];
    const errors: Array<{ row: number; message: string }> = [];
    let skipped = 0;

    const existing = await this.db.select().from(s.students);
    const existingEmails = new Set(existing.filter(r => r.email).map(r => r.email!.toLowerCase()));
    const existingNames = new Set(existing.map(r => r.studentName.toLowerCase()));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const rowNum = i + 2;
      try {
        const name = String(row['name'] ?? row['Name'] ?? row['student_name'] ?? row['Student Name'] ?? '').trim();
        if (!name) { errors.push({ row: rowNum, message: 'Missing student name' }); continue; }

        const email = String(row['email'] ?? row['Email'] ?? '').trim() || undefined;
        if (email && existingEmails.has(email.toLowerCase())) { skipped++; continue; }
        if (existingNames.has(name.toLowerCase())) { skipped++; continue; }

        const phone = String(row['phone'] ?? row['Phone'] ?? '').trim() || undefined;
        const level = (String(row['level'] ?? row['Level'] ?? 'Beginner').trim()) as any;
        const classType = (String(row['class_type'] ?? row['Class Type'] ?? row['classType'] ?? 'Private').trim()) as any;
        const preferredDays = String(row['preferred_days'] ?? row['Preferred Days'] ?? '').trim() || undefined;
        const preferredTime = String(row['preferred_time'] ?? row['Preferred Time'] ?? '').trim() || undefined;
        const preferredTeacher = String(row['preferred_teacher'] ?? row['Preferred Teacher'] ?? '').trim() || undefined;

        const validLevels = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper Intermediate', 'Advanced'];
        const validTypes = ['Private', 'Mini Group', 'Group'];
        const studentLevel = validLevels.includes(level) ? level : 'Beginner';
        const studentType = validTypes.includes(classType) ? classType : 'Private';

        const rec = { id: id('stu'), studentName: name, phone: phone ?? null, email: email ?? null, level: studentLevel as any, classType: studentType as any, status: 'Active' as const, registrationDate: today(), notes: null };
        const [inserted] = await this.db.insert(s.students).values(rec).returning();
        if (inserted) {
          imported.push(this.mapStudent(inserted));
          if (email) existingEmails.add(email.toLowerCase());
          existingNames.add(name.toLowerCase());

          if (preferredDays || preferredTime || preferredTeacher) {
            const teacherRow = preferredTeacher ? await this.db.select().from(s.teachers).where(eq(s.teachers.teacherName, preferredTeacher)).limit(1) : [];
            await this.db.insert(s.studentPreferences).values({
              id: id('pref'),
              studentId: inserted.id,
              preferredDays: preferredDays ?? null,
              preferredTimeStart: preferredTime ? preferredTime.split('-')[0]?.trim() ?? null : null,
              preferredTimeEnd: preferredTime ? preferredTime.split('-')[1]?.trim() ?? null : null,
              preferredClassType: studentType as any,
              preferredTeacherId: teacherRow[0]?.id ?? null,
              notes: null,
            });
          }
        }
      } catch (err) {
        errors.push({ row: rowNum, message: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    return { imported: imported.length, skipped, errors, students: imported.map(r => r as any) };
  }

  // ── Student Preferences ──────────────────────────────────────────────────────

  async createPreference(data: Record<string, unknown>) {
    const rec = { id: id('pref'), studentId: String(data.studentId ?? ''), preferredDays: this.str(data.preferredDays), preferredTimeStart: this.str(data.preferredTimeStart), preferredTimeEnd: this.str(data.preferredTimeEnd), preferredClassType: data.preferredClassType as any, preferredTeacherId: this.str(data.preferredTeacherId), notes: this.str(data.notes) };
    const [inserted] = await this.db.insert(s.studentPreferences).values(rec).returning();
    return inserted ? this.mapPreference(inserted) : null;
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────

  async getTeacherAnalytics(teacherId: string) {
    const sections = await this.db.select().from(s.sections).where(eq(s.sections.teacherId, teacherId));
    const sectionIds = sections.map(sec => sec.id);

    const allSessions = sectionIds.length
      ? await this.db.select().from(s.classSessions).where(inArray(s.classSessions.sectionId, sectionIds))
      : [];

    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`;
    const monthSessions = allSessions.filter(s => s.sessionDate >= monthStart && s.sessionDate <= monthEnd);

    const completedSessions = monthSessions.filter(s => s.status === 'completed');
    const totalMinutes = completedSessions.reduce((sum, s) => sum + (s.durationMinutes ?? 60), 0);

    const sessionIds = allSessions.map(s => s.id);
    const reports = sessionIds.length
      ? await this.db.select().from(s.sessionReports).where(inArray(s.sessionReports.classSessionId, sessionIds))
      : [];

    const privateSections = sections.filter(s => s.classType === 'Private');
    const groupSections = sections.filter(s => s.classType === 'Group' || s.classType === 'Mini Group');

    const enrollmentIds = sectionIds.length
      ? await this.db.select().from(s.enrollments).where(inArray(s.enrollments.sectionId, sectionIds))
      : [];
    const uniqueStudentIds = [...new Set(enrollmentIds.map(e => e.studentId))];

    const sectionMap = new Map(sections.map(sec => [sec.id, sec]));
    const recentSessions = allSessions
      .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))
      .slice(0, 20)
      .map(session => ({
        ...this.mapClassSession(session),
        sectionName: sectionMap.get(session.sectionId)?.sectionName ?? 'Unknown',
        sectionClassType: sectionMap.get(session.sectionId)?.classType ?? 'Unknown',
      }));

    return {
      totalSections: sections.length,
      privateSections: privateSections.length,
      groupSections: groupSections.length,
      privateSectionNames: privateSections.map(s => s.sectionName),
      groupSectionNames: groupSections.map(s => s.sectionName),
      monthSessionsTotal: monthSessions.length,
      monthSessionsCompleted: completedSessions.length,
      monthHoursTotal: Math.round(totalMinutes / 60 * 10) / 10,
      totalStudents: uniqueStudentIds.length,
      reportsSubmitted: reports.filter(r => r.reportStatus === 'submitted').length,
      reportsDraft: reports.filter(r => r.reportStatus === 'draft').length,
      totalSessionsEver: allSessions.length,
      recentSessions,
    };
  }

  async dashboard(teacherId?: string) {
    const sections = teacherId
      ? await this.db.select().from(s.sections).where(eq(s.sections.teacherId, teacherId))
      : await this.db.select().from(s.sections);
    const teachers = await this.db.select().from(s.teachers).where(eq(s.teachers.status, 'active'));
    const todaySessions = await this.db.select().from(s.classSessions).where(eq(s.classSessions.sessionDate, today()));

    return {
      totalActiveSections: sections.filter(s => s.status === 'active').length,
      activeGroupSections: sections.filter(s => s.status === 'active' && s.classType === 'Group').length,
      activePrivateSections: sections.filter(s => s.status === 'active' && s.classType === 'Private').length,
      totalActiveTeachers: teachers.length,
      todaysClasses: todaySessions.map(this.mapClassSession),
      recentActivity: (await this.db.select().from(s.classSessions).orderBy(s.classSessions.sessionDate).limit(8)).map(this.mapClassSession),
      sections: sections.filter(s => s.status === 'active').map(this.mapSection),
    };
  }

  // ── Payments ─────────────────────────────────────────────────────────────────

  async paymentSummary(month: string, teacherId?: string) {
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;
    const activities = await this.getActivityLog({ teacherId, startDate, endDate });
    const teachers = await this.listTeachers();
    const teacherMap = new Map(teachers.map(t => [t.id, t.teacherName]));

    const grouped = new Map<string, typeof activities>();
    for (const a of activities) {
      const existing = grouped.get(a.teacherId) ?? [];
      existing.push(a);
      grouped.set(a.teacherId, existing);
    }

    return Array.from(grouped.entries()).map(([tid, logs]) => ({
      teacherId: tid,
      teacherName: teacherMap.get(tid) ?? tid,
      classesTaught: logs.filter(l => l.activityType === 'class_taught').length,
      reportsSubmitted: logs.filter(l => l.activityType === 'report_submitted').length,
      totalHours: logs.reduce((sum, l) => sum + ((l.metadata?.duration as number) ?? 60), 0) / 60,
    }));
  }

  // ── Reports ──────────────────────────────────────────────────────────────────

  async reports(teacherId?: string) {
    const allSessions = teacherId
      ? await this.db.select().from(s.classSessions).innerJoin(s.sections, eq(s.classSessions.sectionId, s.sections.id)).where(eq(s.sections.teacherId, teacherId))
      : await this.db.select().from(s.classSessions);
    const allStudents = await this.db.select().from(s.students);
    const allTeachers = await this.db.select().from(s.teachers);
    const allSections = await this.db.select().from(s.sections);

    const todayDate = today();
    const reportedTeacherIds = new Set(
      allSessions.filter((row: any) => row.class_sessions.sessionDate === todayDate).map((row: any) => {
        const section = allSections.find((sec: any) => sec.id === row.class_sessions.sectionId);
        return section?.teacherId;
      }).filter(Boolean)
    );

    return {
      studentsWithLowAttendance: [] as StudentDto[],
      teachersMissingLessonReports: allTeachers.filter(t => t.status === 'active' && !reportedTeacherIds.has(t.id)).map(this.mapTeacher),
      studentsBehindSchedule: [] as StudentDto[],
    };
  }

  // ── Student Page ─────────────────────────────────────────────────────────────

  async studentPage(studentId: string) {
    const [student] = await this.db.select().from(s.students).where(eq(s.students.id, studentId)).limit(1);
    if (!student) return null;
    const enrollments = await this.db.select().from(s.enrollments).where(eq(s.enrollments.studentId, studentId));
    const sectionIds = enrollments.map(e => e.sectionId);
    const sectionsList = sectionIds.length
      ? await this.db.select().from(s.sections).where(sql`${s.sections.id} IN (${sql.join(sectionIds.map(id => sql`${id}`), sql`, `)})`)
      : [];
    const sessionIds = (await this.db.select({ id: s.classSessions.id }).from(s.classSessions).where(sql`${s.classSessions.sectionId} IN (${sql.join(sectionIds.map(id => sql`${id}`), sql`, `)})`)).map(r => r.id);
    const attendance = sessionIds.length
      ? await this.db.select().from(s.sessionAttendance).where(sql`${s.sessionAttendance.classSessionId} IN (${sql.join(sessionIds.map(id => sql`${id}`), sql`, `)})`)
      : [];

    return {
      student: this.mapStudent(student),
      sections: sectionsList.map(this.mapSection),
      enrollments: enrollments.map(this.mapEnrollment),
      attendance: attendance.map(this.mapAttendance),
    };
  }
}

export const drizzleRepository = new DrizzleRepository();
