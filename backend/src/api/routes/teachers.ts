import { createRoute } from '@hono/zod-openapi';
import { CreateTeacher, Teacher, UpdateTeacher } from '../../domain/contracts.js';
import { teacherController } from '../controllers/teacher-controller.js';
import { ErrorResponse, IdParam, created } from '../shared.js';
import { ResetTeacherPasswordResponse, TeacherAnalyticsResponse, TeacherListQuery, TeacherListResponse, TeacherStudentsResponse } from '../schemas/teachers.js';
import type { RouteRegistrar } from '../types.js';

export const registerTeacherRoutes: RouteRegistrar = (app) => {
  app.openapi(
    createRoute({ method: 'get', path: '/api/teachers', request: { query: TeacherListQuery }, responses: { 200: { content: { 'application/json': { schema: TeacherListResponse } }, description: 'OK' } } }),
    teacherController.list,
  );

  app.openapi(
    createRoute({ method: 'post', path: '/api/teachers', request: { body: { content: { 'application/json': { schema: CreateTeacher } } } }, responses: created(Teacher) }),
    teacherController.create,
  );

  app.openapi(
    createRoute({
      method: 'patch',
      path: '/api/teachers/{id}',
      request: { params: IdParam, body: { content: { 'application/json': { schema: UpdateTeacher } } } },
      responses: { 200: { content: { 'application/json': { schema: Teacher } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
    }),
    teacherController.update,
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/teachers/{id}/reset-password',
      request: { params: IdParam },
      responses: { 200: { content: { 'application/json': { schema: ResetTeacherPasswordResponse } }, description: 'Password reset' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
    }),
    teacherController.resetPassword,
  );

  app.openapi(
    createRoute({ method: 'get', path: '/api/teachers/{id}/students', request: { params: IdParam }, responses: { 200: { content: { 'application/json': { schema: TeacherStudentsResponse } }, description: 'OK' } } }),
    teacherController.students,
  );

  app.openapi(
    createRoute({ method: 'get', path: '/api/teachers/{id}/analytics', request: { params: IdParam }, responses: { 200: { content: { 'application/json': { schema: TeacherAnalyticsResponse } }, description: 'Teacher analytics' } } }),
    teacherController.analytics,
  );
};
