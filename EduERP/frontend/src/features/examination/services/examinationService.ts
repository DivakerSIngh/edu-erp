import apiClient from '../../../services/api/axiosInstance';
import type {
  ExaminationListItem,
  ExaminationDetail,
  ExaminationCreated,
  ExaminationListParams,
  ExaminationCreateFormData,
  ExaminationUpdateFormData,
  ExamResultItem,
  ReportCard,
  Subject,
  ClassStudent,
  BulkResultEntry,
} from '../types/examination.types';

interface ApiResponse<T> {
  isSuccess: boolean;
  data:      T;
  message:   string;
}

interface PagedData<T> {
  items:      T[];
  page:       number;
  pageSize:   number;
  totalCount: number;
  totalPages: number;
}

const BASE = '/examinations';

export const examinationService = {
  getAll: async (params: ExaminationListParams) => {
    const { data } = await apiClient.get<ApiResponse<PagedData<ExaminationListItem>>>(BASE, { params });
    return data;
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<ExaminationDetail>>(`${BASE}/${id}`);
    return data;
  },

  create: async (dto: ExaminationCreateFormData) => {
    const { data } = await apiClient.post<ApiResponse<ExaminationCreated>>(BASE, dto);
    return data;
  },

  update: async (id: number, dto: ExaminationUpdateFormData) => {
    const { data } = await apiClient.put<ApiResponse<ExaminationDetail>>(`${BASE}/${id}`, dto);
    return data;
  },

  publish: async (id: number, publish: boolean) => {
    const { data } = await apiClient.patch<ApiResponse<ExaminationDetail>>(
      `${BASE}/${id}/publish`,
      { publish }
    );
    return data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`${BASE}/${id}`);
  },

  getResults: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<ExamResultItem[]>>(`${BASE}/${id}/results`);
    return data;
  },

  bulkEnterResults: async (id: number, dto: BulkResultEntry) => {
    const { data } = await apiClient.post<ApiResponse<null>>(`${BASE}/${id}/results`, dto);
    return data;
  },

  getReportCard: async (examinationId: number, studentId: number) => {
    const { data } = await apiClient.get<ApiResponse<ReportCard>>(
      `${BASE}/${examinationId}/reportcard/${studentId}`
    );
    return data;
  },

  getSubjects: async () => {
    const { data } = await apiClient.get<ApiResponse<Subject[]>>(`${BASE}/subjects`);
    return data;
  },

  getClassStudents: async (classId: number) => {
    const { data } = await apiClient.get<ApiResponse<ClassStudent[]>>(
      `${BASE}/classes/${classId}/students`
    );
    return data;
  },
};
