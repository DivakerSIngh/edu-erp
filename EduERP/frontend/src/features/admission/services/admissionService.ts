import apiClient from '../../../services/api/axiosInstance';
import type {
  AdmissionListItem,
  AdmissionDetail,
  AdmissionCreated,
  AcademicYear,
  ClassOption,
  SectionOption,
  AdmissionSubmitFormData,
  AdmissionStatusUpdateData,
  AdmissionConvertData,
  AdmissionListParams,
} from '../types/admission.types';

interface ApiResponse<T> {
  isSuccess:  boolean;
  success:    boolean;   // some endpoints return this instead
  data:       T;
  message:    string;
  pagination?: {
    page:       number;
    pageSize:   number;
    totalCount: number;
    totalPages: number;
  };
}

interface PagedData<T> {
  items:      T[];
  page:       number;
  pageSize:   number;
  totalCount: number;
  totalPages: number;
}

const BASE = '/admission';

export const admissionService = {
  // ── List ─────────────────────────────────────────────────────────────────
  getAll: async (params: AdmissionListParams) => {
    const { data } = await apiClient.get<ApiResponse<PagedData<AdmissionListItem>>>(BASE, { params });
    return data;
  },

  // ── Detail ───────────────────────────────────────────────────────────────
  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<AdmissionDetail>>(`${BASE}/${id}`);
    return data;
  },

  // ── Submit (public) ───────────────────────────────────────────────────────
  submit: async (dto: AdmissionSubmitFormData) => {
    const { data } = await apiClient.post<ApiResponse<AdmissionCreated>>(BASE, dto);
    return data;
  },

  // ── Status Update ─────────────────────────────────────────────────────────
  updateStatus: async (id: number, dto: AdmissionStatusUpdateData) => {
    const { data } = await apiClient.put<ApiResponse<null>>(`${BASE}/${id}/status`, dto);
    return data;
  },

  // ── Convert ───────────────────────────────────────────────────────────────
  convertToStudent: async (id: number, dto: AdmissionConvertData) => {
    const { data } = await apiClient.post<ApiResponse<{ studentId: number; enrollmentNumber: string }>>(
      `${BASE}/${id}/convert`,
      dto
    );
    return data;
  },

  // ── Lookups ───────────────────────────────────────────────────────────────
  getAcademicYears: async () => {
    const { data } = await apiClient.get<ApiResponse<AcademicYear[]>>(`${BASE}/academic-years`);
    return data;
  },

  getClasses: async (academicYearId: number) => {
    const { data } = await apiClient.get<ApiResponse<ClassOption[]>>(`${BASE}/classes`, {
      params: { academicYearId },
    });
    return data;
  },

  getSections: async (classId: number) => {
    const { data } = await apiClient.get<ApiResponse<SectionOption[]>>(`${BASE}/classes/${classId}/sections`);
    return data;
  },
};
