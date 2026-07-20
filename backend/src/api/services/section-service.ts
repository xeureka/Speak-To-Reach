import { drizzleRepository as repo } from '../../repositories/drizzle.js';

export const sectionService = {
  list: (filters?: { status?: string; teacherId?: string; classType?: string }) => repo.listSections(filters),
  create: (data: Record<string, unknown>) => repo.createSection(data),
  get: (id: string) => repo.getSection(id),
  update: (id: string, data: Record<string, unknown>) => repo.updateSection(id, data),
  end: (id: string) => repo.endSection(id),
};
