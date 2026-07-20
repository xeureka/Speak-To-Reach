import { HTTPException } from 'hono/http-exception';
import { courseService } from '../services/course-service.js';

export const courseController = {
  list: async (c: any) => c.json(await courseService.list()),
  create: async (c: any) => c.json(await courseService.create(c.req.valid('json') as Record<string, unknown>), 201),
  update: async (c: any) => {
    const updated = await courseService.update(c.req.valid('param').id, c.req.valid('json') as Record<string, unknown>);
    if (!updated) throw new HTTPException(404, { message: 'Course not found' });
    return c.json(updated, 200);
  },
};
