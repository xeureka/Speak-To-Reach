# Speak To Reach — Technical Specification & Implementation Plan

## 1. System Overview & Assumptions

### Project Goal
Educational management system for an English language tutoring school. Admin manages teachers, students, courses, assignments, attendance, reports, and payments. Teachers take attendance and submit session reports. **No student portal** — students are managed entirely by admin/teacher.

### What Already Exists
- **Backend**: Hono + OpenAPI + Drizzle ORM + PostgreSQL (Neon). Full CRUD for Teachers, Students, Courses, Assignments, Sessions, Homework, Progress, TeacherPerformance.
- **Frontend**: React 19 + TanStack Router/Query + vanilla CSS (960-line App.css). Pages: AdminDashboard, TeacherDashboard, Students, StudentPage, Courses, Assignments, Sessions, Homework, Reports, Login.
- **Auth**: JWT-based, 3 roles (admin, teacher, student). Auto-creates user accounts on teacher/student creation.

### What Needs to Change
1. **Remove Student role entirely** — no student login, no student dashboard, no student portal in admin.
2. **Migrate CSS to Tailwind + shadcn/ui** — replace App.css with utility classes and modern components.
3. **Introduce Section/Group model** — current system only has 1:1 teacher-student. Need 1:Many group support.
4. **Session-based tracking** — each class occurrence is a "session" with attendance per student.
5. **Private vs Group rules** — Private: 1 teacher, 1 student, attendance/report per student. Group: 1 teacher, many students, attendance per student, report per session (not per student).
6. **Excel import** — bulk student upload with preference mapping.
7. **Teacher payment tracking** — activity log for monthly payment calculation.
8. **UX cleanup** — move change password/settings to sidebar user menu, not dashboard panels.

### Architectural Approach
- Replace old Drizzle schema tables (assignments, sessions, homework, progress, teacherPerformance) with new normalized tables (sections, enrollments, class_sessions, session_attendance, session_reports, teacher_activity_log, student_preferences).
- Extend existing Hono routes (replace old endpoints, add new ones).
- Extend existing frontend pages (refactor AdminDashboard, TeacherDashboard, add new pages).
- **DB-only for new features** — memory fallback repository stays minimal (no new tables). Features requiring sections/enrollments/sessions need DATABASE_URL.
- **Delete App.css entirely** — full Tailwind CSS migration + shadcn/ui.
- Use shadcn/ui for all UI components (replaces custom Panel, Table, Badge, MetricCard, etc.).
- Keep student detail page (`/students/$studentId`) accessible to both admin and teachers.

---

## 2. Data Model Extensions

### New Enums

```sql
-- Add to existing enums
-- class_type already has: 'Private', 'Mini Group'
-- Add 'Group' to class_type enum (migration)

CREATE TYPE section_status AS ENUM ('active', 'inactive', 'completed');
CREATE TYPE session_type AS ENUM ('private', 'group');
CREATE TYPE report_status AS ENUM ('draft', 'submitted');
CREATE TYPE activity_type AS ENUM ('class_taught', 'report_submitted', 'attendance_marked');
```

### New Tables

#### 2.1 `sections` (Group Cohorts)
Replaces the concept of "class type" on students. A section is a named group of students with a teacher and course.

```sql
CREATE TABLE sections (
  id TEXT PRIMARY KEY,
  section_name VARCHAR(200) NOT NULL,           -- e.g., "Beginner Group A"
  class_type class_type NOT NULL,                -- 'Private' or 'Group'
  teacher_id TEXT NOT NULL REFERENCES teachers(id),
  course_id TEXT NOT NULL REFERENCES courses(id),
  schedule_days VARCHAR(120) NOT NULL,           -- e.g., "Mon,Wed,Fri"
  start_time TIME NOT NULL,
  end_time TIME,
  start_date DATE NOT NULL,
  end_date DATE,
  max_students INTEGER DEFAULT 20,               -- for groups, ignored for private
  status section_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

CREATE INDEX sections_teacher_idx ON sections(teacher_id);
CREATE INDEX sections_course_idx ON sections(course_id);
CREATE INDEX sections_status_idx ON sections(status);
CREATE INDEX sections_class_type_idx ON sections(class_type);
```

#### 2.2 `enrollments` (Student ↔ Section mapping)
Links students to sections. A student can be in multiple sections (different courses/times).

```sql
CREATE TABLE enrollments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  section_id TEXT NOT NULL REFERENCES sections(id),
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'withdrawn', 'completed'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, section_id)
);

CREATE INDEX enrollments_student_idx ON enrollments(student_id);
CREATE INDEX enrollments_section_idx ON enrollments(section_id);
```

#### 2.3 `class_sessions` (Dated instances of a section's schedule)
Each scheduled class occurrence. For Private sections: 1 session per student per class. For Group sections: 1 session for the whole group.

```sql
CREATE TABLE class_sessions (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES sections(id),
  session_date DATE NOT NULL,
  session_number INTEGER NOT NULL,               -- sequential lesson number in the section
  lesson_title VARCHAR(240),
  lesson_number INTEGER,                         -- which lesson in the course curriculum
  session_type session_type NOT NULL,             -- 'private' or 'group'
  duration_minutes INTEGER DEFAULT 60,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  teacher_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

CREATE INDEX class_sessions_section_idx ON class_sessions(section_id);
CREATE INDEX class_sessions_date_idx ON class_sessions(session_date);
CREATE INDEX class_sessions_status_idx ON class_sessions(status);
```

#### 2.4 `session_attendance` (Per-student attendance per class session)
For Private: 1 record (always the one student). For Group: N records (one per enrolled student).

```sql
CREATE TABLE session_attendance (
  id TEXT PRIMARY KEY,
  class_session_id TEXT NOT NULL REFERENCES class_sessions(id),
  student_id TEXT NOT NULL REFERENCES students(id),
  attendance_status attendance_status NOT NULL,
  present BOOLEAN NOT NULL DEFAULT false,
  absent BOOLEAN NOT NULL DEFAULT false,
  late BOOLEAN NOT NULL DEFAULT false,
  cancelled BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(class_session_id, student_id)
);

CREATE INDEX session_attendance_session_idx ON session_attendance(class_session_id);
CREATE INDEX session_attendance_student_idx ON session_attendance(student_id);
```

#### 2.5 `session_reports` (Teacher report per session)
For Private: 1 report per student (the one student). For Group: 1 report for the whole group (NOT per student).

```sql
CREATE TABLE session_reports (
  id TEXT PRIMARY KEY,
  class_session_id TEXT NOT NULL REFERENCES class_sessions(id),
  teacher_id TEXT NOT NULL REFERENCES teachers(id),
  report_status report_status NOT NULL DEFAULT 'draft',
  homework_given TEXT,
  homework_submitted BOOLEAN DEFAULT false,
  vocabulary_covered TEXT,
  grammar_covered TEXT,
  speaking_practice TEXT,
  reading_practice TEXT,
  writing_practice TEXT,
  listening_practice TEXT,
  general_notes TEXT,                             -- for group: covers the whole session
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,
  UNIQUE(class_session_id)                       -- one report per session
);

CREATE INDEX session_reports_session_idx ON session_reports(class_session_id);
CREATE INDEX session_reports_teacher_idx ON session_reports(teacher_id);
```

#### 2.6 `teacher_activity_log` (For payment calculation)
Tracks every activity a teacher performs for payment auditing.

```sql
CREATE TABLE teacher_activity_log (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES teachers(id),
  activity_type activity_type NOT NULL,
  class_session_id TEXT REFERENCES class_sessions(id),
  section_id TEXT REFERENCES sections(id),
  activity_date DATE NOT NULL,
  description TEXT,
  metadata JSONB,                                -- flexible: { students_present: 5, duration: 60 }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX activity_log_teacher_idx ON teacher_activity_log(teacher_id);
CREATE INDEX activity_log_date_idx ON teacher_activity_log(activity_date);
CREATE INDEX activity_log_type_idx ON teacher_activity_log(activity_type);
```

#### 2.7 `student_preferences` (For Excel import preference mapping)
Stores student scheduling preferences for admin mapping.

```sql
CREATE TABLE student_preferences (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  preferred_days VARCHAR(120),                    -- "Mon,Wed"
  preferred_time_start TIME,
  preferred_time_end TIME,
  preferred_class_type class_type,
  preferred_teacher_id TEXT REFERENCES teachers(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX student_preferences_student_idx ON student_preferences(student_id);
```

### Modified Tables

#### `students` — Remove `assignedTeacherId` and `assignedCourseId`
These become redundant since enrollment through sections handles this. Columns are removed via migration.

#### `assignments` — DROP TABLE
Fully replaced by `sections` + `enrollments` + `class_sessions`. Data is migrated during the schema transition, then the table is dropped.

#### `sessions` — DROP TABLE
Fully replaced by `class_sessions` + `session_attendance` + `session_reports`. Data is migrated during schema transition, then the table is dropped.

#### `homework` — DROP TABLE
Homework tracking is incorporated into `session_reports`. The `homework_given` and `homework_submitted` fields live on `session_reports`.

#### `progress` — DROP TABLE
Student progress tracking is incorporated into `session_reports` (strengths, weaknesses, recommended focus per session). A separate lightweight progress view can be computed from session reports.

#### `teacherPerformance` — DROP TABLE
Dynamically computed from `teacher_activity_log` and `session_reports`. No separate table needed.

### Relations (Drizzle)

```typescript
// sections
sectionsRelations = relations(sections, ({ one, many }) => ({
  teacher: one(teachers, { fields: [sections.teacherId], references: [teachers.id] }),
  course: one(courses, { fields: [sections.courseId], references: [courses.id] }),
  enrollments: many(enrollments),
  classSessions: many(classSessions),
}));

// enrollments
enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(students, { fields: [enrollments.studentId], references: [students.id] }),
  section: one(sections, { fields: [enrollments.sectionId], references: [sections.id] }),
}));

// class_sessions
classSessionsRelations = relations(classSessions, ({ one, many }) => ({
  section: one(sections, { fields: [classSessions.sectionId], references: [sections.id] }),
  attendance: many(sessionAttendance),
  report: one(sessionReports),
}));

// session_attendance
sessionAttendanceRelations = relations(sessionAttendance, ({ one }) => ({
  classSession: one(classSessions, { fields: [sessionAttendance.classSessionId], references: [classSessions.id] }),
  student: one(students, { fields: [sessionAttendance.studentId], references: [students.id] }),
}));

// session_reports
sessionReportsRelations = relations(sessionReports, ({ one }) => ({
  classSession: one(classSessions, { fields: [sessionReports.classSessionId], references: [classSessions.id] }),
  teacher: one(teachers, { fields: [sessionReports.teacherId], references: [teachers.id] }),
}));

// teacher_activity_log
teacherActivityLogRelations = relations(teacherActivityLog, ({ one }) => ({
  teacher: one(teachers, { fields: [teacherActivityLog.teacherId], references: [teachers.id] }),
  classSession: one(classSessions, { fields: [teacherActivityLog.classSessionId], references: [classSessions.id] }),
  section: one(sections, { fields: [teacherActivityLog.sectionId], references: [sections.id] }),
}));

// student_preferences
studentPreferencesRelations = relations(studentPreferences, ({ one }) => ({
  student: one(students, { fields: [studentPreferences.studentId], references: [students.id] }),
  preferredTeacher: one(teachers, { fields: [studentPreferences.preferredTeacherId], references: [teachers.id] }),
}));
```

---

## 3. UI/UX Architecture (Tailwind + shadcn/ui)

### 3.1 Installation Commands

```bash
# Tailwind CSS v4 (Vite plugin)
cd frontend
pnpm add tailwindcss @tailwindcss/vite

# shadcn/ui
pnpm add class-variance-authority clsx tailwind-merge lucide-react
pnpm add -D @types/node

# shadcn init (creates components.json, lib/utils.ts)
npx shadcn@latest init

# shadcn components to add
npx shadcn@latest add button card dialog dropdown-menu input label select separator sheet table tabs badge textarea avatar tooltip progress popover command

# For Excel parsing (backend)
cd ../backend
pnpm add xlsx

# For Excel upload (frontend)
cd ../frontend
pnpm add react-dropzone
```

### 3.2 Component Replacement Map

| Old Component | New (shadcn/ui) |
|---|---|
| `Panel` | `Card` (CardHeader + CardContent) |
| `Table` | shadcn `Table` (TableHeader + TableBody) |
| `Badge` | shadcn `Badge` |
| `MetricCard` | shadcn `Card` with custom layout |
| `Page` | Custom wrapper using shadcn layout patterns |
| `StatusMessage` | shadcn `Alert` or `Toast` (sonner) |
| `EmptyState` | Custom component using shadcn `Card` |
| `Skeleton` | shadcn `Skeleton` |
| `Toolbar`/SegmentedControl | shadcn `Tabs` or `ToggleGroup` |
| `ChangePasswordForm` | Dropdown menu dialog (see below) |
| Form fields (label + input) | shadcn `Label` + `Input` / `Select` |

### 3.3 Sidebar — User Menu (Replacing Dashboard Change Password)

Remove `ChangePasswordForm` from all dashboards. Add a user dropdown in the sidebar:

```
┌─────────────────────────────┐
│ 🔵 Speak To Reach          │
│    Admin User               │
│    [Admin badge]            │
├─────────────────────────────┤
│ 🏠 Dashboard                │
│ 👥 Sections                 │
│ 📚 Courses                  │
│ 📋 Assignments              │
│ 📅 Sessions                 │
│ 📝 Reports                  │
│ 💰 Payments                 │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 👤 Admin User        ▾ │ │  ← Dropdown trigger
│ │ └─────────────────────│ │
│ └─────────────────────────┘ │
│   Dropdown items:           │
│   - Settings (profile)      │
│   - Change Password (dialog)│
│   - Sign Out                │
└─────────────────────────────┘
```

The user dropdown appears at the bottom of the sidebar. Clicking it opens a dropdown with:
- **Settings** — opens a dialog/sheet with profile info + change password
- **Sign Out** — logs out

This applies to BOTH admin and teacher.

### 3.4 Admin Dashboard — Clean & Focused

**Only essential metrics:**

```
┌─────────────────────────────────────────────────┐
│ Admin Dashboard                                  │
│ Manage sections, teachers, and track operations  │
├─────────────────────────────────────────────────┤
│                                                  │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│ │Total │ │Active│ │Active│ │Today's│            │
│ │Active│ │Groups│ │Private│ │Classes│           │
│ │Teachers│     │ │Classes│ │      │            │
│ └──────┘ └──────┘ └──────┘ └──────┘            │
│                                                  │
│ ┌─────────────────────┐ ┌─────────────────────┐ │
│ │ Active Sections      │ │ Teacher Activity    │ │
│ │ (clickable rows →    │ │ This Month          │ │
│ │  section detail)     │ │ (payment audit)     │ │
│ └─────────────────────┘ └─────────────────────┘ │
│                                                  │
│ ┌─────────────────────┐ ┌─────────────────────┐ │
│ │ Recent Activity      │ │ Quick Actions       │ │
│ │ (recent sessions)    │ │ + New Section       │ │
│ │                      │ │ + Import Students   │ │
│ │                      │ │ + Add Teacher       │ │
│ └─────────────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Removed from dashboard:**
- ~~Register New Teacher form~~ → moved to dedicated Teachers page or quick action dialog
- ~~Register New Student form~~ → moved to Students page or Excel import
- ~~Assign Student to Teacher form~~ → replaced by Section enrollment model
- ~~Student Progress panel~~ → moved to Reports page

### 3.5 Admin Navigation

```
Admin:
  Dashboard (/)
  Sections (/sections)          ← NEW: replaces Assignments
  Students (/students)          ← existing, cleaned up
  Teachers (/teachers)          ← NEW: dedicated teachers management page
  Courses (/courses)            ← existing
  Sessions (/sessions)          ← existing, reworked for section-based view
  Reports (/reports)            ← existing, enhanced
  Payments (/payments)          ← NEW: teacher payment tracking

Teacher:
  Dashboard (/teacher)
  My Sections (/teacher/sections)  ← NEW: assigned sections
  My Students (/teacher/students)  ← NEW: students in my sections
```

### 3.6 Section Detail Page (Admin Drill-Down)

Route: `/sections/$sectionId`

```
┌─────────────────────────────────────────────────┐
│ ← Back to Sections                              │
│                                                  │
│ Beginner Group A                                │
│ Group · Mon,Wed,Fri · 09:00-10:00               │
│ Teacher: Maya · Course: Beginner English         │
├─────────────────────────────────────────────────┤
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Tabs: [Students] [Schedule] [Attendance]    │ │
│ │        [Reports] [Settings]                  │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ [Students tab]:                                 │
│   Enrolled students table with enrollment date  │
│   [+ Enroll Student] button                     │
│                                                  │
│ [Schedule tab]:                                 │
│   Calendar/list of upcoming class sessions      │
│   [+ Add Session] button                        │
│                                                  │
│ [Attendance tab]:                               │
│   Select a date → mark attendance for all       │
│   students in the group                         │
│   For Private: just the one student             │
│   For Group: checkbox per student               │
│                                                  │
│ [Reports tab]:                                  │
│   Teacher reports per session                   │
│   [+ Submit Report] button                      │
│                                                  │
│ [Settings tab]:                                 │
│   Edit section details, status                  │
│   End section button                            │
└─────────────────────────────────────────────────┘
```

### 3.7 Teacher Dashboard — Focused

```
┌─────────────────────────────────────────────────┐
│ Teacher Dashboard                                │
│ Welcome, Maya.                                   │
├─────────────────────────────────────────────────┤
│                                                  │
│ ┌──────┐ ┌──────┐ ┌──────┐                     │
│ │My    │ │Today's│ │Pending│                    │
│ │Sections│ │Sessions│ │Reports│                  │
│ └──────┘ └──────┘ └──────┘                     │
│                                                  │
│ ┌─────────────────────┐ ┌─────────────────────┐ │
│ │ My Sections          │ │ Today's Schedule    │ │
│ │ (clickable →         │ │ (upcoming sessions) │ │
│ │  section detail)     │ │                     │ │
│ └─────────────────────┘ └─────────────────────┘ │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Recent Activity                              │ │
│ │ (recent sessions submitted)                  │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 3.8 Teacher Attendance-Taking UI

When a teacher clicks on a session to take attendance:

**Private Session:**
```
┌─────────────────────────────────────┐
│ Session: Beginner Group A           │
│ Date: 2026-07-14 · Lesson 5        │
├─────────────────────────────────────┤
│                                     │
│ Student: Sara Al-Ali                │
│                                     │
│ ○ Present  ○ Absent  ○ Late  ○ Cancelled │
│                                     │
│ Notes: _________________________    │
│                                     │
│ [Submit Attendance]                 │
└─────────────────────────────────────┘
```

**Group Session:**
```
┌─────────────────────────────────────┐
│ Session: Beginner Group A           │
│ Date: 2026-07-14 · Lesson 5        │
├─────────────────────────────────────┤
│ Mark attendance for all students:   │
│                                     │
│ ☑ Sara Al-Ali     [Present ▾]      │
│ ☑ Ahmed Khan      [Present ▾]      │
│ ☐ Fatima Hassan   [Absent  ▾]      │
│ ☑ Omar Said       [Late    ▾]      │
│                                     │
│ Notes: _________________________    │
│                                     │
│ [Submit Attendance]                 │
└─────────────────────────────────────┘
```

### 3.9 Teacher Report UI — Private vs Group

**Private Session Report:**
```
┌─────────────────────────────────────┐
│ Session Report                      │
│ Student: Sara Al-Ali                │
│ Date: 2026-07-14                   │
├─────────────────────────────────────┤
│ Homework Given: _______________     │
│ Homework Submitted: ☐              │
│ Vocabulary: _______________         │
│ Grammar: _______________            │
│ Speaking: _______________           │
│ Reading: _______________            │
│ Writing: _______________            │
│ Listening: _______________          │
│ Notes: _______________              │
│                                     │
│ [Submit Report]                     │
└─────────────────────────────────────┘
```

**Group Session Report:**
```
┌─────────────────────────────────────┐
│ Session Report (Group)              │
│ Section: Beginner Group A           │
│ Date: 2026-07-14                   │
├─────────────────────────────────────┤
│ Homework Given: _______________     │
│ Vocabulary: _______________         │
│ Grammar: _______________            │
│ Speaking: _______________           │
│ Reading: _______________            │
│ Writing: _______________            │
│ Listening: _______________          │
│ General Notes: _______________      │
│                                     │
│ [Submit Report]                     │
│                                     │
│ ⚠ Group reports cover the whole    │
│ session — NOT per student.          │
└─────────────────────────────────────┘
```

### 3.10 Payment Tracking Page (Admin)

Route: `/payments`

```
┌─────────────────────────────────────────────────┐
│ Teacher Payments                                 │
│ Monthly activity and payment audit               │
├─────────────────────────────────────────────────┤
│                                                  │
│ Month: [July 2026 ▾]    Teacher: [All ▾]       │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Teacher         │ Classes │ Reports │ Total  │ │
│ │                 │ Taught  │ Submitted│ Hours  │ │
│ ├─────────────────┼─────────┼─────────┼────────┤ │
│ │ Maya            │   12    │   12    │  12h   │ │
│ │ Ahmad           │    8    │    7    │   8h   │ │
│ │ Sara T.         │   15    │   15    │  15h   │ │
│ └─────────────────┴─────────┴─────────┴────────┘ │
│                                                  │
│ [Export to Excel]                                │
│                                                  │
│ Click teacher row →                              │
│ ┌─────────────────────────────────────────────┐ │
│ │ Maya — July 2026 Activity Detail            │ │
│ │                                              │ │
│ │ Date       │ Section          │ Type   │ Dur │ │
│ │ 2026-07-01 │ Beginner Group A │ Group  │ 60m │ │
│ │ 2026-07-01 │ Private: Sara    │ Private│ 60m │ │
│ │ 2026-07-03 │ Beginner Group A │ Group  │ 60m │ │
│ │ ...                                           │ │
│ │                                              │ │
│ │ Total Classes: 12  │  Total Hours: 12       │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 4. Excel Import System

### 4.1 Expected Excel Columns

| Column | Required | Description |
|---|---|---|
| `student_name` | Yes | Full name |
| `email` | No | Email (if provided, creates user account) |
| `phone` | No | Phone number |
| `level` | Yes | One of: Beginner, Elementary, Pre-Intermediate, Intermediate, Upper Intermediate, Advanced |
| `class_type` | Yes | Private or Group |
| `preferred_days` | No | e.g., "Mon,Wed,Fri" |
| `preferred_time` | No | e.g., "09:00-10:00" |
| `preferred_teacher` | No | Teacher name (fuzzy matched) |
| `notes` | No | Any notes |

### 4.2 Import Flow

1. Admin navigates to Students page → clicks "Import from Excel"
2. Upload dialog appears (drag-and-drop zone using react-dropzone)
3. File is parsed on the frontend (using `xlsx` library on backend — see API design)
4. Preview table shows parsed rows with validation status (green/red)
5. Admin maps columns if auto-detection fails
6. Admin clicks "Import" → sends to `POST /api/import/students`
7. Backend validates, creates students, creates preferences, optionally creates user accounts
8. Returns summary: `{ imported: 15, skipped: 2, errors: [...] }`

### 4.3 Backend Import Endpoint

```
POST /api/import/students
Content-Type: multipart/form-data
Body: file (Excel/CSV)

Response: {
  imported: number,
  skipped: number,
  errors: Array<{ row: number; message: string }>,
  students: Student[]
}
```

### 4.4 Import Logic (Backend)

```typescript
// Pseudocode for import handler
async function importStudents(file: Buffer) {
  const workbook = XLSX.read(file, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const results = { imported: 0, skipped: 0, errors: [], students: [] };

  for (const [index, row] of rows.entries()) {
    try {
      // Validate required fields
      if (!row.student_name || !row.level || !row.class_type) {
        results.errors.push({ row: index + 2, message: 'Missing required fields' });
        continue;
      }

      // Validate level
      if (!VALID_LEVELS.includes(row.level)) {
        results.errors.push({ row: index + 2, message: `Invalid level: ${row.level}` });
        continue;
      }

      // Check for duplicate (by name + email)
      const existing = await repo.listStudents({ status: 'Active' });
      if (existing.find(s => s.studentName === row.student_name && s.email === row.email)) {
        results.skipped++;
        continue;
      }

      // Create student
      const student = await repo.createStudent({
        studentName: row.student_name,
        email: row.email || undefined,
        phone: row.phone || undefined,
        level: row.level,
        classType: row.class_type,
        registrationDate: new Date().toISOString().slice(0, 10),
      });

      // Create preferences
      if (row.preferred_days || row.preferred_time || row.preferred_teacher) {
        await repo.createStudentPreference({
          studentId: student.entity.id,
          preferredDays: row.preferred_days || undefined,
          preferredTimeStart: row.preferred_time?.split('-')[0] || undefined,
          preferredTimeEnd: row.preferred_time?.split('-')[1] || undefined,
          preferredTeacherId: matchedTeacherId || undefined,
        });
      }

      results.imported++;
      results.students.push(student.entity);
    } catch (err) {
      results.errors.push({ row: index + 2, message: err.message });
    }
  }

  return results;
}
```

---

## 5. Workflow & API Design

### 5.1 New API Endpoints

#### Sections
| Method | Path | Description |
|---|---|---|
| GET | `/api/sections` | List sections (filters: `?status=`, `?teacherId=`, `?classType=`) |
| POST | `/api/sections` | Create section |
| GET | `/api/sections/{id}` | Get section detail (with enrolled students) |
| PATCH | `/api/sections/{id}` | Update section |
| POST | `/api/sections/{id}/end` | End section |

#### Enrollments
| Method | Path | Description |
|---|---|---|
| GET | `/api/sections/{id}/enrollments` | List enrolled students in section |
| POST | `/api/sections/{id}/enrollments` | Enroll student in section |
| PATCH | `/api/enrollments/{id}` | Update enrollment (withdraw student) |

#### Class Sessions
| Method | Path | Description |
|---|---|---|
| GET | `/api/class-sessions` | List sessions (filters: `?sectionId=`, `?date=`, `?status=`, `?teacherId=`, `?view=today/this-week/calendar`) |
| POST | `/api/class-sessions` | Create class session |
| PATCH | `/api/class-sessions/{id}` | Update class session |
| POST | `/api/class-sessions/{id}/complete` | Mark session as completed |

#### Session Attendance
| Method | Path | Description |
|---|---|---|
| GET | `/api/class-sessions/{id}/attendance` | Get attendance for session |
| POST | `/api/class-sessions/{id}/attendance` | Submit attendance (bulk for group, single for private) |

#### Session Reports
| Method | Path | Description |
|---|---|---|
| GET | `/api/class-sessions/{id}/report` | Get report for session |
| POST | `/api/class-sessions/{id}/report` | Submit/create report |
| PATCH | `/api/reports/{id}` | Update report |

#### Import
| Method | Path | Description |
|---|---|---|
| POST | `/api/import/students` | Excel import (multipart/form-data) |

#### Teacher Payments
| Method | Path | Description |
|---|---|---|
| GET | `/api/payments` | Payment summary (filters: `?month=`, `?teacherId=`) |
| GET | `/api/payments/{teacherId}` | Detailed activity log for teacher |
| GET | `/api/payments/export` | Export payment data as Excel |

#### Activity Log
| Method | Path | Description |
|---|---|---|
| POST | `/api/activity-log` | Log teacher activity (internal) |
| GET | `/api/activity-log` | List activity logs (filters: `?teacherId=`, `?startDate=`, `?endDate=`) |

### 5.2 Modified Endpoints

#### Reports/Dashboard
| Method | Path | Description |
|---|---|---|
| GET | `/api/reports/admin` | Updated: section-based metrics instead of assignment-based |
| GET | `/api/reports/teachers/{id}` | Updated: teacher's sections, today's sessions, pending reports |

### 5.3 Private vs Group Logic in Code

```typescript
// When teacher submits attendance for a session:
async function submitAttendance(classSessionId: string, attendanceData: AttendancePayload[]) {
  const session = await getClassSession(classSessionId);
  const section = await getSection(session.sectionId);

  if (section.classType === 'Private') {
    // Private: exactly 1 attendance record
    if (attendanceData.length !== 1) throw new Error('Private sessions require exactly 1 attendance record');
    await createSessionAttendance({
      classSessionId,
      studentId: attendanceData[0].studentId,
      ...attendanceData[0],
    });
  } else {
    // Group: one attendance record per enrolled student
    const enrollments = await getEnrollments(section.id);
    for (const enrollment of enrollments) {
      const data = attendanceData.find(a => a.studentId === enrollment.studentId);
      await createSessionAttendance({
        classSessionId,
        studentId: enrollment.studentId,
        attendanceStatus: data?.attendanceStatus ?? 'Absent',
        present: data?.present ?? false,
        absent: data?.absent ?? true,
        late: data?.late ?? false,
        cancelled: data?.cancelled ?? false,
      });
    }
  }

  // Log activity
  await logActivity(session.teacherId, 'attendance_marked', classSessionId, session.sectionId);
}

// When teacher submits report for a session:
async function submitReport(classSessionId: string, reportData: ReportPayload) {
  const session = await getClassSession(classSessionId);
  const section = await getSection(session.sectionId);

  if (section.classType === 'Private') {
    // Private: report is for the one student (student context is implicit)
    await createSessionReport({
      classSessionId,
      teacherId: session.teacherId,
      ...reportData,
    });
  } else {
    // Group: report covers the whole group (NOT per student)
    await createSessionReport({
      classSessionId,
      teacherId: session.teacherId,
      generalNotes: reportData.generalNotes, // covers entire group
      ...reportData,
    });
  }

  await logActivity(session.teacherId, 'report_submitted', classSessionId, session.sectionId);
}
```

### 5.4 Payment Calculation Logic

```typescript
async function getPaymentSummary(month: string, teacherId?: string) {
  const startDate = `${month}-01`;
  const endDate = lastDayOfMonth(month);

  const activities = await repo.getActivityLog({
    teacherId,
    startDate,
    endDate,
  });

  // Group by teacher
  const byTeacher = groupBy(activities, 'teacherId');

  return Object.entries(byTeacher).map(([teacherId, logs]) => {
    const classesTaught = logs.filter(l => l.activityType === 'class_taught').length;
    const reportsSubmitted = logs.filter(l => l.activityType === 'report_submitted').length;
    const totalDuration = logs.reduce((sum, l) => sum + (l.metadata?.duration ?? 60), 0);

    return {
      teacherId,
      teacherName: getTeacherName(teacherId),
      classesTaught,
      reportsSubmitted,
      totalHours: totalDuration / 60,
      activityDetail: logs,
    };
  });
}
```

---

## 6. Migration Strategy

### Step 1: Setup Tailwind + shadcn/ui
- Install Tailwind CSS v4 (Vite plugin)
- Install shadcn/ui and initialize
- Add required shadcn components
- Migrate App.css → Tailwind utility classes
- Replace Panel, Table, Badge, MetricCard with shadcn equivalents

### Step 2: Remove Student Role
- Remove student navigation from `navigation.ts`
- Remove student route from `router.tsx`
- Remove student role from `ProtectedLayout.tsx` auth logic
- Remove `roleRedirect` student case
- Remove student demo account from `LoginPage.tsx`
- Remove `ChangePasswordForm` from dashboards (move to sidebar dropdown)

### Step 3: Backend Schema Extensions
- Create Drizzle migration: DROP old tables (assignments, sessions, homework, progress, teacherPerformance), DROP old columns from students
- Create Drizzle migration: CREATE new tables (sections, enrollments, class_sessions, session_attendance, session_reports, teacher_activity_log, student_preferences)
- Add 'Group' to class_type enum
- Add new enums (section_status, session_type, report_status, activity_type)
- Add Drizzle relations for new tables
- Update Zod contracts: remove old schemas (Assignment, Session, Homework, Progress, TeacherPerformance), add new schemas (Section, Enrollment, ClassSession, SessionAttendance, SessionReport, TeacherActivityLog, StudentPreference)
- Update AuthUser schema to remove 'student' role

### Step 4: Backend API Extensions
- **Remove** old endpoints: `/api/assignments/*`, `/api/sessions/*`, `/api/homework/*`, `/api/progress/*`, `/api/performance/*`
- **Replace** dashboard endpoints to use section-based data
- Add section CRUD endpoints (`/api/sections/*`)
- Add enrollment endpoints (`/api/sections/{id}/enrollments`)
- Add class session endpoints (`/api/class-sessions/*`)
- Add attendance submission endpoints (`/api/class-sessions/{id}/attendance`)
- Add report submission endpoints (`/api/class-sessions/{id}/report`)
- Add import endpoint (`/api/import/students` with xlsx)
- Add payment summary endpoint (`/api/payments`)
- Add activity log endpoints (`/api/activity-log`)
- Update auth: remove 'student' from login/register

### Step 5: Frontend — Admin Pages
- Refactor AdminDashboardPage (clean, focused — only metrics + section list + quick actions)
- Create SectionsPage (list + create dialog)
- Create SectionDetailPage (tabs: students, schedule, attendance, reports, settings)
- Create TeachersPage (dedicated teacher management with create/edit)
- Create PaymentsPage (monthly summary + drill-down)
- Add Excel import dialog to StudentsPage
- Update ReportsPage with section-based data
- Remove old AssignmentsPage, HomeworkPage (routes + components)

### Step 6: Frontend — Teacher Pages
- Refactor TeacherDashboardPage (clean, focused — sections + today's schedule + pending reports)
- Keep StudentsPage accessible to teachers (filtered to their sections)
- Keep StudentPage (`/students/$studentId`) accessible to teachers
- Create AttendanceTakingUI (inline on section detail page — conditional: private vs group)
- Create ReportSubmissionUI (inline on section detail page — conditional: private vs group)

### Step 7: Sidebar & Layout
- Add user dropdown menu to sidebar (change password dialog, sign out)
- Remove ChangePasswordForm from ALL pages (TeacherDashboardPage, StudentPage)
- Update navigation items (add Sections, Payments; remove Assignments, Homework)
- Update ProtectedLayout: remove student role handling entirely
- Update LoginPage: remove student demo account
- Delete App.css entirely

### Step 8: Verify & Clean
- Run `pnpm check` (TypeScript) in both packages
- Run `pnpm lint` in frontend
- Run `pnpm build` to verify no errors
- Delete unused components: old AssignmentList, HomeworkList, ProgressList, CalendarView
- Delete old pages: AssignmentsPage, HomeworkPage
- Clean up any remaining App.css references

---

## 7. Acceptance Criteria

### Private vs Group Logic
- [ ] When a section is marked as "Private", only one student is enrolled
- [ ] When a section is marked as "Group", multiple students can be enrolled
- [ ] For Private sessions: attendance form shows only the one student
- [ ] For Group sessions: attendance form shows all enrolled students with individual status dropdowns
- [ ] For Private sessions: report form is per-student context
- [ ] For Group sessions: report form covers the whole group (no per-student splitting)
- [ ] Creating a Private section with >1 student enrollment is rejected
- [ ] Session attendance records are created per student (both private and group)
- [ ] Session report records are created once per session (both private and group)

### Excel Import
- [ ] Admin can upload Excel/CSV file from Students page
- [ ] File is validated: required columns must exist (student_name, level, class_type)
- [ ] Preview shows parsed rows with validation status before import
- [ ] Import creates student records and preference records
- [ ] Duplicate students (same name + email) are skipped
- [ ] Import returns summary with counts and error details
- [ ] Invalid level/class_type values produce clear error messages

### UI Drill-Downs
- [ ] Admin dashboard shows total active sections, not total assignments
- [ ] Clicking a section in the dashboard navigates to section detail page
- [ ] Section detail page has tabbed navigation: Students, Schedule, Attendance, Reports
- [ ] Admin can enroll students in sections from the section detail page
- [ ] Admin can view attendance records per session from section detail
- [ ] Admin can view teacher reports per session from section detail

### Payment Tracking
- [ ] Admin can filter payments by month and teacher
- [ ] Payment summary shows: classes taught, reports submitted, total hours
- [ ] Clicking a teacher shows detailed activity log for the month
- [ ] Activity is logged automatically when attendance is marked and reports are submitted
- [ ] Payment data can be exported to Excel

### UX Cleanup
- [ ] Change Password is NOT on any dashboard page
- [ ] Change Password is accessible via user dropdown in sidebar (dialog/modal)
- [ ] Admin dashboard has NO registration forms (moved to dedicated pages/dialogs)
- [ ] Admin dashboard has NO assignment creation form (replaced by section enrollment)
- [ ] Student portal/role is completely removed (no student login, no student nav, no student routes)
- [ ] Teacher dashboard shows only essential info: my sections, today's schedule, pending reports
- [ ] All UI uses Tailwind CSS (no App.css remaining for component styles)

### System Integrity
- [ ] TypeScript compiles without errors in both frontend and backend
- [ ] Lint passes without errors
- [ ] Build succeeds (`pnpm build`)
- [ ] Old tables (assignments, sessions, homework, progress, teacherPerformance) are dropped
- [ ] App.css is fully deleted — no references remain
- [ ] Student role is completely removed (no student login, no student nav, no student routes)
- [ ] All existing features (create teacher, create student, create course) still work through new routes
- [ ] New features (sections, attendance, reports, payments) require DATABASE_URL
- [ ] Memory fallback still works for basic teacher/student/course CRUD
- [ ] Teacher can view individual student detail page (`/students/$studentId`)

---

## 8. File-by-File Change Summary

### Backend Files to Create/Modify

| File | Action | Description |
|---|---|---|
| `backend/src/db/schema.ts` | REWRITE | Drop old tables, add 7 new tables + relations + enums |
| `backend/src/domain/contracts.ts` | REWRITE | Remove old Zod schemas, add new ones for Section, Enrollment, ClassSession, etc. |
| `backend/src/index.ts` | REWRITE | Remove old routes, add ~15 new route handlers |
| `backend/src/repositories/drizzle.ts` | REWRITE | Remove old methods, add new repository methods |
| `backend/src/repositories/memory.ts` | MINIMAL | Keep basic teacher/student/course CRUD. No new table support. |
| `backend/drizzle/0002_*.sql` | CREATE | Migration: drop old tables, create new tables |

### Frontend Files to Create/Modify

| File | Action | Description |
|---|---|---|
| `frontend/package.json` | MODIFY | Add tailwindcss, shadcn deps, react-dropzone, xlsx |
| `frontend/vite.config.ts` | MODIFY | Add Tailwind CSS plugin |
| `frontend/src/index.css` | REWRITE | Tailwind directives only |
| `frontend/src/App.css` | DELETE | Replaced by Tailwind |
| `frontend/src/components.json` | CREATE | shadcn/ui config |
| `frontend/src/lib/utils.ts` | CREATE | shadcn/ui cn() utility |
| `frontend/src/components/ui/*` | CREATE | ~15 shadcn/ui components |
| `frontend/src/components/layout/ProtectedLayout.tsx` | REWRITE | 2-role system + user dropdown sidebar |
| `frontend/src/lib/navigation.ts` | REWRITE | New nav items for admin/teacher |
| `frontend/src/lib/router.tsx` | REWRITE | New routes, remove old ones |
| `frontend/src/lib/role-redirect.ts` | MODIFY | Remove student case |
| `frontend/src/pages/AdminDashboardPage.tsx` | REWRITE | Clean, focused dashboard |
| `frontend/src/pages/TeacherDashboardPage.tsx` | REWRITE | Clean, focused dashboard |
| `frontend/src/pages/StudentsPage.tsx` | MODIFY | Add Excel import dialog |
| `frontend/src/pages/LoginPage.tsx` | MODIFY | Remove student demo |
| `frontend/src/api.ts` | REWRITE | New API methods, remove old ones |
| `frontend/src/pages/SectionsPage.tsx` | CREATE | Sections list + create |
| `frontend/src/pages/SectionDetailPage.tsx` | CREATE | Section detail with tabs |
| `frontend/src/pages/TeachersPage.tsx` | CREATE | Teachers management |
| `frontend/src/pages/PaymentsPage.tsx` | CREATE | Payment tracking |
| `frontend/src/components/UserMenu.tsx` | CREATE | Sidebar user dropdown + change password dialog |
| `frontend/src/components/ImportStudentsDialog.tsx` | CREATE | Excel import dialog |
| `frontend/src/components/AttendanceForm.tsx` | CREATE | Conditional attendance UI |
| `frontend/src/components/ReportForm.tsx` | CREATE | Conditional report UI |
| `frontend/src/pages/AssignmentsPage.tsx` | DELETE | Replaced by SectionsPage |
| `frontend/src/pages/HomeworkPage.tsx` | DELETE | Homework tracked in session reports |
| `frontend/src/components/forms/ChangePasswordForm.tsx` | MOVE | Moved into UserMenu dialog |
| `frontend/src/components/lists/AssignmentList.tsx` | DELETE | No more assignments |
| `frontend/src/components/lists/HomeworkList.tsx` | DELETE | No more homework table |
| `frontend/src/components/lists/ProgressList.tsx` | DELETE | Progress computed from reports |
| `frontend/src/components/lists/CalendarView.tsx` | DELETE | Replaced by section schedule view |
| `frontend/src/components/lists/DashboardGrid.tsx` | DELETE | Dashboard rewritten from scratch |
| `frontend/src/components/ui/Panel.tsx` | DELETE | Replaced by shadcn Card |
| `frontend/src/components/ui/Table.tsx` | DELETE | Replaced by shadcn Table |
| `frontend/src/components/ui/Badge.tsx` | DELETE | Replaced by shadcn Badge |
| `frontend/src/components/ui/MetricCard.tsx` | DELETE | Replaced by shadcn Card |
| `frontend/src/components/ui/Page.tsx` | DELETE | Replaced by Tailwind layout |
| `frontend/src/components/ui/EmptyState.tsx` | DELETE | Replaced by shadcn pattern |
| `frontend/src/components/ui/StatusMessage.tsx` | DELETE | Replaced by shadcn Alert/Toast |
| `frontend/src/components/ui/Skeleton.tsx` | DELETE | Replaced by shadcn Skeleton |
| `frontend/src/components/ui/QueryFeedback.tsx` | DELETE | Inlined or replaced by shadcn patterns |
