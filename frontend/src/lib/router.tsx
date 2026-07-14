import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';

import { ProtectedLayout } from '../components/layout/ProtectedLayout';
import { RootLayout } from '../components/layout/RootLayout';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { CoursesPage } from '../pages/CoursesPage';
import { LoginRoute } from '../pages/LoginPage';
import { ReportsPage } from '../pages/ReportsPage';
import { SessionsPage } from '../pages/SessionsPage';
import { SessionActionPage } from '../pages/SessionActionPage';
import { StudentPage } from '../pages/StudentPage';
import { StudentsPage } from '../pages/StudentsPage';
import { TeacherDashboardPage } from '../pages/TeacherDashboardPage';
import { TeacherStudentsPage } from '../pages/TeacherStudentsPage';
import { SectionsPage } from '../pages/SectionsPage';
import { SectionDetailPage } from '../pages/SectionDetailPage';
import { TeachersPage } from '../pages/TeachersPage';
import { TeacherDetailPage } from '../pages/TeacherDetailPage';
import { PaymentsPage } from '../pages/PaymentsPage';

const rootRoute = createRootRoute({ component: RootLayout });
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: LoginRoute });
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  component: ProtectedLayout,
});
const indexRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/', component: AdminDashboardPage });
const sectionsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/sections', component: SectionsPage });
const sectionDetailRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/sections/$sectionId', component: SectionDetailPage });
const teachersRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/teachers', component: TeachersPage });
const teacherDetailRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/teachers/$teacherId', component: TeacherDetailPage });
const studentsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/students', component: StudentsPage });
const studentRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/students/$studentId', component: StudentPage });
const coursesRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/courses', component: CoursesPage });
const sessionsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/sessions', component: SessionsPage });
const sessionActionRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/sessions/$sessionId', component: SessionActionPage });
const reportsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/reports', component: ReportsPage });
const paymentsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/payments', component: PaymentsPage });
const teacherRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/teacher', component: TeacherDashboardPage });
const teacherSectionsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/teacher/sections', component: SectionsPage });
const teacherStudentsRoute = createRoute({ getParentRoute: () => protectedRoute, path: '/teacher/students', component: TeacherStudentsPage });

const routeTree = rootRoute.addChildren([
  loginRoute,
  protectedRoute.addChildren([
    indexRoute, sectionsRoute, sectionDetailRoute, teachersRoute, teacherDetailRoute, studentsRoute,
    studentRoute, coursesRoute, sessionsRoute, sessionActionRoute, reportsRoute, paymentsRoute,
    teacherRoute, teacherSectionsRoute, teacherStudentsRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
