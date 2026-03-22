import apiClient from '../../../services/api/axiosInstance';
import type {
  StudentListItem,
  StudentDetail,
  StudentCreated,
  StudentListParams,
  StudentCreateFormData,
  StudentUpdateFormData,
} from '../types/student.types';

interface ApiResponse<T> {
  success:    boolean;
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

export const studentService = {
  getAll: async (params: StudentListParams) => {
    const { data } = await apiClient.get<ApiResponse<PagedData<StudentListItem>>>('/students', { params });
    return data;
  },

  getById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<StudentDetail>>(`/students/${id}`);
    return data;
  },

  create: async (dto: StudentCreateFormData) => {
    const { data } = await apiClient.post<ApiResponse<StudentCreated>>('/students', dto);
    return data;
  },

  update: async (id: number, dto: StudentUpdateFormData) => {
    const { data } = await apiClient.put<ApiResponse<StudentListItem>>(`/students/${id}`, dto);
    return data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/students/${id}`);
  },
};
