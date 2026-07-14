import type { IconType } from 'react-icons';
import {
  HiOutlineAcademicCap,
  HiOutlineBanknotes,
  HiOutlineBookOpen,
  HiOutlineCalendarDays,
  HiOutlineChartBarSquare,
  HiOutlineHome,
  HiOutlineUserGroup,
  HiOutlineUsers,
} from 'react-icons/hi2';

import type { User } from '../api';

export type NavItem = {
  to: string;
  icon: IconType;
  label: string;
};

export const ADMIN_ONLY_PATHS = [
  '/',
  '/sections',
  '/teachers',
  '/students',
  '/courses',
  '/sessions',
  '/reports',
  '/payments',
] as const;

export function isActiveAdminPath(pathname: string): boolean {
  return (ADMIN_ONLY_PATHS as readonly string[]).some(p => pathname === p || pathname.startsWith(p + '/'));
}

export function getNavItems(user: User): NavItem[] {
  if (user.role === 'admin') {
    return [
      { to: '/', icon: HiOutlineHome, label: 'Dashboard' },
      { to: '/sections', icon: HiOutlineUserGroup, label: 'Sections' },
      { to: '/students', icon: HiOutlineUsers, label: 'Students' },
      { to: '/teachers', icon: HiOutlineAcademicCap, label: 'Teachers' },
      { to: '/courses', icon: HiOutlineBookOpen, label: 'Courses' },
      { to: '/sessions', icon: HiOutlineCalendarDays, label: 'Sessions' },
      { to: '/reports', icon: HiOutlineChartBarSquare, label: 'Reports' },
      { to: '/payments', icon: HiOutlineBanknotes, label: 'Payments' },
    ];
  }

  if (user.role === 'teacher') {
    return [
      { to: '/teacher', icon: HiOutlineAcademicCap, label: 'Dashboard' },
      { to: '/teacher/sections', icon: HiOutlineUserGroup, label: 'My Sections' },
      { to: '/teacher/students', icon: HiOutlineUsers, label: 'My Students' },
    ];
  }

  return [];
}
