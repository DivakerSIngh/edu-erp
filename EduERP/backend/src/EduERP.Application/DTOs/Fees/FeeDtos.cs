using System.ComponentModel.DataAnnotations;
using EduERP.Application.DTOs.Common;

namespace EduERP.Application.DTOs.Fees;

// ── Fee Structure ──────────────────────────────────────────────────────────

public class FeeStructureListRequestDto
{
    public int? AcademicYearId { get; init; }
    public int? ClassId        { get; init; }
}

public class FeeStructureCreateDto
{
    [Required, MaxLength(200)]
    public string   FeeName        { get; init; } = string.Empty;

    [Required]
    public int      AcademicYearId { get; init; }

    public int?     ClassId        { get; init; }   // null = school-wide

    [Required, Range(0.01, 999999.99)]
    public decimal  Amount         { get; init; }

    public bool     IsRecurring    { get; init; }

    [MaxLength(20)]
    public string?  Frequency      { get; init; }   // Monthly | Quarterly | Annual | OneTime

    public DateOnly? DueDate       { get; init; }
}

public class FeeStructureUpdateDto
{
    [MaxLength(200)]
    public string?   FeeName     { get; init; }

    [Range(0.01, 999999.99)]
    public decimal?  Amount      { get; init; }

    public bool?     IsRecurring { get; init; }

    [MaxLength(20)]
    public string?   Frequency   { get; init; }

    public DateOnly? DueDate     { get; init; }
}

public class FeeStructureDto
{
    public int      FeeStructureId { get; init; }
    public string   FeeName        { get; init; } = string.Empty;
    public decimal  Amount         { get; init; }
    public bool     IsRecurring    { get; init; }
    public string?  Frequency      { get; init; }
    public DateOnly? DueDate       { get; init; }
    public int?      ClassId       { get; init; }
    public int       AcademicYearId { get; init; }
    public string?   ClassName     { get; init; }
    public string    AcademicYear  { get; init; } = string.Empty;
    public DateTime  CreatedAt     { get; init; }
}

public class FeeStructureCreatedDto
{
    public int FeeStructureId { get; init; }
}

// ── Fee Invoices ───────────────────────────────────────────────────────────

public class FeeInvoiceListRequestDto
{
    public int?    StudentId { get; init; }
    public string? Status    { get; init; }   // Pending | Paid | PartiallyPaid | Overdue | Waived
}

public class FeeInvoiceListItemDto
{
    public int      InvoiceId      { get; init; }
    public string   InvoiceNumber  { get; init; } = string.Empty;
    public DateOnly? InvoiceMonth  { get; init; }
    public DateOnly DueDate        { get; init; }
    public decimal  TotalAmount    { get; init; }
    public decimal  PaidAmount     { get; init; }
    public decimal  BalanceAmount  { get; init; }
    public string   Status         { get; init; } = string.Empty;
    public string   FeeType        { get; init; } = string.Empty;
    public DateTime? PaidAt        { get; init; }
    public string?  PaymentMethod  { get; init; }
    public string?  ReceiptNumber  { get; init; }
}

public class FeeInvoiceDetailDto : FeeInvoiceListItemDto
{
    public int     StudentId        { get; init; }
    public int     FeeStructureId   { get; init; }
    public string  EnrollmentNumber { get; init; } = string.Empty;
    public string  StudentName      { get; init; } = string.Empty;
    public string? StudentEmail     { get; init; }
    public string  ClassName        { get; init; } = string.Empty;
    public string  SectionName      { get; init; } = string.Empty;
}

// ── Manual (Cash / Offline) Payment ───────────────────────────────────────

public class RecordManualPaymentDto
{
    [Required, Range(0.01, 999999.99)]
    public decimal AmountPaid { get; init; }

    /// <summary>Cash | BankTransfer | Card | Cheque</summary>
    [Required, MaxLength(50)]
    public string PaymentMethod { get; init; } = string.Empty;

    [MaxLength(100)]
    public string? TransactionReference { get; init; }
}

public class PaymentRecordedDto
{
    public string ReceiptNumber { get; init; } = string.Empty;
    public string InvoiceStatus { get; init; } = string.Empty;
}

// ── Online Payment (Stripe Checkout) ──────────────────────────────────────

public class InitiateOnlinePaymentDto
{
    /// <summary>
    /// Frontend success landing page. Must be on an allowed origin.
    /// Example: https://app.eduerp.com/fees/payment-success
    /// </summary>
    [Required, Url, MaxLength(500)]
    public string SuccessUrl { get; init; } = string.Empty;

    /// <summary>Frontend cancel / back page.</summary>
    [Required, Url, MaxLength(500)]
    public string CancelUrl  { get; init; } = string.Empty;
}

public class CheckoutSessionDto
{
    public string   SessionId   { get; init; } = string.Empty;
    public string   CheckoutUrl { get; init; } = string.Empty;
    public DateTime ExpiresAt   { get; init; }
}

// ── Fees Summary ───────────────────────────────────────────────────────────

public class FeesSummaryDto
{
    public decimal TotalCollected   { get; init; }
    public decimal TotalPending     { get; init; }
    public decimal TotalOverdue     { get; init; }
    public int     TotalInvoices    { get; init; }
    public int     PaidInvoices     { get; init; }
    public int     PendingInvoices  { get; init; }
    public int     PartialInvoices  { get; init; }
    public int     OverdueInvoices  { get; init; }
}

// ── Defaulters ────────────────────────────────────────────────────────────

public class DefaultersRequestDto
{
    public int?      AcademicYearId { get; init; }
    public DateOnly? AsOfDate       { get; init; }
}

public class DefaulterDto
{
    public int     StudentId        { get; init; }
    public string  EnrollmentNumber { get; init; } = string.Empty;
    public string  StudentName      { get; init; } = string.Empty;
    public string? Email            { get; init; }
    public string? Phone            { get; init; }
    public string  ClassName        { get; init; } = string.Empty;
    public string  SectionName      { get; init; } = string.Empty;
    public int     OverdueCount     { get; init; }
    public decimal TotalDue         { get; init; }
    public DateOnly OldestDueDate   { get; init; }
}

// ── Invoice Generation (Hangfire / Admin) ──────────────────────────────────

public class GenerateInvoicesDto
{
    [Required]
    public int AcademicYearId { get; init; }

    [Required, Range(1, 12)]
    public int Month          { get; init; }

    [Required, Range(2020, 2099)]
    public int Year           { get; init; }
}

public class InvoicesGeneratedDto
{
    public int InvoicesCreated { get; init; }
}
