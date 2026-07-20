import { HTTPException } from 'hono/http-exception';
import { getUserId } from '../middlewares/auth.js';
import { paymentService } from '../services/payment-service.js';

export const paymentController = {
  list: async (c: any) => c.json(await paymentService.listSummaries()),
  history: async (c: any) => {
    const q = c.req.valid('query');
    return c.json(await paymentService.history({ teacherId: q.teacherId, sectionId: q.sectionId }));
  },
  get: async (c: any) => {
    const teacherId = c.req.valid('param').id;
    const teachers = await paymentService.listTeachers();
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) throw new HTTPException(404, { message: 'Teacher not found' });
    const summary = await paymentService.summary(teacherId);
    return c.json({ ...summary, teacherName: teacher.teacherName }, 200);
  },
  create: async (c: any) => {
    const body = c.req.valid('json');
    const userId = getUserId(c);
    try {
      const record = await paymentService.record({ ...body, paidBy: userId });
      return c.json({
        id: record.id,
        teacherId: record.teacherId,
        sectionId: record.sectionId,
        hoursPaid: record.hoursPaid,
        amountPaid: record.amountPaid,
        notes: record.notes ?? undefined,
        paidBy: record.paidBy ?? undefined,
        createdAt: record.createdAt.toISOString(),
      }, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      throw new HTTPException(400, { message });
    }
  },
};
