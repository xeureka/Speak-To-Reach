import { drizzleRepository as repo } from '../../repositories/drizzle.js';

export const importService = {
  importStudents: (rows: Array<Record<string, unknown>>) => repo.importStudents(rows),
};
