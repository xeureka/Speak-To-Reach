import { createRoute } from '@hono/zod-openapi';
import { Enrollment } from '../../domain/contracts.js';
import { enrollmentController } from '../controllers/enrollment-controller.js';
import { created, ErrorResponse, IdParam, ok } from '../shared.js';
import { CreateEnrollmentBody, UpdateEnrollmentBody } from '../schemas/enrollments.js';
import type { RouteRegistrar } from '../types.js';

export const registerEnrollmentRoutes: RouteRegistrar = (app) => {
  app.openapi(
    createRoute({ method: 'get', path: '/api/sections/{id}/enrollments', request: { params: IdParam }, responses: ok(Enrollment.array()) }),
    enrollmentController.list,
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/sections/{id}/enrollments',
      request: { params: IdParam, body: { content: { 'application/json': { schema: CreateEnrollmentBody } } } },
      responses: created(Enrollment),
    }),
    enrollmentController.create,
  );

  app.openapi(
    createRoute({
      method: 'patch',
      path: '/api/enrollments/{id}',
      request: { params: IdParam, body: { content: { 'application/json': { schema: UpdateEnrollmentBody } } } },
      responses: { 200: { content: { 'application/json': { schema: Enrollment } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
    }),
    enrollmentController.update,
  );
};
