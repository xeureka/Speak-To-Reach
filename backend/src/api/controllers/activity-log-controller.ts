import { activityLogService } from '../services/activity-log-service.js';

export const activityLogController = {
  list: async (c: any) => {
    const q = c.req.valid('query');
    return c.json(await activityLogService.list({ teacherId: q.teacherId, startDate: q.startDate, endDate: q.endDate }));
  },
};
