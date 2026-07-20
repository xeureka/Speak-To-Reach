import { z } from '@hono/zod-openapi';
import { AuthUser } from '../../domain/contracts.js';

export const LoginBody = z.object({ email: z.string().email(), password: z.string() });
export const LoginResponse = z.object({ token: z.string(), user: AuthUser });
export const RegisterBody = z.object({ name: z.string(), email: z.string().email(), role: z.enum(['teacher']), teacherId: z.string().optional() });
export const RegisterResponse = z.object({ id: z.string(), email: z.string(), password: z.string(), role: z.string() });
export const ChangePasswordBody = z.object({ currentPassword: z.string(), newPassword: z.string().min(6) });
export const MessageResponse = z.object({ message: z.string() });
