/** Centralised route path constants — avoids magic strings across the app */
export const ROUTES = {
  // Public website (no auth required)
  HOME:         '/',
  ABOUT:        '/about',
  CONTACT:      '/contact',

  // Auth
  LOGIN:        '/login',
  OTP_LOGIN:    '/login/otp',
  UNAUTHORIZED: '/unauthorized',

  // Dashboard
  DASHBOARD:    '/dashboard',

  // Admission
  ADMISSION:          '/admission',
  ADMISSION_NEW:      '/admission/new',
  ADMISSION_DETAIL:   '/admission/:id',

  // Students
  STUDENTS:           '/students',
  STUDENT_NEW:        '/students/new',
  STUDENT_DETAIL:     '/students/:id',
  STUDENT_EDIT:       '/students/:id/edit',

  // Attendance
  ATTENDANCE:         '/attendance',
  ATTENDANCE_MARK:    '/attendance/mark',
  ATTENDANCE_REPORT:  '/attendance/report',

  // Examination
  EXAMINATIONS:         '/examinations',
  EXAMINATION_NEW:      '/examinations/new',
  EXAMINATION_DETAIL:   '/examinations/:id',
  EXAMINATION_EDIT:     '/examinations/:id/edit',
  EXAMINATION_RESULTS:  '/examinations/:id/results',

  // Fees
  FEES:               '/fees',
  FEE_INVOICES:       '/fees/invoices',
  FEE_PAYMENTS:       '/fees/payments',
  FEE_STRUCTURES:     '/fees/structures',

  // Communication
  COMMUNICATION:      '/communication',
  ANNOUNCEMENTS:      '/communication/announcements',
  MESSAGES:           '/communication/messages',

  // Reports
  REPORTS:            '/reports',
  REPORT_ATTENDANCE:  '/reports/attendance',
  REPORT_FEES:        '/reports/fees',
  REPORT_ACADEMIC:    '/reports/academic',

  // Profile
  PROFILE: '/profile',
} as const;
