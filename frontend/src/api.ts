export interface User { id: string; name: string; email: string; role: 'admin' | 'teacher'; teacherId?: string; }

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('speak-to-reach-token');
  return token ? { authorization: `Bearer ${token}` } : {};
}

export interface Teacher { id: string; teacherName: string; phone?: string; email: string; status: string; hireDate?: string; notes?: string; createdAt: string; updatedAt: string; }
export interface Student { id: string; studentName: string; phone?: string; email?: string; level: string; classType: string; status: string; registrationDate: string; notes?: string; createdAt: string; updatedAt: string; }
export interface Course { id: string; courseName: string; level: string; totalUnits: number; totalLessons: number; description?: string; createdAt: string; updatedAt: string; }
export interface Section { id: string; sectionName: string; classType: string; teacherId: string; courseId: string; scheduleDays: string; startTime: string; endTime?: string; startDate: string; endDate?: string; maxStudents?: number; status: string; notes?: string; createdAt: string; updatedAt: string; }
export interface Enrollment { id: string; studentId: string; sectionId: string; enrollmentDate: string; status: string; notes?: string; createdAt: string; updatedAt: string; }
export interface ClassSession { id: string; sectionId: string; sessionDate: string; sessionNumber: number; lessonTitle?: string; lessonNumber?: number; sessionType: string; durationMinutes?: number; status: string; teacherNotes?: string; createdAt: string; updatedAt: string; }
export interface SessionAttendance { id: string; classSessionId: string; studentId: string; attendanceStatus: string; present: boolean; absent: boolean; late: boolean; cancelled: boolean; notes?: string; createdAt: string; updatedAt: string; }
export interface SessionReport { id: string; classSessionId: string; teacherId: string; reportStatus: string; homeworkGiven?: string; homeworkSubmitted?: boolean; vocabularyCovered?: string; grammarCovered?: string; speakingPractice?: string; readingPractice?: string; writingPractice?: string; listeningPractice?: string; generalNotes?: string; createdAt: string; updatedAt: string; }
export interface DashboardData {
  totalActiveSections: number; activeGroupSections: number; activePrivateSections: number;
  totalActiveTeachers: number; todaysClasses: ClassSession[];
  recentActivity: ClassSession[]; sections: Section[];
}
export interface PaymentSummary { teacherId: string; teacherName: string; classesTaught: number; reportsSubmitted: number; totalHours: number; }

async function authJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { ...authHeaders(), 'Content-Type': 'application/json', ...init?.headers } });
  if (!res.ok) { const msg = await res.text().catch(() => ''); throw new Error(msg || `Request failed with ${res.status}`); }
  return res.json() as Promise<T>;
}

export const api = {
  me: () => authJson<User>(`${API_BASE_URL}/api/auth/me`),
  login: (body: { email: string; password: string }) => authJson<{ token: string; user: User }>(`${API_BASE_URL}/api/auth/login`, { method: 'POST', body: JSON.stringify(body) }),
  changePassword: (body: { currentPassword: string; newPassword: string }) => authJson<{ message: string }>(`${API_BASE_URL}/api/auth/password`, { method: 'PATCH', body: JSON.stringify(body) }),

  teachers: (query?: { status?: string }) => {
    const params = query?.status ? `?status=${query.status}` : '';
    return authJson<Teacher[]>(`${API_BASE_URL}/api/teachers${params}`);
  },
  createTeacher: (body: Record<string, unknown>) => authJson<Teacher>(`${API_BASE_URL}/api/teachers`, { method: 'POST', body: JSON.stringify(body) }),
  updateTeacher: (id: string, body: Record<string, unknown>) => authJson<Teacher>(`${API_BASE_URL}/api/teachers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  resetTeacherPassword: (id: string) => authJson<{ email: string; password: string }>(`${API_BASE_URL}/api/teachers/${id}/reset-password`, { method: 'POST' }),
  teacherStudents: (teacherId: string) => authJson<Student[]>(`${API_BASE_URL}/api/teachers/${teacherId}/students`),
  teacherAnalytics: (teacherId: string) => authJson<{ totalSections: number; privateSections: number; groupSections: number; privateSectionNames: string[]; groupSectionNames: string[]; monthSessionsTotal: number; monthSessionsCompleted: number; monthHoursTotal: number; totalStudents: number; reportsSubmitted: number; reportsDraft: number; totalSessionsEver: number; recentSessions: Array<ClassSession & { sectionName: string; sectionClassType: string }> }>(`${API_BASE_URL}/api/teachers/${teacherId}/analytics`),

  students: (query?: { status?: string; classType?: string; level?: string }) => {
    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    if (query?.classType) params.set('classType', query.classType);
    if (query?.level) params.set('level', query.level);
    const qs = params.toString();
    return authJson<Student[]>(`${API_BASE_URL}/api/students${qs ? `?${qs}` : ''}`);
  },
  createStudent: (body: Record<string, unknown>) => authJson<Student>(`${API_BASE_URL}/api/students`, { method: 'POST', body: JSON.stringify(body) }),
  updateStudent: (id: string, body: Record<string, unknown>) => authJson<Student>(`${API_BASE_URL}/api/students/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  courses: () => authJson<Course[]>(`${API_BASE_URL}/api/courses`),
  createCourse: (body: Record<string, unknown>) => authJson<Course>(`${API_BASE_URL}/api/courses`, { method: 'POST', body: JSON.stringify(body) }),
  updateCourse: (id: string, body: Record<string, unknown>) => authJson<Course>(`${API_BASE_URL}/api/courses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  sections: (query?: { status?: string; teacherId?: string; classType?: string }) => {
    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    if (query?.teacherId) params.set('teacherId', query.teacherId);
    if (query?.classType) params.set('classType', query.classType);
    const qs = params.toString();
    return authJson<Section[]>(`${API_BASE_URL}/api/sections${qs ? `?${qs}` : ''}`);
  },
  createSection: (body: Record<string, unknown>) => authJson<Section>(`${API_BASE_URL}/api/sections`, { method: 'POST', body: JSON.stringify(body) }),
  getSection: (id: string) => authJson<Section>(`${API_BASE_URL}/api/sections/${id}`),
  updateSection: (id: string, body: Record<string, unknown>) => authJson<Section>(`${API_BASE_URL}/api/sections/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  endSection: (id: string) => authJson<Section>(`${API_BASE_URL}/api/sections/${id}/end`, { method: 'POST' }),

  enrollments: (sectionId: string) => authJson<Enrollment[]>(`${API_BASE_URL}/api/sections/${sectionId}/enrollments`),
  createEnrollment: (sectionId: string, body: Record<string, unknown>) => authJson<Enrollment>(`${API_BASE_URL}/api/sections/${sectionId}/enrollments`, { method: 'POST', body: JSON.stringify(body) }),
  updateEnrollment: (id: string, body: Record<string, unknown>) => authJson<Enrollment>(`${API_BASE_URL}/api/enrollments/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  classSessions: (query?: { sectionId?: string; date?: string; status?: string; teacherId?: string; view?: string }) => {
    const params = new URLSearchParams();
    if (query?.sectionId) params.set('sectionId', query.sectionId);
    if (query?.date) params.set('date', query.date);
    if (query?.status) params.set('status', query.status);
    if (query?.teacherId) params.set('teacherId', query.teacherId);
    if (query?.view) params.set('view', query.view);
    const qs = params.toString();
    return authJson<ClassSession[]>(`${API_BASE_URL}/api/class-sessions${qs ? `?${qs}` : ''}`);
  },
  createClassSession: (body: Record<string, unknown>) => authJson<ClassSession>(`${API_BASE_URL}/api/class-sessions`, { method: 'POST', body: JSON.stringify(body) }),
  bulkCreateClassSessions: (sessions: Array<Record<string, unknown>>) => authJson<ClassSession[]>(`${API_BASE_URL}/api/class-sessions/bulk`, { method: 'POST', body: JSON.stringify({ sessions }) }),
  updateClassSession: (id: string, body: Record<string, unknown>) => authJson<ClassSession>(`${API_BASE_URL}/api/class-sessions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  completeClassSession: (id: string) => authJson<ClassSession>(`${API_BASE_URL}/api/class-sessions/${id}/complete`, { method: 'POST' }),

  getAttendance: (sessionId: string) => authJson<SessionAttendance[]>(`${API_BASE_URL}/api/class-sessions/${sessionId}/attendance`),
  submitAttendance: (sessionId: string, entries: Array<{ studentId: string; attendanceStatus: string; notes?: string }>) =>
    authJson<SessionAttendance[]>(`${API_BASE_URL}/api/class-sessions/${sessionId}/attendance`, { method: 'POST', body: JSON.stringify({ entries }) }),

  getReport: (sessionId: string) => authJson<SessionReport | null>(`${API_BASE_URL}/api/class-sessions/${sessionId}/report`),
  submitReport: (sessionId: string, body: Record<string, unknown>) => authJson<SessionReport>(`${API_BASE_URL}/api/class-sessions/${sessionId}/report`, { method: 'POST', body: JSON.stringify(body) }),

  adminDashboard: () => authJson<DashboardData>(`${API_BASE_URL}/api/reports/admin`),
  teacherDashboard: (id: string) => authJson<DashboardData>(`${API_BASE_URL}/api/reports/teachers/${id}`),
  studentPage: (id: string) => authJson<{ student: Student; sections: Section[]; enrollments: Enrollment[]; attendance: SessionAttendance[] }>(`${API_BASE_URL}/api/reports/students/${id}`),

  payments: (query?: { month?: string; teacherId?: string }) => {
    const params = new URLSearchParams();
    if (query?.month) params.set('month', query.month);
    if (query?.teacherId) params.set('teacherId', query.teacherId);
    const qs = params.toString();
    return authJson<PaymentSummary[]>(`${API_BASE_URL}/api/payments${qs ? `?${qs}` : ''}`);
  },

  registerUser: (body: { name: string; email: string; role: string; teacherId?: string }) => authJson<{ id: string; email: string; password: string; role: string }>(`${API_BASE_URL}/api/auth/register`, { method: 'POST', body: JSON.stringify(body) }),

  activityLog: (query?: { teacherId?: string; startDate?: string; endDate?: string }) => {
    const params = new URLSearchParams();
    if (query?.teacherId) params.set('teacherId', query.teacherId);
    if (query?.startDate) params.set('startDate', query.startDate);
    if (query?.endDate) params.set('endDate', query.endDate);
    const qs = params.toString();
    return authJson<Array<{ id: string; teacherId: string; activityType: string; classSessionId?: string; sectionId?: string; activityDate: string; description?: string; metadata?: Record<string, unknown>; createdAt: string }>>(`${API_BASE_URL}/api/activity-log${qs ? `?${qs}` : ''}`);
  },

  reportsAnalytics: (query?: { teacherId?: string }) => {
    const params = query?.teacherId ? `?teacherId=${query.teacherId}` : '';
    return authJson<{ studentsWithLowAttendance: Student[]; teachersMissingLessonReports: Teacher[]; studentsBehindSchedule: Student[] }>(`${API_BASE_URL}/api/reports/analytics${params}`);
  },

  importStudents: async (file: File) => {
    const token = localStorage.getItem('speak-to-reach-token');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/api/import/students`, {
      method: 'POST',
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error(`Import failed with ${res.status}`);
    return res.json() as Promise<{ imported: number; skipped: number; errors: Array<{ row: number; message: string }>; students: Student[] }>;
  },
};
