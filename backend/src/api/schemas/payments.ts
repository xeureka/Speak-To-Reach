import { z } from '@hono/zod-openapi';
import { PaymentHistoryEntry, TeacherPaymentSummary } from '../../domain/contracts.js';

export const PaymentHistoryQuery = z.object({ teacherId: z.string().optional(), sectionId: z.string().optional() });
export const PaymentHistoryResponse = z.array(PaymentHistoryEntry);
export const PaymentSummaryListResponse = z.array(TeacherPaymentSummary);
