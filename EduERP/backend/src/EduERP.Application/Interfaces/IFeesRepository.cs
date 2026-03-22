using EduERP.Application.DTOs.Fees;

namespace EduERP.Application.Interfaces;

public interface IFeesRepository
{
    // ── Fee Structures ─────────────────────────────────────────────────────
    Task<IEnumerable<FeeStructureDto>>  GetStructuresAsync(FeeStructureListRequestDto request);
    Task<FeeStructureDto?>              GetStructureByIdAsync(int feeStructureId);
    Task<FeeStructureCreatedDto>        CreateStructureAsync(FeeStructureCreateDto dto, int createdBy);
    Task                                UpdateStructureAsync(int feeStructureId, FeeStructureUpdateDto dto, int updatedBy);
    Task                                DeleteStructureAsync(int feeStructureId, int deletedBy);

    // ── Invoices ──────────────────────────────────────────────────────────
    Task<IEnumerable<FeeInvoiceListItemDto>> GetStudentInvoicesAsync(int studentId, string? status);
    Task<FeeInvoiceDetailDto?>               GetInvoiceByIdAsync(int invoiceId);
    Task<InvoicesGeneratedDto>               GenerateMonthlyInvoicesAsync(int academicYearId, int month, int year, int generatedBy);

    // ── Payments ──────────────────────────────────────────────────────────
    Task<string>          RecordManualPaymentAsync(int invoiceId, RecordManualPaymentDto dto, int recordedBy);
    Task<string?>         CompleteOnlinePaymentAsync(string externalRef, string paymentIntentId, decimal amountPaid, int updatedBy);

    // ── Payment Sessions ──────────────────────────────────────────────────
    Task<(int SessionId, string? ExistingRef, bool AlreadyExists)> CreatePaymentSessionAsync(
        int invoiceId, string externalRef, decimal amount, string currency, DateTime expiresAt, int createdBy);

    // ── Reporting ─────────────────────────────────────────────────────────
    Task<IEnumerable<DefaulterDto>> GetDefaultersAsync(int? academicYearId, DateOnly? asOfDate);
    Task<FeesSummaryDto?>           GetSummaryAsync(int? academicYearId);
}
