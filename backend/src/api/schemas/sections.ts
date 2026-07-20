import { z } from '@hono/zod-openapi';
import { Section } from '../../domain/contracts.js';

export const SectionListQuery = z.object({
  status: z.enum(['active', 'inactive', 'completed']).optional(),
  teacherId: z.string().optional(),
  classType: z.enum(['Private', 'Mini Group', 'Group']).optional(),
});

export const SectionListResponse = z.array(Section);
