import { swaggerUI } from '@hono/swagger-ui';
import type { RouteRegistrar } from '../types.js';

export const registerDocsRoutes: RouteRegistrar = (app) => {
  app.doc('/openapi.json', {
    openapi: '3.1.0',
    info: {
      title: 'Speak To Reach Management API',
      version: '2.0.0',
      description: 'Typesafe Hono RPC API for sections, attendance, reports, payments, and teacher management.',
    },
  });

  app.get('/api/docs', swaggerUI({ url: '/openapi.json' }));
};
