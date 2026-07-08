import process from 'node:process';
import { serve } from '@hono/node-server';
import app from './index.js';

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Speak To Reach API running on http://localhost:${info.port}`);
  console.log(`OpenAPI document available at http://localhost:${info.port}/openapi.json`);
});
