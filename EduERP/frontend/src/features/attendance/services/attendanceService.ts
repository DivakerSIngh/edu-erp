import apiClient from '../../../services/api/axiosInstance';
import type {
  BulkMarkRequest,
  BulkMarkResult,
  ClassAttendanceRow,
  StudentAttendanceResponse,
  UpdateAttendanceRequest,
} from '../types/attendance.types';

interface ApiResponse<T> {
  isSuccess: boolean;
  data:      T;
  message:   string;
}

const BASE = '/attendance';

export const attendanceService = {
  /** Bulk-mark attendance for a whole class in one call. */
  markBulk: async (dto: BulkMarkRequest) => {
    const { data } = await apiClient.post<ApiResponse<BulkMarkResult>>(`${BASE}/mark`, dto);
    return data;
  },

  /** Monthly grid of attendance rows for a class. */
  getByClass: async (classId: number, sectionId: number, month: number, year: number) => {
    const { data } = await apiClient.get<ApiResponse<ClassAttendanceRow[]>>(`${BASE}/class`, {
      params: { classId, sectionId, month, year },
    });
    return data;
  },

  /** Detail + summary for a specific student over a date range. */
  getByStudent: async (studentId: number, fromDate: string, toDate: string) => {
    const { data } = await apiClient.get<ApiResponse<StudentAttendanceResponse>>(
      `${BASE}/student/${studentId}`,
      { params: { fromDate, toDate } },
    );
    return data;
  },

  /** Correct a single attendance record. */
  updateSingle: async (attendanceId: number, dto: UpdateAttendanceRequest) => {
    const { data } = await apiClient.patch<ApiResponse<null>>(
      `${BASE}/${attendanceId}`,
      dto,
    );
    return data;
  },
};
