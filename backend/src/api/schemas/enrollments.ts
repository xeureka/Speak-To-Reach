import { Enrollment } from '../../domain/contracts.js';

export const CreateEnrollmentBody = Enrollment.omit({ id: true, sectionId: true, createdAt: true, updatedAt: true }).partial({ enrollmentDate: true, notes: true, status: true });
export const UpdateEnrollmentBody = Enrollment.omit({ id: true, sectionId: true, createdAt: true, updatedAt: true }).partial();
