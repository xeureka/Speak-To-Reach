import { createRoute, z } from '@hono/zod-openapi';
import { activityLogController } from '../controllers/activity-log-controller.js';
import { ok } from '../shared.js';
import { ActivityLogQuery, ActivityLogResponse } from '../schemas/activity-log.js';
import type { RouteRegistrar } from '../types.js';

export const registerActivityLogRoutes: RouteRegistrar = (app) => {
  app.openapi(
    createRoute({ method: 'get', path: '/api/activity-log', request: { query: ActivityLogQuery }, responses: ok(z.array(ActivityLogResponse)) }),
    activityLogController.list,
  );
};
