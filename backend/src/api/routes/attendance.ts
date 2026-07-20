import { createRoute, z } from '@hono/zod-openapi';
import { attendanceController } from '../controllers/attendance-controller.js';
import { IdParam, ok } from '../shared.js';
import { AttendanceResponse, SubmitAttendanceBody } from '../schemas/attendance.js';
import type { RouteRegistrar } from '../types.js';

export const registerAttendanceRoutes: RouteRegistrar = (app) => {
  app.openapi(
    createRoute({ method: 'get', path: '/api/class-sessions/{id}/attendance', request: { params: IdParam }, responses: ok(z.array(AttendanceResponse)) }),
    attendanceController.list,
  );

  app.openapi(
    createRoute({ method: 'post', path: '/api/class-sessions/{id}/attendance', request: { params: IdParam, body: { content: { 'application/json': { schema: SubmitAttendanceBody } } } }, responses: { 200: { content: { 'application/json': { schema: z.array(AttendanceResponse) } }, description: 'OK' } } }),
    attendanceController.submit,
  );
};
