import { drizzleRepository as repo } from '../../repositories/drizzle.js';

export const enrollmentService = {
  list: (sectionId: string) => repo.listEnrollments(sectionId),
  create: (data: Record<string, unknown>) => repo.createEnrollment(data),
  update: (id: string, data: Record<string, unknown>) => repo.updateEnrollment(id, data),
};
