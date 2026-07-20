import { HTTPException } from 'hono/http-exception';
import { enrollmentService } from '../services/enrollment-service.js';

export const enrollmentController = {
  list: async (c: any) => c.json(await enrollmentService.list(c.req.valid('param').id)),
  create: async (c: any) => {
    const sectionId = c.req.valid('param').id;
    const body = c.req.valid('json');
    const createdEnrollment = await enrollmentService.create({ ...body, sectionId });
    return c.json(createdEnrollment, 201);
  },
  update: async (c: any) => {
    const updated = await enrollmentService.update(c.req.valid('param').id, c.req.valid('json') as Record<string, unknown>);
    if (!updated) throw new HTTPException(404, { message: 'Enrollment not found' });
    return c.json(updated, 200);
  },
};
