import { Client } from '@notionhq/client';

export type NotionPropertyType =
  | 'title'
  | 'rich_text'
  | 'phone_number'
  | 'email'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'number'
  | 'checkbox'
  | 'relation'
  | 'rollup'
  | 'formula';

export type NotionDatabaseSpec = {
  key: string;
  icon: string;
  title: string;
  properties: { name: string; type: NotionPropertyType; options?: string[]; relationTo?: string; rollup?: string }[];
  views: { name: string; type: 'table' | 'board' | 'calendar' | 'list'; filter?: string; sort?: string }[];
};

export const notionDatabases: NotionDatabaseSpec[] = [
  {
    key: 'teachers',
    icon: '👩‍🏫',
    title: 'Teachers',
    properties: [
      { name: 'Teacher Name', type: 'title' },
      { name: 'Phone', type: 'phone_number' },
      { name: 'Email', type: 'email' },
      { name: 'Status', type: 'select', options: ['Active', 'Inactive'] },
      { name: 'Hire Date', type: 'date' },
      { name: 'Notes', type: 'rich_text' },
      { name: 'Students', type: 'relation', relationTo: 'students' },
      { name: 'Sessions', type: 'relation', relationTo: 'sessions' },
      { name: 'Homework', type: 'relation', relationTo: 'homework' },
      { name: 'Performance', type: 'relation', relationTo: 'teacherPerformance' },
    ],
    views: [
      { name: 'Active Teachers', type: 'table', filter: 'Status is Active', sort: 'Teacher Name ascending' },
      { name: 'Inactive Teachers', type: 'table', filter: 'Status is Inactive', sort: 'Teacher Name ascending' },
    ],
  },
  {
    key: 'students',
    icon: '🧑‍🎓',
    title: 'Students',
    properties: [
      { name: 'Student Name', type: 'title' },
      { name: 'Phone', type: 'phone_number' },
      { name: 'Email', type: 'email' },
      { name: 'Level', type: 'select', options: ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper Intermediate', 'Advanced'] },
      { name: 'Class Type', type: 'select', options: ['Private', 'Mini Group'] },
      { name: 'Status', type: 'select', options: ['Active', 'Paused', 'Completed'] },
      { name: 'Registration Date', type: 'date' },
      { name: 'Assigned Teacher', type: 'relation', relationTo: 'teachers' },
      { name: 'Assigned Course', type: 'relation', relationTo: 'courses' },
      { name: 'Notes', type: 'rich_text' },
      { name: 'Sessions', type: 'relation', relationTo: 'sessions' },
      { name: 'Homework', type: 'relation', relationTo: 'homework' },
      { name: 'Progress', type: 'relation', relationTo: 'progress' },
      { name: 'Attendance %', type: 'rollup', rollup: 'Sessions → Present/Late count ÷ completed sessions' },
    ],
    views: [
      { name: 'Active Students', type: 'table', filter: 'Status is Active', sort: 'Student Name ascending' },
      { name: 'Private Students', type: 'table', filter: 'Class Type is Private' },
      { name: 'Group Students', type: 'table', filter: 'Class Type is Mini Group' },
      { name: 'Completed Students', type: 'table', filter: 'Status is Completed' },
    ],
  },
  {
    key: 'courses',
    icon: '📚',
    title: 'Courses',
    properties: [
      { name: 'Course Name', type: 'title' },
      { name: 'Level', type: 'select', options: ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper Intermediate', 'Advanced'] },
      { name: 'Total Units', type: 'number' },
      { name: 'Total Lessons', type: 'number' },
      { name: 'Description', type: 'rich_text' },
      { name: 'Students', type: 'relation', relationTo: 'students' },
      { name: 'Assignments', type: 'relation', relationTo: 'assignments' },
    ],
    views: [{ name: 'All Courses', type: 'table', sort: 'Level ascending' }],
  },
  {
    key: 'assignments',
    icon: '🗓️',
    title: 'Class Assignments',
    properties: [
      { name: 'Assignment Name', type: 'title' },
      { name: 'Teacher', type: 'relation', relationTo: 'teachers' },
      { name: 'Student', type: 'relation', relationTo: 'students' },
      { name: 'Course', type: 'relation', relationTo: 'courses' },
      { name: 'Days', type: 'multi_select' },
      { name: 'Time', type: 'rich_text' },
      { name: 'Start Date', type: 'date' },
      { name: 'End Date', type: 'date' },
      { name: 'Classroom / Online', type: 'select', options: ['Classroom', 'Online'] },
      { name: 'Status', type: 'select', options: ['Active', 'Upcoming', 'Ended', 'Cancelled'] },
      { name: 'Sessions', type: 'relation', relationTo: 'sessions' },
    ],
    views: [
      { name: 'Active Classes', type: 'table', filter: 'Status is Active' },
      { name: 'Private Classes', type: 'table', filter: 'Related Student → Class Type is Private' },
      { name: 'Mini Group Classes', type: 'table', filter: 'Related Student → Class Type is Mini Group' },
      { name: 'By Teacher', type: 'board', sort: 'Teacher ascending' },
      { name: 'By Student', type: 'board', sort: 'Student ascending' },
    ],
  },
  {
    key: 'sessions',
    icon: '✅',
    title: 'Class Sessions',
    properties: [
      { name: 'Session Name', type: 'title' },
      { name: 'Date', type: 'date' },
      { name: 'Teacher', type: 'relation', relationTo: 'teachers' },
      { name: 'Student', type: 'relation', relationTo: 'students' },
      { name: 'Assignment', type: 'relation', relationTo: 'assignments' },
      { name: 'Lesson Number', type: 'number' },
      { name: 'Lesson Title', type: 'rich_text' },
      { name: 'Attendance', type: 'select', options: ['Present', 'Absent', 'Late', 'Cancelled'] },
      { name: 'Present', type: 'checkbox' },
      { name: 'Absent', type: 'checkbox' },
      { name: 'Late', type: 'checkbox' },
      { name: 'Cancelled', type: 'checkbox' },
      { name: 'Duration', type: 'number' },
      { name: 'Homework Given', type: 'rich_text' },
      { name: 'Homework Submitted', type: 'checkbox' },
      { name: 'Vocabulary Covered', type: 'rich_text' },
      { name: 'Grammar Covered', type: 'rich_text' },
      { name: 'Speaking Practice', type: 'rich_text' },
      { name: 'Reading Practice', type: 'rich_text' },
      { name: 'Writing Practice', type: 'rich_text' },
      { name: 'Listening Practice', type: 'rich_text' },
      { name: 'Teacher Notes', type: 'rich_text' },
    ],
    views: [
      { name: "Today’s Sessions", type: 'table', filter: 'Date is today', sort: 'Time ascending' },
      { name: 'This Week', type: 'table', filter: 'Date is this week', sort: 'Date ascending' },
      { name: 'Calendar', type: 'calendar', sort: 'Date ascending' },
      { name: 'By Teacher', type: 'board', sort: 'Teacher ascending' },
      { name: 'By Student', type: 'board', sort: 'Student ascending' },
      { name: 'Attendance Report', type: 'table', filter: 'Attendance is not empty' },
    ],
  },
  {
    key: 'homework',
    icon: '📝',
    title: 'Homework',
    properties: [
      { name: 'Homework', type: 'title' },
      { name: 'Student', type: 'relation', relationTo: 'students' },
      { name: 'Teacher', type: 'relation', relationTo: 'teachers' },
      { name: 'Session', type: 'relation', relationTo: 'sessions' },
      { name: 'Due Date', type: 'date' },
      { name: 'Submitted', type: 'checkbox' },
      { name: 'Score', type: 'number' },
      { name: 'Feedback', type: 'rich_text' },
    ],
    views: [
      { name: 'Pending Homework', type: 'table', filter: 'Submitted unchecked', sort: 'Due Date ascending' },
      { name: 'Completed Homework', type: 'table', filter: 'Submitted checked', sort: 'Due Date descending' },
    ],
  },
  {
    key: 'progress',
    icon: '📈',
    title: 'Student Progress',
    properties: [
      { name: 'Student', type: 'title' },
      { name: 'Teacher', type: 'relation', relationTo: 'teachers' },
      { name: 'Current Unit', type: 'number' },
      { name: 'Current Lesson', type: 'number' },
      { name: 'Last Lesson Date', type: 'date' },
      { name: 'Completion Percentage', type: 'number' },
      { name: 'Strengths', type: 'rich_text' },
      { name: 'Weaknesses', type: 'rich_text' },
      { name: 'Recommended Focus', type: 'rich_text' },
    ],
    views: [{ name: 'Student Progress', type: 'table', sort: 'Completion Percentage ascending' }],
  },
  {
    key: 'teacherPerformance',
    icon: '🏅',
    title: 'Teacher Performance',
    properties: [
      { name: 'Teacher', type: 'title' },
      { name: 'Total Assigned Classes', type: 'number' },
      { name: 'Classes Completed', type: 'number' },
      { name: 'Attendance Reports Submitted', type: 'number' },
      { name: 'Student Attendance %', type: 'number' },
      { name: 'Homework Completion %', type: 'number' },
      { name: 'Notes', type: 'rich_text' },
    ],
    views: [{ name: 'Teacher Performance', type: 'table', sort: 'Student Attendance % ascending' }],
  },
  {
    key: 'reports',
    icon: '📊',
    title: 'Reports',
    properties: [
      { name: 'Report', type: 'title' },
      { name: 'Status', type: 'select', options: ['Open', 'Reviewed'] },
      { name: 'Notes', type: 'rich_text' },
    ],
    views: [
      { name: 'Today’s Classes', type: 'table', filter: 'Assignments where Start Date on or before today and Status Active' },
      { name: 'Today’s Attendance', type: 'table', filter: 'Sessions where Date is today' },
      { name: 'This Week’s Lessons', type: 'table', filter: 'Sessions where Date is this week' },
      { name: 'Students with Low Attendance', type: 'table', filter: 'Students where Attendance % below 75' },
      { name: 'Teachers with Missing Lesson Reports', type: 'table', filter: 'Active teachers with today assignment but no session' },
      { name: 'Students Behind Schedule', type: 'table', filter: 'Progress completion behind expected pace' },
      { name: 'Active Teachers', type: 'table', filter: 'Teachers where Status Active' },
      { name: 'Active Students', type: 'table', filter: 'Students where Status Active' },
    ],
  },
];

export const homePageSpec = {
  title: '🎓 Speak To Reach Management System',
  sections: [
    'Admin Dashboard',
    'Teachers',
    'Students',
    'Courses',
    'Class Assignments',
    'Class Sessions',
    'Attendance',
    'Homework',
    'Student Progress',
    'Teacher Performance',
    'Reports',
  ],
};

export const adminDashboardSections = [
  'Today’s Classes',
  'Today’s Attendance',
  'Upcoming Classes',
  'Recent Lesson Reports',
  'Teacher Performance',
  'Student Progress',
  'Homework Pending',
  'Recently Registered Students',
  'Calendar',
];

export const teacherTemplateSections = [
  'Today’s Classes',
  'This Week’s Schedule',
  'My Students',
  'Lesson Reports',
  'Attendance',
  'Homework',
  'Student Progress',
  'Quick Add Lesson Session',
  'Quick Add Attendance',
];

export const studentTemplateSections = [
  'Assigned Teacher',
  'Assigned Course',
  'Attendance History',
  'Lesson History',
  'Homework',
  'Progress',
  'Teacher Notes',
];

export function buildNotionSetupChecklist() {
  return {
    homePage: homePageSpec,
    databases: notionDatabases,
    templates: {
      teacherDashboardTemplate: teacherTemplateSections.map((section) => ({ section, filter: 'Teacher equals this teacher' })),
      studentPageTemplate: studentTemplateSections,
      adminDashboard: adminDashboardSections,
    },
    automationNotes: [
      'Create the home page, then create databases in order so relation targets exist.',
      'Create linked database views on dashboards using the filters listed in each view.',
      'Use Class Sessions as the source of truth: one completed lesson equals one session record.',
      'Roll up student attendance from Sessions and teacher metrics from Assignments, Sessions, and Homework.',
      'If Notion API view/template creation is unavailable for the workspace, the app renders equivalent filtered views and this checklist is the manual import guide.',
    ],
  };
}

export async function createNotionWorkspace(options: { notionToken?: string; parentPageId?: string }) {
  if (!options.notionToken || !options.parentPageId) {
    return { mode: 'checklist' as const, checklist: buildNotionSetupChecklist() };
  }

  const notion = new Client({ auth: options.notionToken });
  const home = await notion.pages.create({
    parent: { page_id: options.parentPageId },
    icon: { type: 'emoji', emoji: '🎓' },
    properties: {
      title: [{ type: 'text', text: { content: homePageSpec.title } }] as any,
    },
    children: homePageSpec.sections.map((section) => ({
      object: 'block',
      type: 'callout',
      callout: {
        icon: { type: 'emoji', emoji: '📌' },
        rich_text: [{ type: 'text', text: { content: section } }],
      },
    })) as any,
  });

  return {
    mode: 'created-home-page' as const,
    homePageId: home.id,
    checklist: buildNotionSetupChecklist(),
    note: 'The Notion public API can create pages/databases, but native database view and template automation varies by API version. Use the checklist to finish linked views/templates if your API version does not expose them.',
  };
}
