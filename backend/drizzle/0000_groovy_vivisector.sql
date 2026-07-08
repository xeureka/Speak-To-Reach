CREATE TYPE "public"."assignment_status" AS ENUM('Active', 'Upcoming', 'Ended', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('Present', 'Absent', 'Late', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."class_type" AS ENUM('Private', 'Mini Group');--> statement-breakpoint
CREATE TYPE "public"."delivery_mode" AS ENUM('Classroom', 'Online');--> statement-breakpoint
CREATE TYPE "public"."student_level" AS ENUM('Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper Intermediate', 'Advanced');--> statement-breakpoint
CREATE TYPE "public"."student_status" AS ENUM('Active', 'Paused', 'Completed');--> statement-breakpoint
CREATE TYPE "public"."teacher_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'teacher', 'student');--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"assignment_name" varchar(220) NOT NULL,
	"teacher_id" text NOT NULL,
	"student_id" text NOT NULL,
	"course_id" text NOT NULL,
	"days" varchar(120) NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time,
	"start_date" date NOT NULL,
	"end_date" date,
	"mode" "delivery_mode" NOT NULL,
	"status" "assignment_status" DEFAULT 'Active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" text PRIMARY KEY NOT NULL,
	"course_name" varchar(180) NOT NULL,
	"level" "student_level" NOT NULL,
	"total_units" integer NOT NULL,
	"total_lessons" integer NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "homework" (
	"id" text PRIMARY KEY NOT NULL,
	"homework" text NOT NULL,
	"student_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"session_id" text,
	"due_date" date NOT NULL,
	"submitted" boolean DEFAULT false NOT NULL,
	"score" numeric(5, 2),
	"feedback" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "progress" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"current_unit" integer DEFAULT 1 NOT NULL,
	"current_lesson" integer DEFAULT 1 NOT NULL,
	"last_lesson_date" date,
	"completion_percentage" numeric(5, 2) DEFAULT '0' NOT NULL,
	"strengths" text,
	"weaknesses" text,
	"recommended_focus" text,
	"manual_override_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"session_name" varchar(240) NOT NULL,
	"session_date" date NOT NULL,
	"teacher_id" text NOT NULL,
	"student_id" text NOT NULL,
	"assignment_id" text NOT NULL,
	"lesson_number" integer NOT NULL,
	"lesson_title" varchar(240) NOT NULL,
	"attendance" "attendance_status" NOT NULL,
	"present" boolean DEFAULT false NOT NULL,
	"absent" boolean DEFAULT false NOT NULL,
	"late" boolean DEFAULT false NOT NULL,
	"cancelled" boolean DEFAULT false NOT NULL,
	"duration_minutes" integer,
	"homework_given" text,
	"homework_submitted" boolean DEFAULT false NOT NULL,
	"vocabulary_covered" text,
	"grammar_covered" text,
	"speaking_practice" text,
	"reading_practice" text,
	"writing_practice" text,
	"listening_practice" text,
	"teacher_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" text PRIMARY KEY NOT NULL,
	"student_name" varchar(160) NOT NULL,
	"phone" varchar(80),
	"email" varchar(240),
	"level" "student_level" NOT NULL,
	"class_type" "class_type" NOT NULL,
	"status" "student_status" DEFAULT 'Active' NOT NULL,
	"registration_date" date NOT NULL,
	"assigned_teacher_id" text,
	"assigned_course_id" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "teacher_performance" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"total_assigned_classes" integer DEFAULT 0 NOT NULL,
	"classes_completed" integer DEFAULT 0 NOT NULL,
	"attendance_reports_submitted" integer DEFAULT 0 NOT NULL,
	"student_attendance_percentage" numeric(5, 2) DEFAULT '0' NOT NULL,
	"homework_completion_percentage" numeric(5, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "teachers" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_name" varchar(160) NOT NULL,
	"phone" varchar(80),
	"email" varchar(240) NOT NULL,
	"status" "teacher_status" DEFAULT 'active' NOT NULL,
	"hire_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "teachers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"email" varchar(240) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'teacher' NOT NULL,
	"teacher_id" text,
	"student_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress" ADD CONSTRAINT "progress_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress" ADD CONSTRAINT "progress_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_assigned_teacher_id_teachers_id_fk" FOREIGN KEY ("assigned_teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_assigned_course_id_courses_id_fk" FOREIGN KEY ("assigned_course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_performance" ADD CONSTRAINT "teacher_performance_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assignments_teacher_idx" ON "assignments" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "assignments_student_idx" ON "assignments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "assignments_course_idx" ON "assignments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "assignments_status_idx" ON "assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "courses_level_idx" ON "courses" USING btree ("level");--> statement-breakpoint
CREATE INDEX "homework_student_idx" ON "homework" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "homework_teacher_idx" ON "homework" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "homework_due_idx" ON "homework" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "homework_submitted_idx" ON "homework" USING btree ("submitted");--> statement-breakpoint
CREATE INDEX "progress_student_idx" ON "progress" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "progress_teacher_idx" ON "progress" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "sessions_teacher_date_idx" ON "sessions" USING btree ("teacher_id","session_date");--> statement-breakpoint
CREATE INDEX "sessions_student_date_idx" ON "sessions" USING btree ("student_id","session_date");--> statement-breakpoint
CREATE INDEX "sessions_assignment_idx" ON "sessions" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "sessions_attendance_idx" ON "sessions" USING btree ("attendance");--> statement-breakpoint
CREATE INDEX "sessions_date_idx" ON "sessions" USING btree ("session_date");--> statement-breakpoint
CREATE INDEX "students_status_idx" ON "students" USING btree ("status");--> statement-breakpoint
CREATE INDEX "students_class_type_idx" ON "students" USING btree ("class_type");--> statement-breakpoint
CREATE INDEX "students_level_idx" ON "students" USING btree ("level");--> statement-breakpoint
CREATE INDEX "students_teacher_idx" ON "students" USING btree ("assigned_teacher_id");--> statement-breakpoint
CREATE INDEX "students_course_idx" ON "students" USING btree ("assigned_course_id");--> statement-breakpoint
CREATE INDEX "teacher_performance_teacher_idx" ON "teacher_performance" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "teachers_status_idx" ON "teachers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "teachers_email_idx" ON "teachers" USING btree ("email");