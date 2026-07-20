import type { OpenAPIHono } from '@hono/zod-openapi';

export type App = OpenAPIHono;
export type RouteRegistrar = (app: App) => void;
