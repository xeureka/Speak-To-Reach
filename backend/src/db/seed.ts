import { getDb, closeDb } from './connection.js';
import {
  users, teachers, students, courses, assignments, sessions, homework, progress,
  teacherPerformance,
} from './schema.js';
import process from 'node:process';

async function seed() {
  const db = getDb();

  console.log('Seeding database...');

  // Clean existing data
  await db.delete(teacherPerformance);
  await db.delete(progress);
  await db.delete(homework);
  await db.delete(sessions);
  await db.delete(assignments);
  await db.delete(students);
  await db.delete(courses);
  await db.delete(teachers);
  await db.delete(users);

  // Users
  await db.insert(users).values([
    { id: 'user-admin', name: 'Admin User', email: 'admin@speaktoreach.local', passwordHash: 'admin123', role: 'admin' },
    { id: 'user-teacher-1', name: 'Maya Tesfaye', email: 'maya@speaktoreach.local', passwordHash: 'teacher123', role: 'teacher', teacherId: 'teacher-1' },
    { id: 'user-teacher-2', name: 'Jonas Bekele', email: 'jonas@speaktoreach.local', passwordHash: 'teacher123', role: 'teacher', teacherId: 'teacher-2' },
  ]);

  // Teachers
  await db.insert(teachers).values([
    { id: 'teacher-1', teacherName: 'Maya Tesfaye', phone: '+251 911 000 101', email: 'maya@speaktoreach.local', status: 'active', hireDate: '2025-09-01', notes: 'Conversation and IELTS specialist.' },
    { id: 'teacher-2', teacherName: 'Jonas Bekele', phone: '+251 911 000 202', email: 'jonas@speaktoreach.local', status: 'active', hireDate: '2026-01-15', notes: 'Beginner and elementary groups.' },
  ]);

  // Courses
  await db.insert(courses).values([
    { id: 'course-1', courseName: 'English Foundations', level: 'Beginner', totalUnits: 8, totalLessons: 32, description: 'Core survival English, grammar basics, and guided speaking.' },
    { id: 'course-2', courseName: 'Confident Conversation', level: 'Intermediate', totalUnits: 10, totalLessons: 40, description: 'Fluency, pronunciation, vocabulary expansion, and discussion practice.' },
  ]);

  // Students
  await db.insert(students).values([
    { id: 'student-1', studentName: 'Sara Ahmed', phone: '+251 922 111 111', email: 'sara@example.com', level: 'Intermediate', classType: 'Private', status: 'Active', registrationDate: '2026-06-20', assignedTeacherId: 'teacher-1', assignedCourseId: 'course-2', notes: 'Prefers evening sessions.' },
    { id: 'student-2', studentName: 'Dawit Alemu', phone: '+251 922 222 222', email: 'dawit@example.com', level: 'Beginner', classType: 'Mini Group', status: 'Active', registrationDate: '2026-07-01', assignedTeacherId: 'teacher-2', assignedCourseId: 'course-1', notes: 'Needs speaking confidence.' },
  ]);

  // Assignments
  await db.insert(assignments).values([
    { id: 'assignment-1', assignmentName: 'Sara - Confident Conversation', teacherId: 'teacher-1', studentId: 'student-1', courseId: 'course-2', days: 'Mon, Wed, Fri', startTime: '18:00', endTime: '19:00', startDate: '2026-06-24', mode: 'Online', status: 'Active' },
    { id: 'assignment-2', assignmentName: 'Beginner Mini Group A', teacherId: 'teacher-2', studentId: 'student-2', courseId: 'course-1', days: 'Tue, Thu', startTime: '17:00', endTime: '18:30', startDate: '2026-07-02', mode: 'Classroom', status: 'Active' },
  ]);

  const today = new Date().toISOString().slice(0, 10);
  await db.insert(sessions).values([
    { id: 'session-1', sessionName: 'Sara - Lesson 7', sessionDate: today, teacherId: 'teacher-1', studentId: 'student-1', assignmentId: 'assignment-1', lessonNumber: 7, lessonTitle: 'Agreeing and disagreeing politely', attendance: 'Present', present: true, absent: false, late: false, cancelled: false, durationMinutes: 60, homeworkGiven: 'Prepare a two-minute opinion answer.', homeworkSubmitted: true, vocabularyCovered: 'opinion phrases, soft disagreement', grammarCovered: 'conditionals review', speakingPractice: 'structured debate', readingPractice: 'short article', writingPractice: 'opinion paragraph', listeningPractice: 'dialogue comprehension', teacherNotes: 'Strong fluency; improve article usage.' },
  ]);

  await db.insert(homework).values([
    { id: 'homework-1', homework: 'Write 10 example sentences using opinion phrases.', studentId: 'student-1', teacherId: 'teacher-1', sessionId: 'session-1', dueDate: today, submitted: false },
  ]);

  await db.insert(progress).values([
    { id: 'progress-1', studentId: 'student-1', teacherId: 'teacher-1', currentUnit: 2, currentLesson: 7, lastLessonDate: today, completionPercentage: '17.5', strengths: 'Good comprehension and confidence.', weaknesses: 'Article accuracy.', recommendedFocus: 'Short accuracy drills before fluency tasks.' },
    { id: 'progress-2', studentId: 'student-2', teacherId: 'teacher-2', currentUnit: 1, currentLesson: 2, lastLessonDate: '2026-07-06', completionPercentage: '6.25', strengths: 'High motivation.', weaknesses: 'Vocabulary recall.', recommendedFocus: 'Daily flashcard review.' },
  ]);

  await db.insert(teacherPerformance).values([
    { id: 'perf-1', teacherId: 'teacher-1', totalAssignedClasses: 1, classesCompleted: 1, attendanceReportsSubmitted: 1, studentAttendancePercentage: '100', homeworkCompletionPercentage: '0' },
    { id: 'perf-2', teacherId: 'teacher-2', totalAssignedClasses: 1, classesCompleted: 0, attendanceReportsSubmitted: 0, studentAttendancePercentage: '0', homeworkCompletionPercentage: '0' },
  ]);

  console.log('Seed complete!');
  await closeDb();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
