export interface User { id: string; name: string; email: string; role: 'admin' | 'teacher' | 'student'; teacherId?: string; studentId?: string; }

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('speak-to-reach-token');
  return token ? { authorization: `Bearer ${token}` } : {};
}

export interface Teacher { id: string; teacherName: string; phone?: string; email: string; status: string; hireDate?: string; notes?: string; createdAt: string; updatedAt: string; }
export interface Student { id: string; studentName: string; phone?: string; email?: string; level: string; classType: string; status: string; registrationDate: string; assignedTeacherId?: string; assignedCourseId?: string; notes?: string; createdAt: string; updatedAt: string; }
export interface Course { id: string; courseName: string; level: string; totalUnits: number; totalLessons: number; description?: string; createdAt: string; updatedAt: string; }
export interface Assignment { id: string; assignmentName: string; teacherId: string; studentId: string; courseId: string; days: string; startTime: string; endTime?: string; startDate: string; endDate?: string; mode: string; status: string; createdAt: string; updatedAt: string; }
export interface Session { id: string; sessionName: string; sessionDate: string; teacherId: string; studentId: string; assignmentId: string; lessonNumber: number; lessonTitle: string; attendance: string; present: boolean; absent: boolean; late: boolean; cancelled: boolean; durationMinutes?: number; homeworkGiven?: string; homeworkSubmitted: boolean; vocabularyCovered?: string; grammarCovered?: string; speakingPractice?: string; readingPractice?: string; writingPractice?: string; listeningPractice?: string; teacherNotes?: string; createdAt: string; updatedAt: string; }
export interface Homework { id: string; homework: string; studentId: string; teacherId: string; sessionId?: string; dueDate: string; submitted: boolean; score?: number; feedback?: string; createdAt: string; updatedAt: string; }
export interface Progress { id: string; studentId: string; teacherId: string; currentUnit: number; currentLesson: number; lastLessonDate?: string; completionPercentage: number; strengths?: string; weaknesses?: string; recommendedFocus?: string; manualOverrideReason?: string; createdAt: string; updatedAt: string; }
export interface TeacherPerformance { teacherId: string; teacherName: string; totalAssignedClasses: number; classesCompleted: number; attendanceReportsSubmitted: number; studentAttendancePercentage: number; homeworkCompletionPercentage: number; notes?: string; }
export interface DashboardData {
  todayClasses: Assignment[]; todayAttendance: Session[]; upcomingClasses: Assignment[];
  recentLessonReports: Session[]; teacherPerformance: TeacherPerformance[]; studentProgress: Progress[];
  homeworkPending: Homework[]; recentlyRegisteredStudents: Student[];
  reports: { studentsWithLowAttendance: Student[]; teachersMissingLessonReports: Teacher[]; studentsBehindSchedule: Student[]; };
}

async function authJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { ...authHeaders(), 'Content-Type': 'application/json', ...init?.headers } });
  if (!res.ok) { const msg = await res.text().catch(() => ''); throw new Error(msg || `Request failed with ${res.status}`); }
  return res.json() as Promise<T>;
}

export const api = {
  me: () => authJson<User>(`${API_BASE_URL}/api/auth/me`),
  login: (body: { email: string; password: string }) => authJson<{ token: string; user: User }>(`${API_BASE_URL}/api/auth/login`, { method: 'POST', body: JSON.stringify(body) }),
  teachers: (query?: { status?: string }) => {
    const params = query?.status ? `?status=${query.status}` : '';
    return authJson<Teacher[]>(`${API_BASE_URL}/api/teachers${params}`);
  },
  createTeacher: (body: Record<string, unknown>) => authJson<Teacher>(`${API_BASE_URL}/api/teachers`, { method: 'POST', body: JSON.stringify(body) }),
  updateTeacher: (id: string, body: Record<string, unknown>) => authJson<Teacher>(`${API_BASE_URL}/api/teachers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
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
  assignments: (query?: { status?: string; teacherId?: string; studentId?: string }) => {
    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    if (query?.teacherId) params.set('teacherId', query.teacherId);
    if (query?.studentId) params.set('studentId', query.studentId);
    const qs = params.toString();
    return authJson<Assignment[]>(`${API_BASE_URL}/api/assignments${qs ? `?${qs}` : ''}`);
  },
  createAssignment: (body: Record<string, unknown>) => authJson<Assignment>(`${API_BASE_URL}/api/assignments`, { method: 'POST', body: JSON.stringify(body) }),
  updateAssignment: (id: string, body: Record<string, unknown>) => authJson<Assignment>(`${API_BASE_URL}/api/assignments/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  endAssignment: (id: string) => authJson<Assignment>(`${API_BASE_URL}/api/assignments/${id}/end`, { method: 'POST' }),
  sessions: (query?: { view?: string; teacherId?: string; studentId?: string }) => {
    const params = new URLSearchParams();
    if (query?.view) params.set('view', query.view);
    if (query?.teacherId) params.set('teacherId', query.teacherId);
    if (query?.studentId) params.set('studentId', query.studentId);
    const qs = params.toString();
    return authJson<Session[]>(`${API_BASE_URL}/api/sessions${qs ? `?${qs}` : ''}`);
  },
  createSession: (body: Record<string, unknown>) => authJson<Session>(`${API_BASE_URL}/api/sessions`, { method: 'POST', body: JSON.stringify(body) }),
  updateSession: (id: string, body: Record<string, unknown>) => authJson<Session>(`${API_BASE_URL}/api/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  homework: (query?: { status?: string; teacherId?: string; studentId?: string }) => {
    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    if (query?.teacherId) params.set('teacherId', query.teacherId);
    if (query?.studentId) params.set('studentId', query.studentId);
    const qs = params.toString();
    return authJson<Homework[]>(`${API_BASE_URL}/api/homework${qs ? `?${qs}` : ''}`);
  },
  createHomework: (body: Record<string, unknown>) => authJson<Homework>(`${API_BASE_URL}/api/homework`, { method: 'POST', body: JSON.stringify(body) }),
  updateHomework: (id: string, body: Record<string, unknown>) => authJson<Homework>(`${API_BASE_URL}/api/homework/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  progress: () => authJson<Progress[]>(`${API_BASE_URL}/api/progress`),
  updateProgress: (id: string, body: Record<string, unknown>) => authJson<Progress>(`${API_BASE_URL}/api/progress/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  performance: () => authJson<Performance[]>(`${API_BASE_URL}/api/performance/teachers`),
  adminDashboard: () => authJson<DashboardData>(`${API_BASE_URL}/api/reports/admin`),
  teacherDashboard: (id: string) => authJson<DashboardData>(`${API_BASE_URL}/api/reports/teachers/${id}`),
  studentPage: (id: string) => authJson<{ student: Student; teacher?: Teacher; course?: Course; attendanceHistory: Session[]; lessonHistory: Session[]; homework: Homework[]; progress?: Progress; teacherNotes: string[] }>(`${API_BASE_URL}/api/reports/students/${id}`),
  registerUser: (body: { name: string; email: string; role: string; teacherId?: string; studentId?: string }) => authJson<{ id: string; email: string; password: string; role: string }>(`${API_BASE_URL}/api/auth/register`, { method: 'POST', body: JSON.stringify(body) }),
  changePassword: (body: { currentPassword: string; newPassword: string }) => authJson<{ message: string }>(`${API_BASE_URL}/api/auth/password`, { method: 'PATCH', body: JSON.stringify(body) }),
};

