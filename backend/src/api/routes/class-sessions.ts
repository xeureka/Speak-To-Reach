import { createRoute } from '@hono/zod-openapi';
import { ClassSession, CreateClassSession, UpdateClassSession } from '../../domain/contracts.js';
import { classSessionController } from '../controllers/class-session-controller.js';
import { created, ErrorResponse, IdParam } from '../shared.js';
import { BulkCreateClassSessionsBody, ClassSessionListQuery, ClassSessionListResponse } from '../schemas/class-sessions.js';
import type { RouteRegistrar } from '../types.js';

export const registerClassSessionRoutes: RouteRegistrar = (app) => {
  app.openapi(
    createRoute({ method: 'get', path: '/api/class-sessions', request: { query: ClassSessionListQuery }, responses: { 200: { content: { 'application/json': { schema: ClassSessionListResponse } }, description: 'OK' } } }),
    classSessionController.list,
  );

  app.openapi(
    createRoute({ method: 'post', path: '/api/class-sessions', request: { body: { content: { 'application/json': { schema: CreateClassSession } } } }, responses: created(ClassSession) }),
    classSessionController.create,
  );

  app.openapi(
    createRoute({ method: 'post', path: '/api/class-sessions/bulk', request: { body: { content: { 'application/json': { schema: BulkCreateClassSessionsBody } } } }, responses: created(ClassSession.array()) }),
    classSessionController.bulkCreate,
  );

  app.openapi(
    createRoute({
      method: 'patch',
      path: '/api/class-sessions/{id}',
      request: { params: IdParam, body: { content: { 'application/json': { schema: UpdateClassSession } } } },
      responses: { 200: { content: { 'application/json': { schema: ClassSession } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
    }),
    classSessionController.update,
  );

  app.openapi(
    createRoute({ method: 'post', path: '/api/class-sessions/{id}/complete', request: { params: IdParam }, responses: { 200: { content: { 'application/json': { schema: ClassSession } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } } }),
    classSessionController.complete,
  );
};
