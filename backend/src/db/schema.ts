import {
  boolean, date, index, integer, jsonb, pgEnum, pgTable, text, time, timestamp, varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

const audit = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
};

export const userRole = pgEnum('user_role', ['admin', 'teacher']);
export const teacherStatus = pgEnum('teacher_status', ['active', 'inactive']);
export const studentLevel = pgEnum('student_level', [
  'Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper Intermediate', 'Advanced',
]);
export const classType = pgEnum('class_type', ['Private', 'Mini Group', 'Group']);
export const studentStatus = pgEnum('student_status', ['Active', 'Paused', 'Completed']);
export const attendanceStatus = pgEnum('attendance_status', ['Present', 'Absent', 'Late', 'Cancelled']);
export const sectionStatus = pgEnum('section_status', ['active', 'inactive', 'completed']);
export const sessionType = pgEnum('session_type', ['private', 'group']);
export const reportStatus = pgEnum('report_status', ['draft', 'submitted']);
export const activityType = pgEnum('activity_type', ['class_taught', 'report_submitted', 'attendance_marked']);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 160 }).notNull(),
  email: varchar('email', { length: 240 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRole('role').notNull().default('teacher'),
  teacherId: text('teacher_id'),
  ...audit,
});

export const teachers = pgTable(
  'teachers',
  {
    id: text('id').primaryKey(),
    teacherName: varchar('teacher_name', { length: 160 }).notNull(),
    phone: varchar('phone', { length: 80 }),
    email: varchar('email', { length: 240 }).notNull().unique(),
    status: teacherStatus('status').notNull().default('active'),
    hireDate: date('hire_date'),
    notes: text('notes'),
    ...audit,
  },
  (table) => [index('teachers_status_idx').on(table.status), index('teachers_email_idx').on(table.email)],
);

export const courses = pgTable(
  'courses',
  {
    id: text('id').primaryKey(),
    courseName: varchar('course_name', { length: 180 }).notNull(),
    level: studentLevel('level').notNull(),
    totalUnits: integer('total_units').notNull(),
    totalLessons: integer('total_lessons').notNull(),
    description: text('description'),
    ...audit,
  },
  (table) => [index('courses_level_idx').on(table.level)],
);

export const students = pgTable(
  'students',
  {
    id: text('id').primaryKey(),
    studentName: varchar('student_name', { length: 160 }).notNull(),
    phone: varchar('phone', { length: 80 }),
    email: varchar('email', { length: 240 }),
    level: studentLevel('level').notNull(),
    classType: classType('class_type').notNull(),
    status: studentStatus('status').notNull().default('Active'),
    registrationDate: date('registration_date').notNull(),
    notes: text('notes'),
    ...audit,
  },
  (table) => [
    index('students_status_idx').on(table.status),
    index('students_class_type_idx').on(table.classType),
    index('students_level_idx').on(table.level),
  ],
);

export const sections = pgTable(
  'sections',
  {
    id: text('id').primaryKey(),
    sectionName: varchar('section_name', { length: 200 }).notNull(),
    classType: classType('class_type').notNull(),
    teacherId: text('teacher_id').notNull().references(() => teachers.id),
    courseId: text('course_id').notNull().references(() => courses.id),
    scheduleDays: varchar('schedule_days', { length: 120 }).notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time'),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    maxStudents: integer('max_students').default(20),
    status: sectionStatus('status').notNull().default('active'),
    notes: text('notes'),
    ...audit,
  },
  (table) => [
    index('sections_teacher_idx').on(table.teacherId),
    index('sections_course_idx').on(table.courseId),
    index('sections_status_idx').on(table.status),
    index('sections_class_type_idx').on(table.classType),
  ],
);

export const enrollments = pgTable(
  'enrollments',
  {
    id: text('id').primaryKey(),
    studentId: text('student_id').notNull().references(() => students.id),
    sectionId: text('section_id').notNull().references(() => sections.id),
    enrollmentDate: date('enrollment_date').notNull().defaultNow(),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    notes: text('notes'),
    ...audit,
  },
  (table) => [
    index('enrollments_student_idx').on(table.studentId),
    index('enrollments_section_idx').on(table.sectionId),
  ],
);

export const classSessions = pgTable(
  'class_sessions',
  {
    id: text('id').primaryKey(),
    sectionId: text('section_id').notNull().references(() => sections.id),
    sessionDate: date('session_date').notNull(),
    sessionNumber: integer('session_number').notNull(),
    lessonTitle: varchar('lesson_title', { length: 240 }),
    lessonNumber: integer('lesson_number'),
    sessionType: sessionType('session_type').notNull(),
    durationMinutes: integer('duration_minutes').default(60),
    status: varchar('status', { length: 20 }).notNull().default('scheduled'),
    teacherNotes: text('teacher_notes'),
    ...audit,
  },
  (table) => [
    index('class_sessions_section_idx').on(table.sectionId),
    index('class_sessions_date_idx').on(table.sessionDate),
    index('class_sessions_status_idx').on(table.status),
  ],
);

export const sessionAttendance = pgTable(
  'session_attendance',
  {
    id: text('id').primaryKey(),
    classSessionId: text('class_session_id').notNull().references(() => classSessions.id),
    studentId: text('student_id').notNull().references(() => students.id),
    attendanceStatus: attendanceStatus('attendance_status').notNull(),
    present: boolean('present').notNull().default(false),
    absent: boolean('absent').notNull().default(false),
    late: boolean('late').notNull().default(false),
    cancelled: boolean('cancelled').notNull().default(false),
    notes: text('notes'),
    ...audit,
  },
  (table) => [
    index('session_attendance_session_idx').on(table.classSessionId),
    index('session_attendance_student_idx').on(table.studentId),
  ],
);

export const sessionReports = pgTable(
  'session_reports',
  {
    id: text('id').primaryKey(),
    classSessionId: text('class_session_id').notNull().references(() => classSessions.id),
    teacherId: text('teacher_id').notNull().references(() => teachers.id),
    reportStatus: reportStatus('report_status').notNull().default('draft'),
    homeworkGiven: text('homework_given'),
    homeworkSubmitted: boolean('homework_submitted').default(false),
    vocabularyCovered: text('vocabulary_covered'),
    grammarCovered: text('grammar_covered'),
    speakingPractice: text('speaking_practice'),
    readingPractice: text('reading_practice'),
    writingPractice: text('writing_practice'),
    listeningPractice: text('listening_practice'),
    generalNotes: text('general_notes'),
    ...audit,
  },
  (table) => [
    index('session_reports_session_idx').on(table.classSessionId),
    index('session_reports_teacher_idx').on(table.teacherId),
  ],
);

export const teacherActivityLog = pgTable(
  'teacher_activity_log',
  {
    id: text('id').primaryKey(),
    teacherId: text('teacher_id').notNull().references(() => teachers.id),
    activityType: activityType('activity_type').notNull(),
    classSessionId: text('class_session_id').references(() => classSessions.id),
    sectionId: text('section_id').references(() => sections.id),
    activityDate: date('activity_date').notNull(),
    description: text('description'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('activity_log_teacher_idx').on(table.teacherId),
    index('activity_log_date_idx').on(table.activityDate),
    index('activity_log_type_idx').on(table.activityType),
  ],
);

export const studentPreferences = pgTable(
  'student_preferences',
  {
    id: text('id').primaryKey(),
    studentId: text('student_id').notNull().references(() => students.id),
    preferredDays: varchar('preferred_days', { length: 120 }),
    preferredTimeStart: time('preferred_time_start'),
    preferredTimeEnd: time('preferred_time_end'),
    preferredClassType: classType('preferred_class_type'),
    preferredTeacherId: text('preferred_teacher_id').references(() => teachers.id),
    notes: text('notes'),
    ...audit,
  },
  (table) => [
    index('student_preferences_student_idx').on(table.studentId),
  ],
);

// ── Relations ─────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one }) => ({
  teacher: one(teachers, { fields: [users.teacherId], references: [teachers.id] }),
}));

export const teachersRelations = relations(teachers, ({ many }) => ({
  sections: many(sections),
  sessions: many(classSessions),
  reports: many(sessionReports),
  activityLog: many(teacherActivityLog),
}));

export const studentsRelations = relations(students, ({ many }) => ({
  enrollments: many(enrollments),
  attendance: many(sessionAttendance),
  preferences: many(studentPreferences),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  sections: many(sections),
}));

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  teacher: one(teachers, { fields: [sections.teacherId], references: [teachers.id] }),
  course: one(courses, { fields: [sections.courseId], references: [courses.id] }),
  enrollments: many(enrollments),
  classSessions: many(classSessions),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(students, { fields: [enrollments.studentId], references: [students.id] }),
  section: one(sections, { fields: [enrollments.sectionId], references: [sections.id] }),
}));

export const classSessionsRelations = relations(classSessions, ({ one, many }) => ({
  section: one(sections, { fields: [classSessions.sectionId], references: [sections.id] }),
  attendance: many(sessionAttendance),
  report: one(sessionReports),
}));

export const sessionAttendanceRelations = relations(sessionAttendance, ({ one }) => ({
  classSession: one(classSessions, { fields: [sessionAttendance.classSessionId], references: [classSessions.id] }),
  student: one(students, { fields: [sessionAttendance.studentId], references: [students.id] }),
}));

export const sessionReportsRelations = relations(sessionReports, ({ one }) => ({
  classSession: one(classSessions, { fields: [sessionReports.classSessionId], references: [classSessions.id] }),
  teacher: one(teachers, { fields: [sessionReports.teacherId], references: [teachers.id] }),
}));

export const teacherActivityLogRelations = relations(teacherActivityLog, ({ one }) => ({
  teacher: one(teachers, { fields: [teacherActivityLog.teacherId], references: [teachers.id] }),
  classSession: one(classSessions, { fields: [teacherActivityLog.classSessionId], references: [classSessions.id] }),
  section: one(sections, { fields: [teacherActivityLog.sectionId], references: [sections.id] }),
}));

export const studentPreferencesRelations = relations(studentPreferences, ({ one }) => ({
  student: one(students, { fields: [studentPreferences.studentId], references: [students.id] }),
  preferredTeacher: one(teachers, { fields: [studentPreferences.preferredTeacherId], references: [teachers.id] }),
}));
