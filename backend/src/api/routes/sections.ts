import { createRoute } from '@hono/zod-openapi';
import { CreateSection, Section, UpdateSection } from '../../domain/contracts.js';
import { sectionController } from '../controllers/section-controller.js';
import { created, ErrorResponse, IdParam } from '../shared.js';
import { SectionListQuery, SectionListResponse } from '../schemas/sections.js';
import type { RouteRegistrar } from '../types.js';

export const registerSectionRoutes: RouteRegistrar = (app) => {
  app.openapi(
    createRoute({ method: 'get', path: '/api/sections', request: { query: SectionListQuery }, responses: { 200: { content: { 'application/json': { schema: SectionListResponse } }, description: 'OK' } } }),
    sectionController.list,
  );

  app.openapi(
    createRoute({ method: 'post', path: '/api/sections', request: { body: { content: { 'application/json': { schema: CreateSection } } } }, responses: created(Section) }),
    sectionController.create,
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/api/sections/{id}',
      request: { params: IdParam },
      responses: { 200: { content: { 'application/json': { schema: Section } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
    }),
    sectionController.get,
  );

  app.openapi(
    createRoute({
      method: 'patch',
      path: '/api/sections/{id}',
      request: { params: IdParam, body: { content: { 'application/json': { schema: UpdateSection } } } },
      responses: { 200: { content: { 'application/json': { schema: Section } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } },
    }),
    sectionController.update,
  );

  app.openapi(
    createRoute({ method: 'post', path: '/api/sections/{id}/end', request: { params: IdParam }, responses: { 200: { content: { 'application/json': { schema: Section } }, description: 'OK' } } }),
    sectionController.end,
  );
};
