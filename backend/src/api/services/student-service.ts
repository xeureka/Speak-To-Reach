import { drizzleRepository as repo } from '../../repositories/drizzle.js';

export const studentService = {
  list: (filters?: { status?: string; classType?: string; level?: string }) => repo.listStudents(filters),
  create: (data: Record<string, unknown>) => repo.createStudent(data),
  update: (id: string, data: Record<string, unknown>) => repo.updateStudent(id, data),
  studentPage: (id: string) => repo.studentPage(id),
};
