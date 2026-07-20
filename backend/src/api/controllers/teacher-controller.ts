import { HTTPException } from 'hono/http-exception';
import { teacherService } from '../services/teacher-service.js';

export const teacherController = {
  list: async (c: any) => {
    const q = c.req.valid('query');
    const rows = await teacherService.list(q.status);
    return c.json(rows);
  },
  create: async (c: any) => {
    const { entity, password } = await teacherService.create(c.req.valid('json') as Record<string, unknown>);
    return c.json({ ...entity, password }, 201);
  },
  update: async (c: any) => {
    const updated = await teacherService.update(c.req.valid('param').id, c.req.valid('json') as Record<string, unknown>);
    if (!updated) throw new HTTPException(404, { message: 'Teacher not found' });
    return c.json(updated, 200);
  },
  resetPassword: async (c: any) => {
    const result = await teacherService.resetPassword(c.req.valid('param').id);
    if (!result) throw new HTTPException(404, { message: 'Teacher not found' });
    return c.json(result, 200);
  },
  students: async (c: any) => c.json(await teacherService.listStudents(c.req.valid('param').id)),
  analytics: async (c: any) => c.json(await teacherService.analytics(c.req.valid('param').id), 200),
};
