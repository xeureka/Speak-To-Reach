import { z } from '@hono/zod-openapi';
import { Student } from '../../domain/contracts.js';

export const StudentListQuery = z.object({
  status: z.enum(['Active', 'Paused', 'Completed']).optional(),
  classType: z.enum(['Private', 'Mini Group', 'Group']).optional(),
  level: z.enum(['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper Intermediate', 'Advanced']).optional(),
});

export const StudentListResponse = z.array(Student);
