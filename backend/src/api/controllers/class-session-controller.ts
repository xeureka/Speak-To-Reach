import { HTTPException } from 'hono/http-exception';
import { classSessionService } from '../services/class-session-service.js';

export const classSessionController = {
  list: async (c: any) => {
    const q = c.req.valid('query');
    return c.json(await classSessionService.list({ ...q, todayOnly: q.view === 'today' }));
  },
  create: async (c: any) => c.json(await classSessionService.create(c.req.valid('json') as Record<string, unknown>), 201),
  bulkCreate: async (c: any) => {
    const { sessions } = c.req.valid('json');
    return c.json(await classSessionService.bulkCreate(sessions as Array<Record<string, unknown>>), 201);
  },
  update: async (c: any) => {
    const updated = await classSessionService.update(c.req.valid('param').id, c.req.valid('json') as Record<string, unknown>);
    if (!updated) throw new HTTPException(404, { message: 'Session not found' });
    return c.json(updated, 200);
  },
  complete: async (c: any) => {
    const updated = await classSessionService.complete(c.req.valid('param').id);
    if (!updated) throw new HTTPException(404, { message: 'Session not found' });
    return c.json(updated, 200);
  },
};
