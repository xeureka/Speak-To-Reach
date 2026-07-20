import type { App } from './types.js';
import { registerActivityLogRoutes } from './routes/activity-log.js';
import { registerAttendanceRoutes } from './routes/attendance.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerClassSessionRoutes } from './routes/class-sessions.js';
import { registerCourseRoutes } from './routes/courses.js';
import { registerDocsRoutes } from './routes/docs.js';
import { registerEnrollmentRoutes } from './routes/enrollments.js';
import { registerImportRoutes } from './routes/import.js';
import { registerPaymentRoutes } from './routes/payments.js';
import { registerReportRoutes } from './routes/reports.js';
import { registerSectionRoutes } from './routes/sections.js';
import { registerStudentRoutes } from './routes/students.js';
import { registerTeacherRoutes } from './routes/teachers.js';

const routeRegistrars = [
  registerAuthRoutes,
  registerTeacherRoutes,
  registerStudentRoutes,
  registerCourseRoutes,
  registerSectionRoutes,
  registerEnrollmentRoutes,
  registerClassSessionRoutes,
  registerAttendanceRoutes,
  registerReportRoutes,
  registerImportRoutes,
  registerActivityLogRoutes,
  registerPaymentRoutes,
  registerDocsRoutes,
];

export function registerRoutes(app: App) {
  for (const registerRoute of routeRegistrars) {
    registerRoute(app);
  }
}
