using EduERP.Application.DTOs.Fees;
using EduERP.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace EduERP.Application.Services;

public class FeesService : IFeesService
{
    private readonly IFeesRepository              _repo;
    private readonly IPaymentGateway              _gateway;
    private readonly ILogger<FeesService>         _logger;

    public FeesService(
        IFeesRepository      repo,
        IPaymentGateway      gateway,
        ILogger<FeesService> logger)
    {
        _repo    = repo;
        _gateway = gateway;
        _logger  = logger;
    }

    // ── Fee Structures ────────────────────────────────────────────────────

    public Task<IEnumerable<FeeStructureDto>> GetFeeStructuresAsync(FeeStructureListRequestDto request)
        => _repo.GetStructuresAsync(request);

    public async Task<FeeStructureDto> GetFeeStructureByIdAsync(int feeStructureId)
        => await _repo.GetStructureByIdAsync(feeStructureId)
           ?? throw new KeyNotFoundException($"Fee structure {feeStructureId} not found.");

    public Task<FeeStructureCreatedDto> CreateFeeStructureAsync(FeeStructureCreateDto dto, int createdBy)
        => _repo.CreateStructureAsync(dto, createdBy);

    public async Task<FeeStructureDto> UpdateFeeStructureAsync(
        int feeStructureId, FeeStructureUpdateDto dto, int updatedBy)
    {
        await _repo.UpdateStructureAsync(feeStructureId, dto, updatedBy);
        return await GetFeeStructureByIdAsync(feeStructureId);
    }

    public Task DeleteFeeStructureAsync(int feeStructureId, int deletedBy)
        => _repo.DeleteStructureAsync(feeStructureId, deletedBy);

    // ── Invoices ──────────────────────────────────────────────────────────

    public Task<IEnumerable<FeeInvoiceListItemDto>> GetStudentInvoicesAsync(int studentId, string? status)
        => _repo.GetStudentInvoicesAsync(studentId, status);

    public async Task<FeeInvoiceDetailDto> GetInvoiceByIdAsync(int invoiceId)
        => await _repo.GetInvoiceByIdAsync(invoiceId)
           ?? throw new KeyNotFoundException($"Invoice {invoiceId} not found.");

    public Task<InvoicesGeneratedDto> GenerateMonthlyInvoicesAsync(GenerateInvoicesDto dto, int generatedBy)
        => _repo.GenerateMonthlyInvoicesAsync(dto.AcademicYearId, dto.Month, dto.Year, generatedBy);

    // ── Manual Payments ────────────────────────────────────────────────────

    public async Task<PaymentRecordedDto> RecordManualPaymentAsync(
        int invoiceId, RecordManualPaymentDto dto, int recordedBy)
    {
        // Validate the invoice exists and is payable
        var invoice = await _repo.GetInvoiceByIdAsync(invoiceId)
                      ?? throw new KeyNotFoundException($"Invoice {invoiceId} not found.");

        if (invoice.Status == "Paid")
            throw new InvalidOperationException("Invoice is already fully paid.");

        if (invoice.Status == "Waived")
            throw new InvalidOperationException("Invoice has been waived and cannot accept payments.");

        if (dto.AmountPaid > invoice.BalanceAmount)
            throw new InvalidOperationException(
                $"Amount paid ({dto.AmountPaid:C}) exceeds outstanding balance ({invoice.BalanceAmount:C}).");

        var receipt = await _repo.RecordManualPaymentAsync(invoiceId, dto, recordedBy);

        // Fetch updated invoice status after payment
        var updated = await _repo.GetInvoiceByIdAsync(invoiceId);

        _logger.LogInformation(
            "Manual payment recorded: Invoice {InvoiceId}, Amount {Amount}, Receipt {Receipt}",
            invoiceId, dto.AmountPaid, receipt);

        return new PaymentRecordedDto
        {
            ReceiptNumber = receipt,
            InvoiceStatus = updated?.Status ?? "Unknown"
        };
    }

    // ── Online Payment (Stripe) ────────────────────────────────────────────

    public async Task<CheckoutSessionDto> InitiateOnlinePaymentAsync(
        int invoiceId, InitiateOnlinePaymentDto dto, int userId)
    {
        var invoice = await _repo.GetInvoiceByIdAsync(invoiceId)
                      ?? throw new KeyNotFoundException($"Invoice {invoiceId} not found.");

        if (invoice.Status == "Paid")
            throw new InvalidOperationException("Invoice is already fully paid.");

        if (invoice.Status == "Waived")
            throw new InvalidOperationException("Invoice has been waived.");

        if (invoice.BalanceAmount <= 0)
            throw new InvalidOperationException("No outstanding balance on this invoice.");

        // Validate success/cancel URLs are on allowed schemes
        ValidateCallbackUrl(dto.SuccessUrl, nameof(dto.SuccessUrl));
        ValidateCallbackUrl(dto.CancelUrl,  nameof(dto.CancelUrl));

        var gatewayRequest = new GatewayCheckoutRequest(
            InvoiceId:      invoice.InvoiceId,
            InvoiceNumber:  invoice.InvoiceNumber,
            Amount:         invoice.BalanceAmount,
            Currency:       "usd",
            StudentName:    invoice.StudentName,
            StudentEmail:   invoice.StudentEmail ?? string.Empty,
            FeeDescription: invoice.FeeType,
            SuccessUrl:     dto.SuccessUrl,
            CancelUrl:      dto.CancelUrl);

        var session = await _gateway.CreateCheckoutSessionAsync(gatewayRequest);

        // Persist the session for webhook correlation
        await _repo.CreatePaymentSessionAsync(
            invoiceId:   invoice.InvoiceId,
            externalRef: session.SessionId,
            amount:      invoice.BalanceAmount,
            currency:    "usd",
            expiresAt:   session.ExpiresAt,
            createdBy:   userId);

        _logger.LogInformation(
            "Online payment session {SessionId} created for invoice {InvoiceId} by user {UserId}",
            session.SessionId, invoiceId, userId);

        return new CheckoutSessionDto
        {
            SessionId   = session.SessionId,
            CheckoutUrl = session.CheckoutUrl,
            ExpiresAt   = session.ExpiresAt,
        };
    }

    // ── Stripe Webhook ────────────────────────────────────────────────────

    public async Task HandleStripeWebhookAsync(string payload, string stripeSignature)
    {
        GatewayWebhookResult? result;

        try
        {
            result = await _gateway.ProcessWebhookAsync(payload, stripeSignature);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Webhook signature verification failed");
            throw;  // Re-throw so controller returns 400
        }

        if (result is null || !result.PaymentSucceeded)
        {
            _logger.LogDebug("Webhook event ignored — not an actionable payment event");
            return;
        }

        if (result.InvoiceId is null || result.AmountPaid is null)
        {
            _logger.LogWarning(
                "Stripe session {SessionId} missing invoice metadata — cannot record payment",
                result.SessionId);
            return;
        }

        var receiptNumber = await _repo.CompleteOnlinePaymentAsync(
            externalRef:     result.SessionId,
            paymentIntentId: result.PaymentIntentId ?? result.SessionId,
            amountPaid:      result.AmountPaid.Value,
            updatedBy:       0);  // system user

        if (receiptNumber is not null)
        {
            _logger.LogInformation(
                "Online payment confirmed: Session {SessionId}, Invoice {InvoiceId}, Receipt {Receipt}",
                result.SessionId, result.InvoiceId, receiptNumber);
        }
    }

    // ── Reporting ─────────────────────────────────────────────────────────

    public Task<IEnumerable<DefaulterDto>> GetDefaultersAsync(DefaultersRequestDto request)
        => _repo.GetDefaultersAsync(request.AcademicYearId, request.AsOfDate);

    public async Task<FeesSummaryDto> GetSummaryAsync(int? academicYearId)
        => await _repo.GetSummaryAsync(academicYearId)
           ?? new FeesSummaryDto();

    // ── Private Helpers ───────────────────────────────────────────────────

    private static void ValidateCallbackUrl(string url, string paramName)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri)
            || (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp))
        {
            throw new ArgumentException($"{paramName} must be an absolute HTTP/HTTPS URL.", paramName);
        }
    }
}
