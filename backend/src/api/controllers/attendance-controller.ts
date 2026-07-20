import { attendanceService } from '../services/attendance-service.js';
import { getUserId } from '../middlewares/auth.js';
import { authService } from '../services/auth-service.js';

export const attendanceController = {
  list: async (c: any) => c.json(await attendanceService.get(c.req.valid('param').id)),
  submit: async (c: any) => {
    const classSessionId = c.req.valid('param').id;
    const { entries } = c.req.valid('json');
    const result = await attendanceService.submit(classSessionId, entries);
    const userId = getUserId(c);
    if (userId) {
      const user = await authService.getUser(userId);
      await attendanceService.logAttendanceMarked(user?.teacherId ?? userId, classSessionId, entries.length);
    }
    return c.json(result, 200);
  },
};
