import { createRoute } from '@hono/zod-openapi';
import { AuthUser } from '../../domain/contracts.js';
import { authController } from '../controllers/auth-controller.js';
import { ChangePasswordBody, LoginBody, LoginResponse, MessageResponse, RegisterBody, RegisterResponse } from '../schemas/auth.js';
import type { RouteRegistrar } from '../types.js';

export const registerAuthRoutes: RouteRegistrar = (app) => {
  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/auth/login',
      request: { body: { content: { 'application/json': { schema: LoginBody } } } },
      responses: { 200: { content: { 'application/json': { schema: LoginResponse } }, description: 'OK' } },
    }),
    authController.login,
  );

  app.openapi(
    createRoute({ method: 'get', path: '/api/auth/me', responses: { 200: { content: { 'application/json': { schema: AuthUser } }, description: 'OK' } } }),
    authController.me,
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/api/auth/register',
      request: { body: { content: { 'application/json': { schema: RegisterBody } } } },
      responses: { 201: { content: { 'application/json': { schema: RegisterResponse } }, description: 'Created' } },
    }),
    authController.register,
  );

  app.openapi(
    createRoute({
      method: 'patch',
      path: '/api/auth/password',
      request: { body: { content: { 'application/json': { schema: ChangePasswordBody } } } },
      responses: { 200: { content: { 'application/json': { schema: MessageResponse } }, description: 'OK' } },
    }),
    authController.changePassword,
  );
};
