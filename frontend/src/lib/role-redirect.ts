import type { User } from '../api';

export function roleRedirect(user: User): string {
  if (user.role === 'teacher') return '/teacher';
  return '/';
}
