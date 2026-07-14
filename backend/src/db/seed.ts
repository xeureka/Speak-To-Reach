import { getDb, closeDb } from './connection.js';
import {
  users, teachers, students, courses, sections, enrollments, classSessions, sessionAttendance, sessionReports, teacherActivityLog,
} from './schema.js';
import process from 'node:process';
import bcrypt from 'bcryptjs';
import { loadEnv } from '../load-env.js';
loadEnv();

async function seed() {
  const db = getDb();
  console.log('Seeding database...');

  await db.delete(teacherActivityLog);
  await db.delete(sessionReports);
  await db.delete(sessionAttendance);
  await db.delete(classSessions);
  await db.delete(enrollments);
  await db.delete(sections);
  await db.delete(students);
  await db.delete(courses);
  await db.delete(teachers);
  await db.delete(users);

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  await db.insert(users).values([
    { id: 'user-admin', name: 'Admin User', email: 'admin@speaktoreach.local', passwordHash: hash('admin123'), role: 'admin' },
    { id: 'user-teacher-1', name: 'Maya Tesfaye', email: 'maya@speaktoreach.local', passwordHash: hash('teacher123'), role: 'teacher', teacherId: 'teacher-1' },
    { id: 'user-teacher-2', name: 'Jonas Bekele', email: 'jonas@speaktoreach.local', passwordHash: hash('teacher123'), role: 'teacher', teacherId: 'teacher-2' },
  ]);

  await db.insert(teachers).values([
    { id: 'teacher-1', teacherName: 'Maya Tesfaye', phone: '+251 911 000 101', email: 'maya@speaktoreach.local', status: 'active', hireDate: '2025-09-01', notes: 'Conversation and IELTS specialist.' },
    { id: 'teacher-2', teacherName: 'Jonas Bekele', phone: '+251 911 000 202', email: 'jonas@speaktoreach.local', status: 'active', hireDate: '2026-01-15', notes: 'Beginner and elementary groups.' },
  ]);

  await db.insert(courses).values([
    { id: 'course-1', courseName: 'English Foundations', level: 'Beginner', totalUnits: 8, totalLessons: 32, description: 'Core survival English, grammar basics, and guided speaking.' },
    { id: 'course-2', courseName: 'Confident Conversation', level: 'Intermediate', totalUnits: 10, totalLessons: 40, description: 'Fluency, pronunciation, vocabulary expansion, and discussion practice.' },
  ]);

  await db.insert(students).values([
    { id: 'student-1', studentName: 'Sara Ahmed', phone: '+251 922 111 111', email: 'sara@example.com', level: 'Intermediate', classType: 'Private', status: 'Active', registrationDate: '2026-06-20', notes: 'Prefers evening sessions.' },
    { id: 'student-2', studentName: 'Dawit Alemu', phone: '+251 922 222 222', email: 'dawit@example.com', level: 'Beginner', classType: 'Group', status: 'Active', registrationDate: '2026-07-01', notes: 'Needs speaking confidence.' },
  ]);

  await db.insert(sections).values([
    { id: 'section-1', sectionName: 'Sara Private - Confident Conversation', classType: 'Private', teacherId: 'teacher-1', courseId: 'course-2', scheduleDays: 'Mon,Wed,Fri', startTime: '18:00', endTime: '19:00', startDate: '2026-06-24', maxStudents: 1, status: 'active' },
    { id: 'section-2', sectionName: 'Beginner Group A', classType: 'Group', teacherId: 'teacher-2', courseId: 'course-1', scheduleDays: 'Tue,Thu', startTime: '17:00', endTime: '18:30', startDate: '2026-07-02', maxStudents: 20, status: 'active' },
  ]);

  const today = new Date().toISOString().slice(0, 10);
  await db.insert(enrollments).values([
    { id: 'enr-1', studentId: 'student-1', sectionId: 'section-1', enrollmentDate: '2026-06-24', status: 'active' },
    { id: 'enr-2', studentId: 'student-2', sectionId: 'section-2', enrollmentDate: '2026-07-02', status: 'active' },
  ]);

  await db.insert(classSessions).values([
    { id: 'cs-1', sectionId: 'section-1', sessionDate: today, sessionNumber: 1, lessonNumber: 7, lessonTitle: 'Agreeing and disagreeing politely', sessionType: 'private', durationMinutes: 60, status: 'completed', teacherNotes: 'Strong fluency; improve article usage.' },
  ]);

  await db.insert(sessionAttendance).values([
    { id: 'att-1', classSessionId: 'cs-1', studentId: 'student-1', attendanceStatus: 'Present', present: true, absent: false, late: false, cancelled: false },
  ]);

  await db.insert(sessionReports).values([
    { id: 'rep-1', classSessionId: 'cs-1', teacherId: 'teacher-1', reportStatus: 'submitted', homeworkGiven: 'Prepare a two-minute opinion answer.', vocabularyCovered: 'opinion phrases, soft disagreement', grammarCovered: 'conditionals review', generalNotes: 'Strong fluency; improve article usage.' },
  ]);

  console.log('Seed complete!');
  await closeDb();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
