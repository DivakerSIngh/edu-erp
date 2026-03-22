using Dapper;
using EduERP.Application.DTOs.Fees;
using EduERP.Application.Interfaces;
using EduERP.Infrastructure.Data;

namespace EduERP.Infrastructure.Data.Repositories;

public class FeesRepository : BaseRepository, IFeesRepository
{
    public FeesRepository(IDbConnectionFactory connectionFactory)
        : base(connectionFactory) { }

    // ── Fee Structures ────────────────────────────────────────────────────

    public async Task<IEnumerable<FeeStructureDto>> GetStructuresAsync(FeeStructureListRequestDto request)
    {
        var p = new DynamicParameters();
        p.Add("@AcademicYearId", request.AcademicYearId);
        p.Add("@ClassId",        request.ClassId);
        return await QueryAsync<FeeStructureDto>("usp_Fees_GetStructures", p, readOnly: true);
    }

    public Task<FeeStructureDto?> GetStructureByIdAsync(int feeStructureId)
    {
        var p = new DynamicParameters();
        p.Add("@FeeStructureId", feeStructureId);
        return QueryFirstOrDefaultAsync<FeeStructureDto>("usp_Fees_GetStructureById", p, readOnly: true);
    }

    public async Task<FeeStructureCreatedDto> CreateStructureAsync(FeeStructureCreateDto dto, int createdBy)
    {
        var p = new DynamicParameters();
        p.Add("@FeeName",        dto.FeeName);
        p.Add("@AcademicYearId", dto.AcademicYearId);
        p.Add("@ClassId",        dto.ClassId);
        p.Add("@Amount",         dto.Amount);
        p.Add("@IsRecurring",    dto.IsRecurring);
        p.Add("@Frequency",      dto.Frequency);
        p.Add("@DueDate",        dto.DueDate);
        p.Add("@CreatedBy",      createdBy);

        return await QueryFirstOrDefaultAsync<FeeStructureCreatedDto>("usp_Fees_CreateStructure", p)
               ?? throw new InvalidOperationException("Fee structure creation SP returned no row.");
    }

    public Task UpdateStructureAsync(int feeStructureId, FeeStructureUpdateDto dto, int updatedBy)
    {
        var p = new DynamicParameters();
        p.Add("@FeeStructureId", feeStructureId);
        p.Add("@FeeName",        dto.FeeName);
        p.Add("@Amount",         dto.Amount);
        p.Add("@IsRecurring",    dto.IsRecurring);
        p.Add("@Frequency",      dto.Frequency);
        p.Add("@DueDate",        dto.DueDate);
        p.Add("@UpdatedBy",      updatedBy);
        return ExecuteAsync("usp_Fees_UpdateStructure", p);
    }

    public Task DeleteStructureAsync(int feeStructureId, int deletedBy)
    {
        var p = new DynamicParameters();
        p.Add("@FeeStructureId", feeStructureId);
        p.Add("@DeletedBy",      deletedBy);
        return ExecuteAsync("usp_Fees_SoftDeleteStructure", p);
    }

    // ── Invoices ──────────────────────────────────────────────────────────

    public async Task<IEnumerable<FeeInvoiceListItemDto>> GetStudentInvoicesAsync(int studentId, string? status)
    {
        var p = new DynamicParameters();
        p.Add("@StudentId", studentId);
        p.Add("@Status",    status);
        return await QueryAsync<FeeInvoiceListItemDto>("usp_Fees_GetStudentInvoices", p, readOnly: true);
    }

    public Task<FeeInvoiceDetailDto?> GetInvoiceByIdAsync(int invoiceId)
    {
        var p = new DynamicParameters();
        p.Add("@InvoiceId", invoiceId);
        return QueryFirstOrDefaultAsync<FeeInvoiceDetailDto>("usp_Fees_GetInvoiceById", p, readOnly: true);
    }

    public async Task<InvoicesGeneratedDto> GenerateMonthlyInvoicesAsync(
        int academicYearId, int month, int year, int generatedBy)
    {
        var p = new DynamicParameters();
        p.Add("@AcademicYearId", academicYearId);
        p.Add("@Month",          month);
        p.Add("@Year",           year);
        p.Add("@GeneratedBy",    generatedBy);

        return await QueryFirstOrDefaultAsync<InvoicesGeneratedDto>("usp_Fees_GenerateInvoices", p)
               ?? new InvoicesGeneratedDto { InvoicesCreated = 0 };
    }

    // ── Payments ──────────────────────────────────────────────────────────

    public async Task<string> RecordManualPaymentAsync(
        int invoiceId, RecordManualPaymentDto dto, int recordedBy)
    {
        var p = new DynamicParameters();
        p.Add("@InvoiceId",      invoiceId);
        p.Add("@AmountPaid",     dto.AmountPaid);
        p.Add("@PaymentMethod",  dto.PaymentMethod);
        p.Add("@TransactionRef", dto.TransactionReference);
        p.Add("@RecordedBy",     recordedBy);

        var result = await QueryFirstOrDefaultAsync<dynamic>("usp_Fees_RecordPayment", p);
        return result?.ReceiptNumber as string
               ?? throw new InvalidOperationException("Payment recording SP returned no receipt number.");
    }

    public async Task<string?> CompleteOnlinePaymentAsync(
        string externalRef, string paymentIntentId, decimal amountPaid, int updatedBy)
    {
        var p = new DynamicParameters();
        p.Add("@ExternalRef",     externalRef);
        p.Add("@PaymentIntentId", paymentIntentId);
        p.Add("@AmountPaid",      amountPaid);
        p.Add("@UpdatedBy",       updatedBy);

        var result = await QueryFirstOrDefaultAsync<dynamic>("usp_Fees_CompleteOnlinePayment", p);
        if (result is null) return null;

        string resultCode = result.Result;
        if (resultCode == "AlreadyCompleted") return null;   // idempotent — already processed

        return result.ReceiptNumber as string;
    }

    // ── Payment Sessions ──────────────────────────────────────────────────

    public async Task<(int SessionId, string? ExistingRef, bool AlreadyExists)> CreatePaymentSessionAsync(
        int invoiceId, string externalRef, decimal amount, string currency,
        DateTime expiresAt, int createdBy)
    {
        var p = new DynamicParameters();
        p.Add("@InvoiceId",   invoiceId);
        p.Add("@ExternalRef", externalRef);
        p.Add("@Amount",      amount);
        p.Add("@Currency",    currency);
        p.Add("@ExpiresAt",   expiresAt);
        p.Add("@CreatedBy",   createdBy);

        var row = await QueryFirstOrDefaultAsync<dynamic>("usp_Fees_CreatePaymentSession", p);
        if (row is null) return (0, null, false);

        bool already  = (int)row.AlreadyExists == 1;
        int  sessionId = already ? 0 : (int)row.SessionId;
        string? existing = already ? (string?)row.ExistingRef : null;

        return (sessionId, existing, already);
    }

    // ── Reporting ─────────────────────────────────────────────────────────

    public async Task<IEnumerable<DefaulterDto>> GetDefaultersAsync(int? academicYearId, DateOnly? asOfDate)
    {
        var p = new DynamicParameters();
        p.Add("@AcademicYearId", academicYearId);
        p.Add("@AsOfDate",       asOfDate);
        return await QueryAsync<DefaulterDto>("usp_Fees_GetDefaulters", p, readOnly: true);
    }

    public Task<FeesSummaryDto?> GetSummaryAsync(int? academicYearId)
    {
        var p = new DynamicParameters();
        p.Add("@AcademicYearId", academicYearId);
        return QueryFirstOrDefaultAsync<FeesSummaryDto>("usp_Fees_GetFeesSummary", p, readOnly: true);
    }
}
