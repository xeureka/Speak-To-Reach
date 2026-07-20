import { z } from '@hono/zod-openapi';
import { Student, Teacher } from '../../domain/contracts.js';

export const TeacherListQuery = z.object({ status: z.enum(['active', 'inactive']).optional() });
export const ResetTeacherPasswordResponse = z.object({ email: z.string(), password: z.string() });
export const TeacherAnalyticsResponse = z.object({
  totalSections: z.number(),
  privateSections: z.number(),
  groupSections: z.number(),
  privateSectionNames: z.array(z.string()),
  groupSectionNames: z.array(z.string()),
  monthSessionsTotal: z.number(),
  monthSessionsCompleted: z.number(),
  monthHoursTotal: z.number(),
  totalStudents: z.number(),
  reportsSubmitted: z.number(),
  reportsDraft: z.number(),
  totalSessionsEver: z.number(),
  recentSessions: z.array(z.any()),
});
export const TeacherStudentsResponse = z.array(Student);
export const TeacherListResponse = z.array(Teacher);
