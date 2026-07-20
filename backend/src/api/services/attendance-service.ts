import { drizzleRepository as repo } from '../../repositories/drizzle.js';

export const attendanceService = {
  get: (classSessionId: string) => repo.getAttendance(classSessionId),
  submit: (classSessionId: string, entries: Array<{ studentId: string; attendanceStatus: string; notes?: string }>) => repo.submitAttendance(classSessionId, entries),
  logAttendanceMarked: (teacherId: string, classSessionId: string, count: number) => repo.logActivity(teacherId, 'attendance_marked', classSessionId, undefined, `Attendance marked for ${count} students`),
};
