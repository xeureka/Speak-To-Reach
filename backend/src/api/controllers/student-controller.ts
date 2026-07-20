import { HTTPException } from 'hono/http-exception';
import { studentService } from '../services/student-service.js';

export const studentController = {
  list: async (c: any) => {
    const q = c.req.valid('query');
    const rows = await studentService.list({ status: q.status, classType: q.classType, level: q.level });
    return c.json(rows);
  },
  create: async (c: any) => {
    const { entity } = await studentService.create(c.req.valid('json') as Record<string, unknown>);
    return c.json(entity, 201);
  },
  update: async (c: any) => {
    const updated = await studentService.update(c.req.valid('param').id, c.req.valid('json') as Record<string, unknown>);
    if (!updated) throw new HTTPException(404, { message: 'Student not found' });
    return c.json(updated, 200);
  },
  page: async (c: any) => {
    const data = await studentService.studentPage(c.req.valid('param').id);
    if (!data) throw new HTTPException(404, { message: 'Student not found' });
    return c.json(data, 200);
  },
};
