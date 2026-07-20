import { drizzleRepository as repo } from '../../repositories/drizzle.js';

export const activityLogService = {
  list: (filters?: { teacherId?: string; startDate?: string; endDate?: string }) => repo.getActivityLog(filters),
};
