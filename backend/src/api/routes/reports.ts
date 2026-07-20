import { createRoute } from '@hono/zod-openapi';
import { CreateSessionReport } from '../../domain/contracts.js';
import { reportController } from '../controllers/report-controller.js';
import { ErrorResponse, IdParam, ok } from '../shared.js';
import { DashboardResponse, ReportResponse, ReportsAnalyticsQuery, ReportsAnalyticsResponse, StudentPageResponse, SubmitReportResponse } from '../schemas/reports.js';
import type { RouteRegistrar } from '../types.js';

export const registerReportRoutes: RouteRegistrar = (app) => {
  app.openapi(
    createRoute({ method: 'get', path: '/api/class-sessions/{id}/report', request: { params: IdParam }, responses: { 200: { content: { 'application/json': { schema: ReportResponse.nullable() } }, description: 'OK' } } }),
    reportController.get,
  );

  app.openapi(
    createRoute({ method: 'post', path: '/api/class-sessions/{id}/report', request: { params: IdParam, body: { content: { 'application/json': { schema: CreateSessionReport } } } }, responses: { 200: { content: { 'application/json': { schema: SubmitReportResponse } }, description: 'OK' } } }),
    reportController.submit,
  );

  app.openapi(
    createRoute({ method: 'get', path: '/api/reports/analytics', request: { query: ReportsAnalyticsQuery }, responses: ok(ReportsAnalyticsResponse) }),
    reportController.analytics,
  );

  app.openapi(createRoute({ method: 'get', path: '/api/reports/admin', responses: ok(DashboardResponse) }), reportController.adminDashboard);

  app.openapi(
    createRoute({ method: 'get', path: '/api/reports/teachers/{id}', request: { params: IdParam }, responses: ok(DashboardResponse) }),
    reportController.teacherDashboard,
  );

  app.openapi(
    createRoute({ method: 'get', path: '/api/reports/students/{id}', request: { params: IdParam }, responses: { 200: { content: { 'application/json': { schema: StudentPageResponse } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } } }),
    reportController.page,
  );
};
