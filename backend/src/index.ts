import { handle } from 'hono/vercel';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { loadEnv } from './load-env.js';
import { registerRoutes } from './api/register-routes.js';

loadEnv();

export const app = new OpenAPIHono();
app.use('*', cors());

registerRoutes(app);

export type AppType = typeof app;
export default handle(app);
