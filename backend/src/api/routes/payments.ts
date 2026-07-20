import { createRoute } from '@hono/zod-openapi';
import { CreatePaymentRecord, PaymentRecord, TeacherPaymentSummary } from '../../domain/contracts.js';
import { paymentController } from '../controllers/payment-controller.js';
import { created, ErrorResponse, IdParam, ok } from '../shared.js';
import { PaymentHistoryQuery, PaymentHistoryResponse, PaymentSummaryListResponse } from '../schemas/payments.js';
import type { RouteRegistrar } from '../types.js';

export const registerPaymentRoutes: RouteRegistrar = (app) => {
  app.openapi(
    createRoute({ method: 'get', path: '/api/payments', responses: ok(PaymentSummaryListResponse) }),
    paymentController.list,
  );

  app.openapi(
    createRoute({ method: 'get', path: '/api/payments/history', request: { query: PaymentHistoryQuery }, responses: ok(PaymentHistoryResponse) }),
    paymentController.history,
  );

  app.openapi(
    createRoute({ method: 'get', path: '/api/payments/{id}', request: { params: IdParam }, responses: { 200: { content: { 'application/json': { schema: TeacherPaymentSummary } }, description: 'OK' }, 404: { content: { 'application/json': { schema: ErrorResponse } }, description: 'Not found' } } }),
    paymentController.get,
  );

  app.openapi(
    createRoute({ method: 'post', path: '/api/payments', request: { body: { content: { 'application/json': { schema: CreatePaymentRecord } } } }, responses: created(PaymentRecord) }),
    paymentController.create,
  );
};
