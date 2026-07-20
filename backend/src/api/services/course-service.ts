import { drizzleRepository as repo } from '../../repositories/drizzle.js';

export const courseService = {
  list: () => repo.listCourses(),
  create: (data: Record<string, unknown>) => repo.createCourse(data),
  update: (id: string, data: Record<string, unknown>) => repo.updateCourse(id, data),
};
