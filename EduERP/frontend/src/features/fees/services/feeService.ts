import apiClient from '../../../services/api/axiosInstance';
import type {
  FeeStructure,
  FeeStructureCreated,
  FeeStructureCreateForm,
  FeeStructureUpdateForm,
  FeeInvoiceListItem,
  FeeInvoiceDetail,
  RecordPaymentForm,
  PaymentRecorded,
  CheckoutSession,
  FeesSummary,
  Defaulter,
  InvoicesGenerated,
} from '../types/fee.types';

interface ApiResponse<T> {
  isSuccess: boolean;
  data:      T;
  message:   string;
}

const BASE = '/fees';

export const feeService = {
  // ── Fee Structures ─────────────────────────────────────────────────────────
  getStructures: async (params?: { academicYearId?: number; classId?: number }) => {
    const { data } = await apiClient.get<ApiResponse<FeeStructure[]>>(`${BASE}/structures`, { params });
    return data;
  },

  createStructure: async (dto: FeeStructureCreateForm) => {
    const { data } = await apiClient.post<ApiResponse<FeeStructureCreated>>(`${BASE}/structures`, dto);
    return data;
  },

  updateStructure: async (id: number, dto: FeeStructureUpdateForm) => {
    const { data } = await apiClient.put<ApiResponse<null>>(`${BASE}/structures/${id}`, dto);
    return data;
  },

  deleteStructure: async (id: number) => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`${BASE}/structures/${id}`);
    return data;
  },

  // ── Invoices ───────────────────────────────────────────────────────────────
  getStudentInvoices: async (studentId: number, status?: string) => {
    const { data } = await apiClient.get<ApiResponse<FeeInvoiceListItem[]>>(
      `${BASE}/students/${studentId}/invoices`,
      { params: status ? { status } : undefined }
    );
    return data;
  },

  getInvoiceById: async (id: number) => {
    const { data } = await apiClient.get<ApiResponse<FeeInvoiceDetail>>(`${BASE}/invoices/${id}`);
    return data;
  },

  generateInvoices: async (academicYearId: number, month: number, year: number) => {
    const { data } = await apiClient.post<ApiResponse<InvoicesGenerated>>(`${BASE}/invoices/generate`, {
      academicYearId,
      month,
      year,
    });
    return data;
  },

  // ── Payments ───────────────────────────────────────────────────────────────
  recordPayment: async (invoiceId: number, dto: RecordPaymentForm) => {
    const { data } = await apiClient.post<ApiResponse<PaymentRecorded>>(
      `${BASE}/invoices/${invoiceId}/pay`,
      dto
    );
    return data;
  },

  initiateCheckout: async (invoiceId: number) => {
    const { data } = await apiClient.post<ApiResponse<CheckoutSession>>(
      `${BASE}/invoices/${invoiceId}/checkout`,
      {}
    );
    return data;
  },

  // ── Reporting ──────────────────────────────────────────────────────────────
  getSummary: async (academicYearId?: number) => {
    const { data } = await apiClient.get<ApiResponse<FeesSummary>>(`${BASE}/summary`, {
      params: academicYearId ? { academicYearId } : undefined,
    });
    return data;
  },

  getDefaulters: async (params?: { academicYearId?: number; asOfDate?: string }) => {
    const { data } = await apiClient.get<ApiResponse<Defaulter[]>>(`${BASE}/defaulters`, { params });
    return data;
  },
};
