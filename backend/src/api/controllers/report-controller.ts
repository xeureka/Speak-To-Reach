import { HTTPException } from 'hono/http-exception';
import { getUserId } from '../middlewares/auth.js';
import { authService } from '../services/auth-service.js';
import { reportService } from '../services/report-service.js';

export const reportController = {
  get: async (c: any) => c.json(await reportService.get(c.req.valid('param').id), 200),
  submit: async (c: any) => {
    const classSessionId = c.req.valid('param').id;
    const userId = getUserId(c);
    const user = userId ? await authService.getUser(userId) : null;
    if (!user) throw new HTTPException(401, { message: 'Unauthorized' });
    const report = await reportService.create(classSessionId, user.teacherId ?? user.id, c.req.valid('json') as Record<string, unknown>);
    await reportService.logSubmitted(user.teacherId ?? user.id, classSessionId);
    if (report.reportStatus === 'submitted') {
      await reportService.creditHoursForSubmittedReport(classSessionId);
    }
    return c.json(report, 200);
  },
  analytics: async (c: any) => {
    const q = c.req.valid('query');
    return c.json(await reportService.analytics(q.teacherId));
  },
  adminDashboard: async (c: any) => c.json(await reportService.dashboard()),
  teacherDashboard: async (c: any) => c.json(await reportService.dashboard(c.req.valid('param').id)),
  page: async (c: any) => {
    const data = await reportService.studentPage(c.req.valid('param').id);
    if (!data) throw new HTTPException(404, { message: 'Student not found' });
    return c.json(data, 200);
  },
};
