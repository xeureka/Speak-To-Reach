import { z } from '@hono/zod-openapi';

export const Levels = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper Intermediate', 'Advanced'] as const;
export const ClassTypes = ['Private', 'Mini Group', 'Group'] as const;
export const StudentStatuses = ['Active', 'Paused', 'Completed'] as const;
export const TeacherStatuses = ['active', 'inactive'] as const;
export const AttendanceStatuses = ['Present', 'Absent', 'Late', 'Cancelled'] as const;
export const SectionStatuses = ['active', 'inactive', 'completed'] as const;
export const SessionTypes = ['private', 'group'] as const;
export const ReportStatuses = ['draft', 'submitted'] as const;
export const EnrollmentStatuses = ['active', 'withdrawn', 'completed'] as const;
export const SessionStatuses = ['scheduled', 'completed', 'cancelled'] as const;

export const Id = z.string().min(1).openapi({ example: 'teacher-1' });
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).openapi({ example: '2026-07-08' });

// ── Auth ──────────────────────────────────────────────────────────────────────

export const AuthUser = z.object({
  id: Id,
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'teacher']),
  teacherId: Id.optional(),
});

// ── Teacher ───────────────────────────────────────────────────────────────────

export const Teacher = z.object({
  id: Id,
  teacherName: z.string(),
  phone: z.string().optional(),
  email: z.string().email(),
  status: z.enum(TeacherStatuses),
  hireDate: IsoDate.optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const CreateTeacher = Teacher.omit({ id: true, createdAt: true, updatedAt: true }).partial({
  phone: true, hireDate: true, notes: true, status: true,
});
export const UpdateTeacher = CreateTeacher.partial();

// ── Course ────────────────────────────────────────────────────────────────────

export const Course = z.object({
  id: Id,
  courseName: z.string(),
  level: z.enum(Levels),
  totalUnits: z.number().int().positive(),
  totalLessons: z.number().int().positive(),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const CreateCourse = Course.omit({ id: true, createdAt: true, updatedAt: true }).partial({ description: true });
export const UpdateCourse = CreateCourse.partial();

// ── Student ───────────────────────────────────────────────────────────────────

export const Student = z.object({
  id: Id,
  studentName: z.string(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  level: z.enum(Levels),
  classType: z.enum(ClassTypes),
  status: z.enum(StudentStatuses),
  registrationDate: IsoDate,
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const CreateStudent = Student.omit({ id: true, createdAt: true, updatedAt: true }).partial({
  phone: true, email: true, registrationDate: true, notes: true, status: true,
});
export const UpdateStudent = CreateStudent.partial();

// ── Section ───────────────────────────────────────────────────────────────────

export const Section = z.object({
  id: Id,
  sectionName: z.string(),
  classType: z.enum(ClassTypes),
  teacherId: Id,
  courseId: Id,
  scheduleDays: z.string(),
  startTime: z.string(),
  endTime: z.string().optional(),
  startDate: IsoDate,
  endDate: IsoDate.optional(),
  maxStudents: z.number().int().positive().optional(),
  status: z.enum(SectionStatuses),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const CreateSection = Section.omit({ id: true, createdAt: true, updatedAt: true }).partial({
  endTime: true, endDate: true, maxStudents: true, notes: true, status: true,
});
export const UpdateSection = CreateSection.partial();

// ── Enrollment ────────────────────────────────────────────────────────────────

export const Enrollment = z.object({
  id: Id,
  studentId: Id,
  sectionId: Id,
  enrollmentDate: IsoDate,
  status: z.enum(EnrollmentStatuses),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const CreateEnrollment = Enrollment.omit({ id: true, createdAt: true, updatedAt: true }).partial({
  enrollmentDate: true, notes: true, status: true,
});
export const UpdateEnrollment = CreateEnrollment.partial();

// ── Class Session ─────────────────────────────────────────────────────────────

export const ClassSession = z.object({
  id: Id,
  sectionId: Id,
  sessionDate: IsoDate,
  sessionNumber: z.number().int().positive(),
  lessonTitle: z.string().optional(),
  lessonNumber: z.number().int().optional(),
  sessionType: z.enum(SessionTypes),
  durationMinutes: z.number().int().positive().optional(),
  status: z.enum(SessionStatuses),
  teacherNotes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const CreateClassSession = ClassSession.omit({ id: true, createdAt: true, updatedAt: true }).partial({
  lessonTitle: true, lessonNumber: true, durationMinutes: true, teacherNotes: true, status: true,
});
export const UpdateClassSession = CreateClassSession.partial();

// ── Session Attendance ────────────────────────────────────────────────────────

export const SessionAttendance = z.object({
  id: Id,
  classSessionId: Id,
  studentId: Id,
  attendanceStatus: z.enum(AttendanceStatuses),
  present: z.boolean(),
  absent: z.boolean(),
  late: z.boolean(),
  cancelled: z.boolean(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AttendancePayload = z.object({
  studentId: Id,
  attendanceStatus: z.enum(AttendanceStatuses),
  notes: z.string().optional(),
});

// ── Session Report ────────────────────────────────────────────────────────────

export const SessionReport = z.object({
  id: Id,
  classSessionId: Id,
  teacherId: Id,
  reportStatus: z.enum(ReportStatuses),
  homeworkGiven: z.string().optional(),
  homeworkSubmitted: z.boolean().optional(),
  vocabularyCovered: z.string().optional(),
  grammarCovered: z.string().optional(),
  speakingPractice: z.string().optional(),
  readingPractice: z.string().optional(),
  writingPractice: z.string().optional(),
  listeningPractice: z.string().optional(),
  generalNotes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const CreateSessionReport = SessionReport.omit({ id: true, createdAt: true, updatedAt: true, classSessionId: true, teacherId: true }).partial();

// ── Teacher Activity Log ──────────────────────────────────────────────────────

export const TeacherActivityLog = z.object({
  id: Id,
  teacherId: Id,
  activityType: z.enum(['class_taught', 'report_submitted', 'attendance_marked']),
  classSessionId: Id.optional(),
  sectionId: Id.optional(),
  activityDate: IsoDate,
  description: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string(),
});

// ── Student Preference ────────────────────────────────────────────────────────

export const StudentPreference = z.object({
  id: Id,
  studentId: Id,
  preferredDays: z.string().optional(),
  preferredTimeStart: z.string().optional(),
  preferredTimeEnd: z.string().optional(),
  preferredClassType: z.enum(ClassTypes).optional(),
  preferredTeacherId: Id.optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ── Dashboard Data ────────────────────────────────────────────────────────────

export const DashboardData = z.object({
  totalActiveSections: z.number(),
  activeGroupSections: z.number(),
  activePrivateSections: z.number(),
  totalActiveTeachers: z.number(),
  todaysClasses: z.array(ClassSession),
  recentActivity: z.array(ClassSession),
  sections: z.array(Section),
});

// ── Import Result ─────────────────────────────────────────────────────────────

export const ImportResult = z.object({
  imported: z.number(),
  skipped: z.number(),
  errors: z.array(z.object({ row: z.number(), message: z.string() })),
  students: z.array(Student),
});

// ── Payment Summary ───────────────────────────────────────────────────────────

export const PaymentSummary = z.object({
  teacherId: Id,
  teacherName: z.string(),
  classesTaught: z.number(),
  reportsSubmitted: z.number(),
  totalHours: z.number(),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type TeacherDto = z.infer<typeof Teacher>;
export type StudentDto = z.infer<typeof Student>;
export type CourseDto = z.infer<typeof Course>;
export type SectionDto = z.infer<typeof Section>;
export type EnrollmentDto = z.infer<typeof Enrollment>;
export type ClassSessionDto = z.infer<typeof ClassSession>;
export type SessionAttendanceDto = z.infer<typeof SessionAttendance>;
export type SessionReportDto = z.infer<typeof SessionReport>;
export type TeacherActivityLogDto = z.infer<typeof TeacherActivityLog>;
export type StudentPreferenceDto = z.infer<typeof StudentPreference>;
export type AuthUserDto = z.infer<typeof AuthUser>;
