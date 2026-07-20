import { z } from '@hono/zod-openapi';

export const ErrorResponse = z.object({ message: z.string() });
export const IdParam = z.object({ id: z.string() });

export const ok = <T extends z.ZodType>(schema: T) => ({
  200: { content: { 'application/json': { schema } }, description: 'OK' },
} as const);

export const created = <T extends z.ZodType>(schema: T) => ({
  201: { content: { 'application/json': { schema } }, description: 'Created' },
} as const);
