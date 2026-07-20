import { drizzleRepository as repo } from '../../repositories/drizzle.js';

export const teacherService = {
  list: (status?: string) => repo.listTeachers(status),
  create: (data: Record<string, unknown>) => repo.createTeacher(data),
  update: (id: string, data: Record<string, unknown>) => repo.updateTeacher(id, data),
  resetPassword: (id: string) => repo.resetTeacherPassword(id),
  listStudents: (id: string) => repo.listTeacherStudents(id),
  analytics: (id: string) => repo.getTeacherAnalytics(id),
};
