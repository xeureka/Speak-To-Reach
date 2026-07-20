import { drizzleRepository as repo } from '../../repositories/drizzle.js';

export const reportService = {
  get: (classSessionId: string) => repo.getReport(classSessionId),
  create: (classSessionId: string, teacherId: string, data: Record<string, unknown>) => repo.createReport(classSessionId, teacherId, data),
  logSubmitted: (teacherId: string, classSessionId: string) => repo.logActivity(teacherId, 'report_submitted', classSessionId, undefined, 'Session report submitted'),
  creditHoursForSubmittedReport: (classSessionId: string) => repo.creditHoursForReport(classSessionId),
  analytics: (teacherId?: string) => repo.reports(teacherId),
  dashboard: (teacherId?: string) => repo.dashboard(teacherId),
  studentPage: (studentId: string) => repo.studentPage(studentId),
};
