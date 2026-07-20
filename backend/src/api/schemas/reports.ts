import { z } from '@hono/zod-openapi';
import { DashboardData, Enrollment, Section, Student, Teacher } from '../../domain/contracts.js';

export const ReportResponse = z.object({ id: z.string(), classSessionId: z.string(), teacherId: z.string(), reportStatus: z.string(), homeworkGiven: z.string().optional(), homeworkSubmitted: z.boolean().optional(), vocabularyCovered: z.string().optional(), grammarCovered: z.string().optional(), speakingPractice: z.string().optional(), readingPractice: z.string().optional(), writingPractice: z.string().optional(), listeningPractice: z.string().optional(), generalNotes: z.string().optional(), createdAt: z.string(), updatedAt: z.string() });
export const SubmitReportResponse = ReportResponse.pick({ id: true, classSessionId: true, teacherId: true, reportStatus: true });
export const ReportsAnalyticsQuery = z.object({ teacherId: z.string().optional() });
export const ReportsAnalyticsResponse = z.object({
  studentsWithLowAttendance: z.array(Student),
  teachersMissingLessonReports: z.array(Teacher),
  studentsBehindSchedule: z.array(Student),
});
export const StudentPageResponse = z.object({ student: Student, sections: z.array(Section), enrollments: z.array(Enrollment), attendance: z.array(z.any()) });
export const DashboardResponse = DashboardData;
