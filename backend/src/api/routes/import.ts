import { createRoute } from '@hono/zod-openapi';
import { ImportResult } from '../../domain/contracts.js';
import { importController } from '../controllers/import-controller.js';
import type { RouteRegistrar } from '../types.js';

export const registerImportRoutes: RouteRegistrar = (app) => {
  app.openapi(
    createRoute({ method: 'post', path: '/api/import/students', responses: { 200: { content: { 'application/json': { schema: ImportResult } }, description: 'OK' } } }),
    importController.importStudents,
  );
};
