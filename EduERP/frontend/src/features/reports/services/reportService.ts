import api from '../../../services/api/axiosInstance';
import type {
  StudentStrengthItem,
  LowAttendanceStudent,
  LowAttendanceParams,
  IndividualReportCard,
  SubjectPerformanceItem,
  SubjectPerformanceParams,
  PaymentHistoryItem,
  PaymentHistoryParams,
  AdmissionStatItem,
  StudentDirectoryItem,
  StudentDirectoryParams,
} from '../types/report.types';

export const reportService = {
  getStudentStrength: (academicYearId?: number) =>
    api.get<{ data: StudentStrengthItem[] }>('/reports/students/strength', {
      params: academicYearId ? { academicYearId } : {},
    }).then(r => r.data.data ?? []),

  getStudentDirectory: (params: StudentDirectoryParams) =>
    api.get<{ data: StudentDirectoryItem[] }>('/reports/students/directory', { params })
      .then(r => r.data.data ?? []),

  getLowAttendance: (params: LowAttendanceParams) =>
    api.get<{ data: LowAttendanceStudent[] }>('/reports/attendance/low', { params })
      .then(r => r.data.data ?? []),

  getIndividualReportCard: (studentId: number, academicYearId: number) =>
    api.get<{ data: IndividualReportCard }>(`/reports/academic/reportcard/${studentId}`, {
      params: { academicYearId },
    }).then(r => r.data.data),

  getSubjectPerformance: (params: SubjectPerformanceParams) =>
    api.get<{ data: SubjectPerformanceItem[] }>('/reports/academic/subjects', { params })
      .then(r => r.data.data ?? []),

  getPaymentHistory: (params: PaymentHistoryParams) =>
    api.get<{ data: PaymentHistoryItem[] }>('/reports/fees/payments', { params })
      .then(r => r.data.data ?? []),

  getAdmissionStats: (academicYearId?: number) =>
    api.get<{ data: AdmissionStatItem[] }>('/reports/admission', {
      params: academicYearId ? { academicYearId } : {},
    }).then(r => r.data.data ?? []),
};
