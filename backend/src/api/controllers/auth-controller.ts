import { HTTPException } from 'hono/http-exception';
import { sign } from 'hono/jwt';
import { JWT_SECRET, requireAdmin, requireUser } from '../middlewares/auth.js';
import { authService } from '../services/auth-service.js';

export const authController = {
  login: async (c: any) => {
    const { email, password } = c.req.valid('json');
    await authService.seedUsers();
    const user = await authService.login(email, password);
    if (!user) throw new HTTPException(401, { message: 'Invalid email or password' });
    const token = await sign({ sub: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + 86400 * 7 }, JWT_SECRET);
    return c.json({ token, user }, 200);
  },
  me: async (c: any) => {
    const user = await requireUser(c);
    return c.json(user, 200);
  },
  register: async (c: any) => {
    await requireAdmin(c);
    const body = c.req.valid('json');
    const { user, password } = await authService.registerTeacherUser({ name: body.name, email: body.email, teacherId: body.teacherId });
    return c.json({ id: user.id, email: user.email, password, role: user.role }, 201);
  },
  changePassword: async (c: any) => {
    const user = await requireUser(c);
    const { currentPassword, newPassword } = c.req.valid('json');
    const result = await authService.changePassword(user.id, currentPassword, newPassword);
    if (!result.ok) throw new HTTPException(401, { message: result.message });
    return c.json({ message: 'Password updated' }, 200);
  },
};
