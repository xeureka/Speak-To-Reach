import { z } from '@hono/zod-openapi';
import { AttendancePayload } from '../../domain/contracts.js';

export const AttendanceResponse = z.object({ id: z.string(), classSessionId: z.string(), studentId: z.string(), attendanceStatus: z.string(), present: z.boolean(), absent: z.boolean(), late: z.boolean(), cancelled: z.boolean(), notes: z.string().nullable().optional(), createdAt: z.string(), updatedAt: z.string() });
export const SubmitAttendanceBody = z.object({ entries: z.array(AttendancePayload) });
