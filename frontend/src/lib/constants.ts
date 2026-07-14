export const LEVELS = [
  'Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper Intermediate', 'Advanced',
] as const;

export const CLASS_TYPES = ['Private', 'Mini Group', 'Group'] as const;

export const ATTENDANCE_OPTIONS = ['Present', 'Absent', 'Late', 'Cancelled'] as const;

export const STUDENT_STATUSES = ['Active', 'Paused', 'Completed'] as const;

export const SECTION_STATUSES = ['active', 'inactive', 'completed'] as const;

export const SESSION_VIEWS = ['today', 'this-week', 'calendar'] as const;
