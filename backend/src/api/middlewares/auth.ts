import process from 'node:process';
import { HTTPException } from 'hono/http-exception';
import { drizzleRepository as repo } from '../../repositories/drizzle.js';

export const JWT_SECRET = process.env.JWT_SECRET ?? 'speak-to-reach-dev-secret';

export function getUserId(c: { req: { header: (name: string) => string | undefined } }): string | undefined {
  const auth = c.req.header('authorization');
  if (!auth?.startsWith('Bearer ')) return undefined;
  try {
    const payload = JSON.parse(atob(auth.slice(7).split('.')[1]!));
    return payload.sub as string;
  } catch {
    return undefined;
  }
}

export async function requireUser(c: { req: { header: (name: string) => string | undefined } }) {
  const userId = getUserId(c);
  if (!userId) throw new HTTPException(401, { message: 'Unauthorized' });
  const user = await repo.getUserFromDB(userId);
  if (!user) throw new HTTPException(401, { message: 'Unauthorized' });
  return user;
}

export async function requireAdmin(c: { req: { header: (name: string) => string | undefined } }) {
  const user = await requireUser(c);
  if (user.role !== 'admin') throw new HTTPException(401, { message: 'Only admin can register users' });
  return user;
}
