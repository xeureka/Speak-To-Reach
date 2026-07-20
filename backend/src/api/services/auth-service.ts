import { drizzleRepository as repo } from '../../repositories/drizzle.js';

export const authService = {
  seedUsers: () => repo.seedUsersAsync(),
  login: (email: string, password: string) => repo.loginDB(email, password),
  getUser: (userId: string) => repo.getUserFromDB(userId),
  changePassword: (userId: string, currentPassword: string, newPassword: string) => repo.updatePasswordInDB(userId, currentPassword, newPassword),
  registerTeacherUser: (data: { name: string; email: string; teacherId?: string }) => repo.createUserInDB({ ...data, role: 'teacher' }),
};
