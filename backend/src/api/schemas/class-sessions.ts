import { z } from '@hono/zod-openapi';
import { ClassSession, CreateClassSession } from '../../domain/contracts.js';

export const ClassSessionListQuery = z.object({
  sectionId: z.string().optional(),
  date: z.string().optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
  teacherId: z.string().optional(),
  view: z.enum(['today']).optional(),
});

export const BulkCreateClassSessionsBody = z.object({ sessions: z.array(CreateClassSession) });
export const ClassSessionListResponse = z.array(ClassSession);
