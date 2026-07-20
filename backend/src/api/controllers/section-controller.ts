import { HTTPException } from 'hono/http-exception';
import { sectionService } from '../services/section-service.js';

export const sectionController = {
  list: async (c: any) => {
    const q = c.req.valid('query');
    return c.json(await sectionService.list(q));
  },
  create: async (c: any) => c.json(await sectionService.create(c.req.valid('json') as Record<string, unknown>), 201),
  get: async (c: any) => {
    const section = await sectionService.get(c.req.valid('param').id);
    if (!section) throw new HTTPException(404, { message: 'Section not found' });
    return c.json(section, 200);
  },
  update: async (c: any) => {
    const updated = await sectionService.update(c.req.valid('param').id, c.req.valid('json') as Record<string, unknown>);
    if (!updated) throw new HTTPException(404, { message: 'Section not found' });
    return c.json(updated, 200);
  },
  end: async (c: any) => {
    const updated = await sectionService.end(c.req.valid('param').id);
    if (!updated) throw new HTTPException(404, { message: 'Section not found' });
    return c.json(updated, 200);
  },
};
