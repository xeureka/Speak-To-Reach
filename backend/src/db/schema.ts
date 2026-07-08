import {
  boolean, date, index, integer, numeric, pgEnum, pgTable, text, time, timestamp, varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

const audit = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
};

export const userRole = pgEnum('user_role', ['admin', 'teacher', 'student']);
export const teacherStatus = pgEnum('teacher_status', ['active', 'inactive']);
export const studentLevel = pgEnum('student_level', [
  'Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper Intermediate', 'Advanced',
]);
export const classType = pgEnum('class_type', ['Private', 'Mini Group']);
export const studentStatus = pgEnum('student_status', ['Active', 'Paused', 'Completed']);
export const assignmentStatus = pgEnum('assignment_status', ['Active', 'Upcoming', 'Ended', 'Cancelled']);
export const deliveryMode = pgEnum('delivery_mode', ['Classroom', 'Online']);
export const attendanceStatus = pgEnum('attendance_status', ['Present', 'Absent', 'Late', 'Cancelled']);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 160 }).notNull(),
  email: varchar('email', { length: 240 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRole('role').notNull().default('teacher'),
  teacherId: text('teacher_id'),
  studentId: text('student_id'),
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
    assignedTeacherId: text('assigned_teacher_id').references(() => teachers.id),
    assignedCourseId: text('assigned_course_id').references(() => courses.id),
    notes: text('notes'),
    ...audit,
  },
  (table) => [
    index('students_status_idx').on(table.status),
    index('students_class_type_idx').on(table.classType),
    index('students_level_idx').on(table.level),
    index('students_teacher_idx').on(table.assignedTeacherId),
    index('students_course_idx').on(table.assignedCourseId),
  ],
);

export const assignments = pgTable(
  'assignments',
  {
    id: text('id').primaryKey(),
    assignmentName: varchar('assignment_name', { length: 220 }).notNull(),
    teacherId: text('teacher_id').notNull().references(() => teachers.id),
    studentId: text('student_id').notNull().references(() => students.id),
    courseId: text('course_id').notNull().references(() => courses.id),
    days: varchar('days', { length: 120 }).notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time'),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    mode: deliveryMode('mode').notNull(),
    status: assignmentStatus('status').notNull().default('Active'),
    ...audit,
  },
  (table) => [
    index('assignments_teacher_idx').on(table.teacherId),
    index('assignments_student_idx').on(table.studentId),
    index('assignments_course_idx').on(table.courseId),
    index('assignments_status_idx').on(table.status),
  ],
);

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    sessionName: varchar('session_name', { length: 240 }).notNull(),
    sessionDate: date('session_date').notNull(),
    teacherId: text('teacher_id').notNull().references(() => teachers.id),
    studentId: text('student_id').notNull().references(() => students.id),
    assignmentId: text('assignment_id').notNull().references(() => assignments.id),
    lessonNumber: integer('lesson_number').notNull(),
    lessonTitle: varchar('lesson_title', { length: 240 }).notNull(),
    attendance: attendanceStatus('attendance').notNull(),
    present: boolean('present').notNull().default(false),
    absent: boolean('absent').notNull().default(false),
    late: boolean('late').notNull().default(false),
    cancelled: boolean('cancelled').notNull().default(false),
    durationMinutes: integer('duration_minutes'),
    homeworkGiven: text('homework_given'),
    homeworkSubmitted: boolean('homework_submitted').notNull().default(false),
    vocabularyCovered: text('vocabulary_covered'),
    grammarCovered: text('grammar_covered'),
    speakingPractice: text('speaking_practice'),
    readingPractice: text('reading_practice'),
    writingPractice: text('writing_practice'),
    listeningPractice: text('listening_practice'),
    teacherNotes: text('teacher_notes'),
    ...audit,
  },
  (table) => [
    index('sessions_teacher_date_idx').on(table.teacherId, table.sessionDate),
    index('sessions_student_date_idx').on(table.studentId, table.sessionDate),
    index('sessions_assignment_idx').on(table.assignmentId),
    index('sessions_attendance_idx').on(table.attendance),
    index('sessions_date_idx').on(table.sessionDate),
  ],
);

export const homework = pgTable(
  'homework',
  {
    id: text('id').primaryKey(),
    homework: text('homework').notNull(),
    studentId: text('student_id').notNull().references(() => students.id),
    teacherId: text('teacher_id').notNull().references(() => teachers.id),
    sessionId: text('session_id').references(() => sessions.id),
    dueDate: date('due_date').notNull(),
    submitted: boolean('submitted').notNull().default(false),
    score: numeric('score', { precision: 5, scale: 2 }),
    feedback: text('feedback'),
    ...audit,
  },
  (table) => [
    index('homework_student_idx').on(table.studentId),
    index('homework_teacher_idx').on(table.teacherId),
    index('homework_due_idx').on(table.dueDate),
    index('homework_submitted_idx').on(table.submitted),
  ],
);

export const progress = pgTable(
  'progress',
  {
    id: text('id').primaryKey(),
    studentId: text('student_id').notNull().references(() => students.id),
    teacherId: text('teacher_id').notNull().references(() => teachers.id),
    currentUnit: integer('current_unit').notNull().default(1),
    currentLesson: integer('current_lesson').notNull().default(1),
    lastLessonDate: date('last_lesson_date'),
    completionPercentage: numeric('completion_percentage', { precision: 5, scale: 2 }).notNull().default('0'),
    strengths: text('strengths'),
    weaknesses: text('weaknesses'),
    recommendedFocus: text('recommended_focus'),
    manualOverrideReason: text('manual_override_reason'),
    ...audit,
  },
  (table) => [
    index('progress_student_idx').on(table.studentId),
    index('progress_teacher_idx').on(table.teacherId),
  ],
);

export const teacherPerformance = pgTable(
  'teacher_performance',
  {
    id: text('id').primaryKey(),
    teacherId: text('teacher_id').notNull().references(() => teachers.id),
    totalAssignedClasses: integer('total_assigned_classes').notNull().default(0),
    classesCompleted: integer('classes_completed').notNull().default(0),
    attendanceReportsSubmitted: integer('attendance_reports_submitted').notNull().default(0),
    studentAttendancePercentage: numeric('student_attendance_percentage', { precision: 5, scale: 2 }).notNull().default('0'),
    homeworkCompletionPercentage: numeric('homework_completion_percentage', { precision: 5, scale: 2 }).notNull().default('0'),
    notes: text('notes'),
    ...audit,
  },
  (table) => [index('teacher_performance_teacher_idx').on(table.teacherId)],
);

export const teachersRelations = relations(teachers, ({ many }) => ({
  students: many(students),
  assignments: many(assignments),
  sessions: many(sessions),
  homework: many(homework),
  progress: many(progress),
  performance: many(teacherPerformance),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  assignedTeacher: one(teachers, { fields: [students.assignedTeacherId], references: [teachers.id] }),
  assignedCourse: one(courses, { fields: [students.assignedCourseId], references: [courses.id] }),
  assignments: many(assignments),
  sessions: many(sessions),
  homework: many(homework),
  progress: many(progress),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  students: many(students),
  assignments: many(assignments),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  teacher: one(teachers, { fields: [assignments.teacherId], references: [teachers.id] }),
  student: one(students, { fields: [assignments.studentId], references: [students.id] }),
  course: one(courses, { fields: [assignments.courseId], references: [courses.id] }),
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  teacher: one(teachers, { fields: [sessions.teacherId], references: [teachers.id] }),
  student: one(students, { fields: [sessions.studentId], references: [students.id] }),
  assignment: one(assignments, { fields: [sessions.assignmentId], references: [assignments.id] }),
  homework: many(homework),
}));

export const homeworkRelations = relations(homework, ({ one }) => ({
  student: one(students, { fields: [homework.studentId], references: [students.id] }),
  teacher: one(teachers, { fields: [homework.teacherId], references: [teachers.id] }),
  session: one(sessions, { fields: [homework.sessionId], references: [sessions.id] }),
}));

export const progressRelations = relations(progress, ({ one }) => ({
  student: one(students, { fields: [progress.studentId], references: [students.id] }),
  teacher: one(teachers, { fields: [progress.teacherId], references: [teachers.id] }),
}));

export const teacherPerformanceRelations = relations(teacherPerformance, ({ one }) => ({
  teacher: one(teachers, { fields: [teacherPerformance.teacherId], references: [teachers.id] }),
}));
