using EduERP.Application.DTOs.Fees;

namespace EduERP.Application.Interfaces;

public interface IFeesService
{
    // ── Fee Structures ─────────────────────────────────────────────────────
    Task<IEnumerable<FeeStructureDto>>  GetFeeStructuresAsync(FeeStructureListRequestDto request);
    Task<FeeStructureDto>               GetFeeStructureByIdAsync(int feeStructureId);
    Task<FeeStructureCreatedDto>        CreateFeeStructureAsync(FeeStructureCreateDto dto, int createdBy);
    Task<FeeStructureDto>               UpdateFeeStructureAsync(int feeStructureId, FeeStructureUpdateDto dto, int updatedBy);
    Task                                DeleteFeeStructureAsync(int feeStructureId, int deletedBy);

    // ── Invoices ──────────────────────────────────────────────────────────
    Task<IEnumerable<FeeInvoiceListItemDto>> GetStudentInvoicesAsync(int studentId, string? status);
    Task<FeeInvoiceDetailDto>                GetInvoiceByIdAsync(int invoiceId);
    Task<InvoicesGeneratedDto>               GenerateMonthlyInvoicesAsync(GenerateInvoicesDto dto, int generatedBy);

    // ── Payments ──────────────────────────────────────────────────────────
    Task<PaymentRecordedDto>    RecordManualPaymentAsync(int invoiceId, RecordManualPaymentDto dto, int recordedBy);
    Task<CheckoutSessionDto>    InitiateOnlinePaymentAsync(int invoiceId, InitiateOnlinePaymentDto dto, int userId);
    Task                        HandleStripeWebhookAsync(string payload, string stripeSignature);

    // ── Reporting ─────────────────────────────────────────────────────────
    Task<IEnumerable<DefaulterDto>> GetDefaultersAsync(DefaultersRequestDto request);
    Task<FeesSummaryDto>            GetSummaryAsync(int? academicYearId);
}
