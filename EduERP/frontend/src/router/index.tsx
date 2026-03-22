import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './routeConstants';
import AuthGuard from '../components/guards/AuthGuard';
import RoleGuard from '../components/guards/RoleGuard';
import PrivateLayout from '../components/layout/PrivateLayout';
import PublicLayout from '../components/layout/PublicLayout';
import PublicWebsiteLayout from '../components/layout/PublicWebsiteLayout';
import { useAppDispatch } from '../app/store';
import { initializeSession } from '../features/auth/store/authSlice';

// ── Lazy imports — code-split per feature ────────────────────────────────────
const LoginPage         = React.lazy(() => import('../features/auth/pages/LoginPage'));
const OtpLoginPage      = React.lazy(() => import('../features/auth/pages/OtpLoginPage'));
const UnauthorizedPage  = React.lazy(() => import('../components/common/UnauthorizedPage'));

const HomePage          = React.lazy(() => import('../features/public/pages/HomePage'));
const AboutPage         = React.lazy(() => import('../features/public/pages/AboutPage'));
const ContactPage       = React.lazy(() => import('../features/public/pages/ContactPage'));

const Dashboard         = React.lazy(() => import('../features/dashboard/pages/DashboardPage'));

const AdmissionList     = React.lazy(() => import('../features/admission/pages/AdmissionListPage'));
const AdmissionForm     = React.lazy(() => import('../features/admission/pages/AdmissionFormPage'));
const AdmissionDetail   = React.lazy(() => import('../features/admission/pages/AdmissionDetailPage'));

const StudentList       = React.lazy(() => import('../features/students/pages/StudentListPage'));
const StudentForm       = React.lazy(() => import('../features/students/pages/StudentFormPage'));
const StudentDetail     = React.lazy(() => import('../features/students/pages/StudentDetailPage'));

const AttendanceMark    = React.lazy(() => import('../features/attendance/pages/AttendanceMarkPage'));
const AttendanceReport  = React.lazy(() => import('../features/attendance/pages/AttendanceReportPage'));

const ExaminationList    = React.lazy(() => import('../features/examination/pages/ExaminationListPage'));
const ExaminationForm    = React.lazy(() => import('../features/examination/pages/ExaminationFormPage'));
const ExaminationDetail  = React.lazy(() => import('../features/examination/pages/ExaminationDetailPage'));
const ExaminationResults = React.lazy(() => import('../features/examination/pages/ExaminationResultsPage'));

const FeeInvoices       = React.lazy(() => import('../features/fees/pages/FeeInvoicesPage'));
const FeePayments       = React.lazy(() => import('../features/fees/pages/FeePaymentsPage'));
const FeeStructures     = React.lazy(() => import('../features/fees/pages/FeeStructuresPage'));

const Announcements     = React.lazy(() => import('../features/communication/pages/AnnouncementsPage'));
const Messages          = React.lazy(() => import('../features/communication/pages/MessagesPage'));

const ReportAttendance  = React.lazy(() => import('../features/reports/pages/ReportAttendancePage'));
const ReportAttendanceStudent = React.lazy(() => import('../features/reports/pages/ReportAttendanceStudentPage'));
const ReportLowAttendance = React.lazy(() => import('../features/reports/pages/ReportLowAttendancePage'));
const ReportFees        = React.lazy(() => import('../features/reports/pages/ReportFeesPage'));
const ReportFeesPayments = React.lazy(() => import('../features/reports/pages/ReportPaymentHistoryPage'));
const ReportAcademic    = React.lazy(() => import('../features/reports/pages/ReportAcademicPage'));
const ReportCard        = React.lazy(() => import('../features/reports/pages/ReportCardPage'));
const ReportSubjectPerf = React.lazy(() => import('../features/reports/pages/ReportSubjectPerformancePage'));
const ReportEnrollment  = React.lazy(() => import('../features/reports/pages/ReportStudentEnrollmentPage'));
const ReportDirectory   = React.lazy(() => import('../features/reports/pages/ReportStudentDirectoryPage'));
const ReportAdmission   = React.lazy(() => import('../features/reports/pages/ReportAdmissionPage'));

// ── Page-level loading fallback ───────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex h-full items-center justify-center p-12">
    <span className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
  </div>
);

// ── Router ────────────────────────────────────────────────────────────────────
export default function AppRouter() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(initializeSession());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Public Website (no auth required) ─────────────────── */}
          <Route element={<PublicWebsiteLayout />}>
            <Route path={ROUTES.HOME}    element={<HomePage />} />
            <Route path={ROUTES.ABOUT}   element={<AboutPage />} />
            <Route path={ROUTES.CONTACT} element={<ContactPage />} />
          </Route>

          {/* ── Auth Routes ────────────────────────────────────────────── */}
          <Route element={<PublicLayout />}>
            <Route path={ROUTES.LOGIN}     element={<LoginPage />} />
            <Route path={ROUTES.OTP_LOGIN} element={<OtpLoginPage />} />
          </Route>

          <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

          {/* ── Protected Routes — require any authenticated role ───────── */}
          <Route
            element={
              <AuthGuard>
                <PrivateLayout />
              </AuthGuard>
            }
          >
            <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />

            {/* Admission — Admin only */}
            <Route
              path={ROUTES.ADMISSION}
              element={
                <RoleGuard allowedRoles={['Admin']}>
                  <AdmissionList />
                </RoleGuard>
              }
            />
            <Route
              path={ROUTES.ADMISSION_NEW}
              element={
                <RoleGuard allowedRoles={['Admin']}>
                  <AdmissionForm />
                </RoleGuard>
              }
            />
            <Route
              path={ROUTES.ADMISSION_DETAIL}
              element={
                <RoleGuard allowedRoles={['Admin']}>
                  <AdmissionDetail />
                </RoleGuard>
              }
            />

            {/* Students — Admin + Teacher */}
            <Route
              path={ROUTES.STUDENTS}
              element={
                <RoleGuard allowedRoles={['Admin', 'Teacher']}>
                  <StudentList />
                </RoleGuard>
              }
            />
            <Route
              path={ROUTES.STUDENT_NEW}
              element={
                <RoleGuard allowedRoles={['Admin']}>
                  <StudentForm />
                </RoleGuard>
              }
            />
            <Route
              path={ROUTES.STUDENT_DETAIL}
              element={
                <RoleGuard allowedRoles={['Admin', 'Teacher', 'Student', 'Parent']}>
                  <StudentDetail />
                </RoleGuard>
              }
            />
            <Route
              path={ROUTES.STUDENT_EDIT}
              element={
                <RoleGuard allowedRoles={['Admin']}>
                  <StudentForm />
                </RoleGuard>
              }
            />

            {/* Attendance — Admin + Teacher for marking; all roles for viewing */}
            <Route
              path={ROUTES.ATTENDANCE_MARK}
              element={
                <RoleGuard allowedRoles={['Admin', 'Teacher']}>
                  <AttendanceMark />
                </RoleGuard>
              }
            />
            <Route path={ROUTES.ATTENDANCE_REPORT} element={<AttendanceReport />} />

            {/* Examination */}
            <Route path={ROUTES.EXAMINATIONS} element={<ExaminationList />} />
            <Route
              path={ROUTES.EXAMINATION_NEW}
              element={
                <RoleGuard allowedRoles={['Admin']}>
                  <ExaminationForm />
                </RoleGuard>
              }
            />
            <Route
              path={ROUTES.EXAMINATION_DETAIL}
              element={<ExaminationDetail />}
            />
            <Route
              path={ROUTES.EXAMINATION_EDIT}
              element={
                <RoleGuard allowedRoles={['Admin']}>
                  <ExaminationForm />
                </RoleGuard>
              }
            />
            <Route
              path={ROUTES.EXAMINATION_RESULTS}
              element={
                <RoleGuard allowedRoles={['Admin', 'Teacher']}>
                  <ExaminationResults />
                </RoleGuard>
              }
            />

            {/* Fees */}
            <Route path={ROUTES.FEE_INVOICES}  element={<FeeInvoices />} />
            <Route path={ROUTES.FEE_PAYMENTS}  element={<FeePayments />} />
            <Route
              path={ROUTES.FEE_STRUCTURES}
              element={
                <RoleGuard allowedRoles={['Admin']}>
                  <FeeStructures />
                </RoleGuard>
              }
            />

            {/* Communication */}
            <Route path={ROUTES.ANNOUNCEMENTS} element={<Announcements />} />
            <Route path={ROUTES.MESSAGES}      element={<Messages />} />

            {/* Reports — Admin + Teacher */}
            <Route
              path={ROUTES.REPORT_ATTENDANCE}
              element={
                <RoleGuard allowedRoles={['Admin', 'Teacher']}>
                  <ReportAttendance />
                </RoleGuard>
              }
            />
            <Route
              path={ROUTES.REPORT_ATTENDANCE_STUDENT}
              element={
                <RoleGuard allowedRoles={['Admin', 'Teacher']}>
                  <ReportAttendanceStudent />
                </RoleGuard>
              }
            />
            <Route
              path={ROUTES.REPORT_LOW_ATTENDANCE}
              element={
                <RoleGuard allowedRoles={['Admin', 'Teacher']}>
                  <ReportLowAttendance />
                </RoleGuard>
              }
            />
            <Route
              path={ROUTES.REPORT_FEES}
              element={
                <RoleGuard allowedRoles={['Admin']}>
                  <ReportFees />
                </RoleGuard>
              }
            />
            <Route
              path={ROUTES.REPORT_FEES_PAYMENTS}
              element={
                <RoleGuard allowedRoles={['Admin']}>
                  <ReportFeesPayments />
                </RoleGuard>
              }
            />
            <Route
              path={ROUTES.REPORT_ACADEMIC}
              element={
                <RoleGuard allowedRoles={['Admin', 'Teacher']}>
                  <ReportAcademic />
                </RoleGuard>
              }
            />
            <Route
              path={ROUTES.REPORT_ACADEMIC_REPORTCARD}
              element={
                <RoleGuard allowedRoles={['Admin', 'Teacher']}>
                  <ReportCard />
                </RoleGuard>
              }
            />
            <Route
              path={ROUTES.REPORT_ACADEMIC_SUBJECTS}
              element={
                <RoleGuard allowedRoles={['Admin', 'Teacher']}>
                  <ReportSubjectPerf />
                </RoleGuard>
              }
            />
            <Route
              path={ROUTES.REPORT_STUDENTS_ENROLLMENT}
              element={
                <RoleGuard allowedRoles={['Admin', 'Teacher']}>
                  <ReportEnrollment />
                </RoleGuard>
              }
            />
            <Route
              path={ROUTES.REPORT_STUDENTS_DIRECTORY}
              element={
                <RoleGuard allowedRoles={['Admin', 'Teacher']}>
                  <ReportDirectory />
                </RoleGuard>
              }
            />
            <Route
              path={ROUTES.REPORT_ADMISSION}
              element={
                <RoleGuard allowedRoles={['Admin']}>
                  <ReportAdmission />
                </RoleGuard>
              }
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
