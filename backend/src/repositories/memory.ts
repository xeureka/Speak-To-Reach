import type {
  AssignmentDto,
  CourseDto,
  HomeworkDto,
  ProgressDto,
  SessionDto,
  StudentDto,
  TeacherDto,
  TeacherPerformanceDto,
} from '../domain/contracts.js';

type Entity = { id: string; createdAt: string; updatedAt: string };
type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'student';
  teacherId?: string;
  studentId?: string;
};

const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);
const id = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
const stamp = <T extends object>(value: T): T & Entity => {
  const createdAt = now();
  return { ...value, id: id('rec'), createdAt, updatedAt: createdAt };
};
const updateStamp = <T extends Entity>(value: T, patch: Partial<T>): T => ({ ...value, ...patch, updatedAt: now() });

export class MemoryRepository {
  users: User[] = [
    { id: 'user-admin', name: 'Admin User', email: 'admin@speaktoreach.local', password: 'admin123', role: 'admin' },
    { id: 'user-teacher', name: 'Maya Tesfaye', email: 'maya@speaktoreach.local', password: 'teacher123', role: 'teacher', teacherId: 'teacher-1' },
    { id: 'user-student', name: 'Sara Ahmed', email: 'sara@example.com', password: 'student123', role: 'student', studentId: 'student-1' },
  ];

  teachers: TeacherDto[] = [
    {
      id: 'teacher-1',
      teacherName: 'Maya Tesfaye',
      phone: '+251 911 000 101',
      email: 'maya@speaktoreach.local',
      status: 'active',
      hireDate: '2025-09-01',
      notes: 'Conversation and IELTS specialist.',
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'teacher-2',
      teacherName: 'Jonas Bekele',
      phone: '+251 911 000 202',
      email: 'jonas@speaktoreach.local',
      status: 'active',
      hireDate: '2026-01-15',
      notes: 'Beginner and elementary groups.',
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  courses: CourseDto[] = [
    {
      id: 'course-1',
      courseName: 'English Foundations',
      level: 'Beginner',
      totalUnits: 8,
      totalLessons: 32,
      description: 'Core survival English, grammar basics, and guided speaking.',
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'course-2',
      courseName: 'Confident Conversation',
      level: 'Intermediate',
      totalUnits: 10,
      totalLessons: 40,
      description: 'Fluency, pronunciation, vocabulary expansion, and discussion practice.',
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  students: StudentDto[] = [
    {
      id: 'student-1',
      studentName: 'Sara Ahmed',
      phone: '+251 922 111 111',
      email: 'sara@example.com',
      level: 'Intermediate',
      classType: 'Private',
      status: 'Active',
      registrationDate: '2026-06-20',
      assignedTeacherId: 'teacher-1',
      assignedCourseId: 'course-2',
      notes: 'Prefers evening sessions.',
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'student-2',
      studentName: 'Dawit Alemu',
      phone: '+251 922 222 222',
      email: 'dawit@example.com',
      level: 'Beginner',
      classType: 'Mini Group',
      status: 'Active',
      registrationDate: '2026-07-01',
      assignedTeacherId: 'teacher-2',
      assignedCourseId: 'course-1',
      notes: 'Needs speaking confidence.',
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  assignments: AssignmentDto[] = [
    {
      id: 'assignment-1',
      assignmentName: 'Sara - Confident Conversation',
      teacherId: 'teacher-1',
      studentId: 'student-1',
      courseId: 'course-2',
      days: 'Mon, Wed, Fri',
      startTime: '18:00',
      endTime: '19:00',
      startDate: '2026-06-24',
      mode: 'Online',
      status: 'Active',
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'assignment-2',
      assignmentName: 'Beginner Mini Group A',
      teacherId: 'teacher-2',
      studentId: 'student-2',
      courseId: 'course-1',
      days: 'Tue, Thu',
      startTime: '17:00',
      endTime: '18:30',
      startDate: '2026-07-02',
      mode: 'Classroom',
      status: 'Active',
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  sessions: SessionDto[] = [
    {
      id: 'session-1',
      sessionName: 'Sara - Lesson 7',
      sessionDate: today(),
      teacherId: 'teacher-1',
      studentId: 'student-1',
      assignmentId: 'assignment-1',
      lessonNumber: 7,
      lessonTitle: 'Agreeing and disagreeing politely',
      attendance: 'Present',
      present: true,
      absent: false,
      late: false,
      cancelled: false,
      durationMinutes: 60,
      homeworkGiven: 'Prepare a two-minute opinion answer.',
      homeworkSubmitted: true,
      vocabularyCovered: 'opinion phrases, soft disagreement',
      grammarCovered: 'conditionals review',
      speakingPractice: 'structured debate',
      readingPractice: 'short article',
      writingPractice: 'opinion paragraph',
      listeningPractice: 'dialogue comprehension',
      teacherNotes: 'Strong fluency; improve article usage.',
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  homework: HomeworkDto[] = [
    {
      id: 'homework-1',
      homework: 'Write 10 example sentences using opinion phrases.',
      studentId: 'student-1',
      teacherId: 'teacher-1',
      sessionId: 'session-1',
      dueDate: today(),
      submitted: false,
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  progress: ProgressDto[] = [
    {
      id: 'progress-1',
      studentId: 'student-1',
      teacherId: 'teacher-1',
      currentUnit: 2,
      currentLesson: 7,
      lastLessonDate: today(),
      completionPercentage: 17.5,
      strengths: 'Good comprehension and confidence.',
      weaknesses: 'Article accuracy.',
      recommendedFocus: 'Short accuracy drills before fluency tasks.',
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'progress-2',
      studentId: 'student-2',
      teacherId: 'teacher-2',
      currentUnit: 1,
      currentLesson: 2,
      lastLessonDate: '2026-07-06',
      completionPercentage: 6.25,
      strengths: 'High motivation.',
      weaknesses: 'Vocabulary recall.',
      recommendedFocus: 'Daily flashcard review.',
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  login(email: string, password: string) {
    return this.users.find((user) => user.email === email && user.password === password);
  }

  getMe(userId = 'user-admin') {
    return this.users.find((user) => user.id === userId) ?? this.users[0]!;
  }

  list<T>(items: T[], predicate: (item: T) => boolean = () => true) {
    return items.filter(predicate);
  }

  create<T extends Entity>(items: T[], value: Omit<T, keyof Entity>) {
    const next = stamp(value) as T;
    items.unshift(next);
    return next;
  }

  update<T extends Entity>(items: T[], recordId: string, patch: Partial<T>) {
    const index = items.findIndex((item) => item.id === recordId);
    if (index === -1) return undefined;
    const next = updateStamp(items[index]!, patch);
    items[index] = next;
    return next;
  }

  endAssignment(recordId: string) {
    return this.update(this.assignments, recordId, { status: 'Ended', endDate: today() });
  }

  performance(teacherId?: string): TeacherPerformanceDto[] {
    return this.teachers
      .filter((teacher) => !teacherId || teacher.id === teacherId)
      .map((teacher) => {
        const teacherAssignments = this.assignments.filter((assignment) => assignment.teacherId === teacher.id);
        const teacherSessions = this.sessions.filter((session) => session.teacherId === teacher.id);
        const attended = teacherSessions.filter((session) => session.present || session.late).length;
        const teacherHomework = this.homework.filter((item) => item.teacherId === teacher.id);
        const submittedHomework = teacherHomework.filter((item) => item.submitted).length;
        return {
          teacherId: teacher.id,
          teacherName: teacher.teacherName,
          totalAssignedClasses: teacherAssignments.length,
          classesCompleted: teacherSessions.length,
          attendanceReportsSubmitted: teacherSessions.length,
          studentAttendancePercentage: teacherSessions.length ? Math.round((attended / teacherSessions.length) * 100) : 0,
          homeworkCompletionPercentage: teacherHomework.length ? Math.round((submittedHomework / teacherHomework.length) * 100) : 0,
          notes: teacher.notes,
        };
      });
  }

  reports(teacherId?: string) {
    const scopedSessions = this.sessions.filter((session) => !teacherId || session.teacherId === teacherId);
    const lowAttendanceStudentIds = new Set(
      this.students
        .filter((student) => {
          const studentSessions = scopedSessions.filter((session) => session.studentId === student.id);
          if (studentSessions.length < 2) return false;
          const attended = studentSessions.filter((session) => session.present || session.late).length;
          return attended / studentSessions.length < 0.75;
        })
        .map((student) => student.id),
    );
    const reportedTeacherIds = new Set(scopedSessions.filter((session) => session.sessionDate === today()).map((session) => session.teacherId));
    const behindStudentIds = new Set(this.progress.filter((item) => item.completionPercentage < 15).map((item) => item.studentId));
    return {
      studentsWithLowAttendance: this.students.filter((student) => lowAttendanceStudentIds.has(student.id)),
      teachersMissingLessonReports: this.teachers.filter((teacher) => teacher.status === 'active' && !reportedTeacherIds.has(teacher.id)),
      studentsBehindSchedule: this.students.filter((student) => behindStudentIds.has(student.id)),
    };
  }

  dashboard(teacherId?: string) {
    const teacherFilter = <T extends { teacherId?: string; assignedTeacherId?: string }>(item: T) =>
      !teacherId || item.teacherId === teacherId || item.assignedTeacherId === teacherId;
    return {
      todayClasses: this.assignments.filter((item) => item.status === 'Active' && teacherFilter(item)),
      todayAttendance: this.sessions.filter((item) => item.sessionDate === today() && teacherFilter(item)),
      upcomingClasses: this.assignments.filter((item) => ['Active', 'Upcoming'].includes(item.status) && teacherFilter(item)).slice(0, 8),
      recentLessonReports: this.sessions.filter(teacherFilter).slice(0, 8),
      teacherPerformance: this.performance(teacherId),
      studentProgress: this.progress.filter(teacherFilter).slice(0, 8),
      homeworkPending: this.homework.filter((item) => !item.submitted && teacherFilter(item)).slice(0, 8),
      recentlyRegisteredStudents: this.students.filter(teacherFilter).slice(0, 8),
      reports: this.reports(teacherId),
    };
  }
}

export const repository = new MemoryRepository();
