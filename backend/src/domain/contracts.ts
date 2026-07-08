import { z } from '@hono/zod-openapi';

export const Levels = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper Intermediate', 'Advanced'] as const;
export const ClassTypes = ['Private', 'Mini Group', 'Group'] as const;
export const StudentStatuses = ['Active', 'Paused', 'Completed'] as const;
export const TeacherStatuses = ['active', 'inactive'] as const;
export const AssignmentStatuses = ['Active', 'Upcoming', 'Ended', 'Cancelled'] as const;
export const AttendanceStatuses = ['Present', 'Absent', 'Late', 'Cancelled'] as const;

export const Id = z.string().min(1).openapi({ example: 'teacher-1' });
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).openapi({ example: '2026-07-08' });

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
  phone: true,
  hireDate: true,
  notes: true,
  status: true,
});
export const UpdateTeacher = CreateTeacher.partial();

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

export const Student = z.object({
  id: Id,
  studentName: z.string(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  level: z.enum(Levels),
  classType: z.enum(ClassTypes),
  status: z.enum(StudentStatuses),
  registrationDate: IsoDate,
  assignedTeacherId: Id.optional(),
  assignedCourseId: Id.optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const CreateStudent = Student.omit({ id: true, createdAt: true, updatedAt: true }).partial({
  phone: true,
  email: true,
  assignedTeacherId: true,
  assignedCourseId: true,
  notes: true,
  status: true,
});
export const UpdateStudent = CreateStudent.partial();

export const Assignment = z.object({
  id: Id,
  assignmentName: z.string(),
  teacherId: Id,
  studentId: Id,
  courseId: Id,
  days: z.string(),
  startTime: z.string(),
  endTime: z.string().optional(),
  startDate: IsoDate,
  endDate: IsoDate.optional(),
  mode: z.enum(['Classroom', 'Online']),
  status: z.enum(AssignmentStatuses),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const CreateAssignment = Assignment.omit({ id: true, createdAt: true, updatedAt: true }).partial({
  endTime: true,
  endDate: true,
  status: true,
});
export const UpdateAssignment = CreateAssignment.partial();

export const Session = z.object({
  id: Id,
  sessionName: z.string(),
  sessionDate: IsoDate,
  teacherId: Id,
  studentId: Id,
  assignmentId: Id,
  lessonNumber: z.number().int().positive(),
  lessonTitle: z.string(),
  attendance: z.enum(AttendanceStatuses),
  present: z.boolean(),
  absent: z.boolean(),
  late: z.boolean(),
  cancelled: z.boolean(),
  durationMinutes: z.number().int().positive().optional(),
  homeworkGiven: z.string().optional(),
  homeworkSubmitted: z.boolean(),
  vocabularyCovered: z.string().optional(),
  grammarCovered: z.string().optional(),
  speakingPractice: z.string().optional(),
  readingPractice: z.string().optional(),
  writingPractice: z.string().optional(),
  listeningPractice: z.string().optional(),
  teacherNotes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const CreateSessionBase = Session.omit({ id: true, createdAt: true, updatedAt: true })
  .partial({
    present: true,
    absent: true,
    late: true,
    cancelled: true,
    durationMinutes: true,
    homeworkGiven: true,
    vocabularyCovered: true,
    grammarCovered: true,
    speakingPractice: true,
    readingPractice: true,
    writingPractice: true,
    listeningPractice: true,
    teacherNotes: true,
  });

const validateAttendance = (value: z.infer<typeof CreateSessionBase>, ctx: z.RefinementCtx) => {
  const flags = {
    Present: Boolean(value.present),
    Absent: Boolean(value.absent),
    Late: Boolean(value.late),
    Cancelled: Boolean(value.cancelled),
  };
  if (value.attendance === 'Cancelled') {
    if (value.present || value.absent || value.late) {
      ctx.addIssue({ code: 'custom', message: 'Cancelled sessions cannot also be present, absent, or late.' });
    }
    return;
  }
  if (!flags[value.attendance]) {
    ctx.addIssue({ code: 'custom', message: `The ${value.attendance.toLowerCase()} flag must match attendance.` });
  }
};

export const CreateSession = CreateSessionBase.superRefine(validateAttendance);
export const UpdateSession = CreateSessionBase.partial();

export const Homework = z.object({
  id: Id,
  homework: z.string(),
  studentId: Id,
  teacherId: Id,
  sessionId: Id.optional(),
  dueDate: IsoDate,
  submitted: z.boolean(),
  score: z.number().min(0).max(100).optional(),
  feedback: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const CreateHomework = Homework.omit({ id: true, createdAt: true, updatedAt: true }).partial({
  sessionId: true,
  submitted: true,
  score: true,
  feedback: true,
});
export const UpdateHomework = CreateHomework.partial();

export const Progress = z.object({
  id: Id,
  studentId: Id,
  teacherId: Id,
  currentUnit: z.number().int().positive(),
  currentLesson: z.number().int().positive(),
  lastLessonDate: IsoDate.optional(),
  completionPercentage: z.number().min(0).max(100),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  recommendedFocus: z.string().optional(),
  manualOverrideReason: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const UpdateProgress = Progress.omit({ id: true, createdAt: true, updatedAt: true })
  .partial()
  .extend({ manualOverrideReason: z.string().min(3) });

export const TeacherPerformance = z.object({
  teacherId: Id,
  teacherName: z.string(),
  totalAssignedClasses: z.number(),
  classesCompleted: z.number(),
  attendanceReportsSubmitted: z.number(),
  studentAttendancePercentage: z.number(),
  homeworkCompletionPercentage: z.number(),
  notes: z.string().optional(),
});

export const AuthUser = z.object({
  id: Id,
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'teacher', 'student']),
  teacherId: Id.optional(),
  studentId: Id.optional(),
});

export const DashboardData = z.object({
  todayClasses: z.array(Assignment),
  todayAttendance: z.array(Session),
  upcomingClasses: z.array(Assignment),
  recentLessonReports: z.array(Session),
  teacherPerformance: z.array(TeacherPerformance),
  studentProgress: z.array(Progress),
  homeworkPending: z.array(Homework),
  recentlyRegisteredStudents: z.array(Student),
  reports: z.object({
    studentsWithLowAttendance: z.array(Student),
    teachersMissingLessonReports: z.array(Teacher),
    studentsBehindSchedule: z.array(Student),
  }),
});

export type TeacherDto = z.infer<typeof Teacher>;
export type StudentDto = z.infer<typeof Student>;
export type CourseDto = z.infer<typeof Course>;
export type AssignmentDto = z.infer<typeof Assignment>;
export type SessionDto = z.infer<typeof Session>;
export type HomeworkDto = z.infer<typeof Homework>;
export type ProgressDto = z.infer<typeof Progress>;
export type TeacherPerformanceDto = z.infer<typeof TeacherPerformance>;
