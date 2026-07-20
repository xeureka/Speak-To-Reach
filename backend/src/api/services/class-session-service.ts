import { drizzleRepository as repo } from '../../repositories/drizzle.js';

export const classSessionService = {
  list: (filters?: { sectionId?: string; date?: string; status?: string; teacherId?: string; todayOnly?: boolean }) => repo.listClassSessions(filters),
  create: (data: Record<string, unknown>) => repo.createClassSession(data),
  bulkCreate: (sessions: Array<Record<string, unknown>>) => repo.bulkCreateClassSessions(sessions),
  update: (id: string, data: Record<string, unknown>) => repo.updateClassSession(id, data),
  complete: (id: string) => repo.updateClassSession(id, { status: 'completed' }),
};
