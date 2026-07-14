import type {
  TeacherDto, StudentDto, CourseDto,
} from '../domain/contracts.js';

type Entity = { id: string; createdAt: string; updatedAt: string };
type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'teacher';
  teacherId?: string;
};

const now = () => new Date().toISOString();
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
  ];

  teachers: TeacherDto[] = [
    { id: 'teacher-1', teacherName: 'Maya Tesfaye', phone: '+251 911 000 101', email: 'maya@speaktoreach.local', status: 'active', hireDate: '2025-09-01', notes: 'Conversation and IELTS specialist.', createdAt: now(), updatedAt: now() },
    { id: 'teacher-2', teacherName: 'Jonas Bekele', phone: '+251 911 000 202', email: 'jonas@speaktoreach.local', status: 'active', hireDate: '2026-01-15', notes: 'Beginner and elementary groups.', createdAt: now(), updatedAt: now() },
  ];

  courses: CourseDto[] = [
    { id: 'course-1', courseName: 'English Foundations', level: 'Beginner', totalUnits: 8, totalLessons: 32, description: 'Core survival English, grammar basics, and guided speaking.', createdAt: now(), updatedAt: now() },
    { id: 'course-2', courseName: 'Confident Conversation', level: 'Intermediate', totalUnits: 10, totalLessons: 40, description: 'Fluency, pronunciation, vocabulary expansion, and discussion practice.', createdAt: now(), updatedAt: now() },
  ];

  students: StudentDto[] = [
    { id: 'student-1', studentName: 'Sara Ahmed', phone: '+251 922 111 111', email: 'sara@example.com', level: 'Intermediate', classType: 'Private', status: 'Active', registrationDate: '2026-06-20', notes: 'Prefers evening sessions.', createdAt: now(), updatedAt: now() },
    { id: 'student-2', studentName: 'Dawit Alemu', phone: '+251 922 222 222', email: 'dawit@example.com', level: 'Beginner', classType: 'Mini Group', status: 'Active', registrationDate: '2026-07-01', notes: 'Needs speaking confidence.', createdAt: now(), updatedAt: now() },
  ];

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

  dashboard(teacherId?: string) {
    return {
      totalActiveSections: 0,
      activeGroupSections: 0,
      activePrivateSections: 0,
      totalActiveTeachers: this.teachers.filter(t => t.status === 'active').length,
      todaysClasses: [],
      recentActivity: [],
      sections: [],
    };
  }
}

export const repository = new MemoryRepository();
