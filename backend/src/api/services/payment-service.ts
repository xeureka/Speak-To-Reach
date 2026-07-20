import { drizzleRepository as repo } from '../../repositories/drizzle.js';

export const paymentService = {
  listSummaries: () => repo.getAllTeacherPaymentSummaries(),
  history: (filters?: { teacherId?: string; sectionId?: string }) => repo.getPaymentHistory(filters),
  listTeachers: () => repo.listTeachers(),
  summary: (teacherId: string) => repo.getTeacherPayments(teacherId),
  record: (data: { teacherId: string; sectionId: string; hoursPaid: number; amountPaid: number; notes?: string; paidBy?: string }) => repo.recordPayment(data),
};
