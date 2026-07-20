import { z } from '@hono/zod-openapi';

export const ActivityLogResponse = z.object({ id: z.string(), teacherId: z.string(), activityType: z.string(), classSessionId: z.string().optional(), sectionId: z.string().optional(), activityDate: z.string(), description: z.string().optional(), metadata: z.record(z.string(), z.unknown()).optional(), createdAt: z.string() });
export const ActivityLogQuery = z.object({ teacherId: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional() });
