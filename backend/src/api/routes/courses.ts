import { createRoute, z } from '@hono/zod-openapi';
import { Course, CreateCourse, UpdateCourse } from '../../domain/contracts.js';
import { courseController } from '../controllers/course-controller.js';
import { ErrorResponse, IdParam, created, ok } from '../shared.js';
import type { RouteRegistrar } from '../types.js';

export const registerCourseRoutes: RouteRegistrar = (app) => {
  app.openapi(createRoute({ method: 'get', path: '/api/courses', responses: ok(z.array(Course)) }), courseController.list);

  app.openapi(
    createRoute({ method: 'post', path: '/api/courses', request: { body: { content: { 'application/json': { schema: CreateCourse } } } }, responses: created(Course) }),
    courseController.create,
  );

  app.openapi(
    createRoute({
      method: 'patch',
      path: '/api/courses/{id}',
      request: { params: IdParam, body: { content: { 'application/json': { schema: UpdateCourse } } } },
      responses: { 200: { content: { 'application/json': { schema: Course } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
    }),
    courseController.update,
  );
};
