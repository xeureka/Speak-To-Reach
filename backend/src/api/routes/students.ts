import { createRoute } from '@hono/zod-openapi';
import { CreateStudent, Student, UpdateStudent } from '../../domain/contracts.js';
import { studentController } from '../controllers/student-controller.js';
import { ErrorResponse, IdParam, created } from '../shared.js';
import { StudentListQuery, StudentListResponse } from '../schemas/students.js';
import type { RouteRegistrar } from '../types.js';

export const registerStudentRoutes: RouteRegistrar = (app) => {
  app.openapi(
    createRoute({ method: 'get', path: '/api/students', request: { query: StudentListQuery }, responses: { 200: { content: { 'application/json': { schema: StudentListResponse } }, description: 'OK' } } }),
    studentController.list,
  );

  app.openapi(
    createRoute({ method: 'post', path: '/api/students', request: { body: { content: { 'application/json': { schema: CreateStudent } } } }, responses: created(Student) }),
    studentController.create,
  );

  app.openapi(
    createRoute({
      method: 'patch',
      path: '/api/students/{id}',
      request: { params: IdParam, body: { content: { 'application/json': { schema: UpdateStudent } } } },
      responses: { 200: { content: { 'application/json': { schema: Student } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
    }),
    studentController.update,
  );
};
