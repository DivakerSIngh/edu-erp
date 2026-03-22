using EduERP.API.Extensions;
using EduERP.Application.DTOs.Common;
using EduERP.Application.DTOs.Fees;
using EduERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduERP.API.Controllers.v1;

/// <summary>
/// Fees management — structures, invoices, payments and online checkout.
/// Admin has full access; Students / Parents can view their own invoices and initiate payments.
/// </summary>
[ApiController]
[Route("api/v1/fees")]
[Authorize]
[Produces("application/json")]
public class FeesController : ControllerBase
{
    private readonly IFeesService              _service;
    private readonly ILogger<FeesController>   _logger;

    public FeesController(IFeesService service, ILogger<FeesController> logger)
    {
        _service = service;
        _logger  = logger;
    }

    // ════════════════════════════════════════════════════════════════════════
    // FEE STRUCTURES
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>List fee structures, optionally filtered by academic year or class.</summary>
    [HttpGet("structures")]
    [Authorize(Roles = "Admin,Teacher")]
    [ProducesResponseType(typeof(ApiResponseDto<IEnumerable<FeeStructureDto>>), 200)]
    public async Task<IActionResult> GetStructures([FromQuery] FeeStructureListRequestDto request)
    {
        var data = await _service.GetFeeStructuresAsync(request);
        return Ok(ApiResponseDto<IEnumerable<FeeStructureDto>>.Success(data));
    }

    /// <summary>Get a single fee structure by ID.</summary>
    [HttpGet("structures/{id:int}")]
    [Authorize(Roles = "Admin,Teacher")]
    [ProducesResponseType(typeof(ApiResponseDto<FeeStructureDto>), 200)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 404)]
    public async Task<IActionResult> GetStructureById(int id)
    {
        var data = await _service.GetFeeStructureByIdAsync(id);
        return Ok(ApiResponseDto<FeeStructureDto>.Success(data));
    }

    /// <summary>Create a new fee structure.</summary>
    [HttpPost("structures")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<FeeStructureCreatedDto>), 201)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 400)]
    public async Task<IActionResult> CreateStructure([FromBody] FeeStructureCreateDto dto)
    {
        var created = await _service.CreateFeeStructureAsync(dto, User.GetUserId());
        return CreatedAtAction(
            nameof(GetStructureById),
            new { id = created.FeeStructureId },
            ApiResponseDto<FeeStructureCreatedDto>.Success(created, "Fee structure created."));
    }

    /// <summary>Update an existing fee structure.</summary>
    [HttpPut("structures/{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<FeeStructureDto>), 200)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 404)]
    public async Task<IActionResult> UpdateStructure(int id, [FromBody] FeeStructureUpdateDto dto)
    {
        var updated = await _service.UpdateFeeStructureAsync(id, dto, User.GetUserId());
        return Ok(ApiResponseDto<FeeStructureDto>.Success(updated));
    }

    /// <summary>Soft-delete a fee structure.</summary>
    [HttpDelete("structures/{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(204)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 404)]
    public async Task<IActionResult> DeleteStructure(int id)
    {
        await _service.DeleteFeeStructureAsync(id, User.GetUserId());
        return NoContent();
    }

    // ════════════════════════════════════════════════════════════════════════
    // INVOICES
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>List all invoices for a student. Admin can query any student; Student/Parent see their own.</summary>
    [HttpGet("students/{studentId:int}/invoices")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    [ProducesResponseType(typeof(ApiResponseDto<IEnumerable<FeeInvoiceListItemDto>>), 200)]
    public async Task<IActionResult> GetStudentInvoices(int studentId, [FromQuery] string? status)
    {
        var data = await _service.GetStudentInvoicesAsync(studentId, status);
        return Ok(ApiResponseDto<IEnumerable<FeeInvoiceListItemDto>>.Success(data));
    }

    /// <summary>Get full details of a single invoice including student info.</summary>
    [HttpGet("invoices/{id:int}")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    [ProducesResponseType(typeof(ApiResponseDto<FeeInvoiceDetailDto>), 200)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 404)]
    public async Task<IActionResult> GetInvoiceById(int id)
    {
        var data = await _service.GetInvoiceByIdAsync(id);
        return Ok(ApiResponseDto<FeeInvoiceDetailDto>.Success(data));
    }

    /// <summary>
    /// Trigger bulk invoice generation for a given academic year / month.
    /// Typically called by a Hangfire background job; can also be triggered manually by Admin.
    /// </summary>
    [HttpPost("invoices/generate")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<InvoicesGeneratedDto>), 200)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 400)]
    public async Task<IActionResult> GenerateInvoices([FromBody] GenerateInvoicesDto dto)
    {
        var result = await _service.GenerateMonthlyInvoicesAsync(dto, User.GetUserId());
        return Ok(ApiResponseDto<InvoicesGeneratedDto>.Success(result,
            $"{result.InvoicesCreated} invoice(s) generated."));
    }

    // ════════════════════════════════════════════════════════════════════════
    // PAYMENTS
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Record a manual (offline) payment — cash, cheque, bank transfer.
    /// Only Admin / accounting staff may record manual payments.
    /// </summary>
    [HttpPost("invoices/{id:int}/pay")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<PaymentRecordedDto>), 200)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 400)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 404)]
    public async Task<IActionResult> RecordPayment(int id, [FromBody] RecordManualPaymentDto dto)
    {
        var result = await _service.RecordManualPaymentAsync(id, dto, User.GetUserId());
        return Ok(ApiResponseDto<PaymentRecordedDto>.Success(result, "Payment recorded successfully."));
    }

    /// <summary>
    /// Initiate an online payment via Stripe Checkout.
    /// Returns a hosted checkout URL. Student / Parent should redirect the browser to this URL.
    /// </summary>
    [HttpPost("invoices/{id:int}/checkout")]
    [Authorize(Roles = "Admin,Student,Parent")]
    [ProducesResponseType(typeof(ApiResponseDto<CheckoutSessionDto>), 200)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 400)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 404)]
    public async Task<IActionResult> InitiateOnlinePayment(int id, [FromBody] InitiateOnlinePaymentDto dto)
    {
        var session = await _service.InitiateOnlinePaymentAsync(id, dto, User.GetUserId());
        return Ok(ApiResponseDto<CheckoutSessionDto>.Success(session,
            "Redirect the user to the provided checkout URL."));
    }

    // ════════════════════════════════════════════════════════════════════════
    // STRIPE WEBHOOK
    // Must be AllowAnonymous — Stripe calls without a JWT.
    // Security is provided by HMAC-SHA256 signature verification inside the service.
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Stripe webhook endpoint. Do NOT protect with [Authorize].
    /// Configure this URL in your Stripe Dashboard → Webhooks.
    /// </summary>
    [HttpPost("webhooks/stripe")]
    [AllowAnonymous]
    [Consumes("application/json")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> StripeWebhook()
    {
        // Read raw body — must be the original bytes before any JSON deserialization
        string rawBody;
        using (var reader = new StreamReader(Request.Body))
        {
            rawBody = await reader.ReadToEndAsync();
        }

        var signature = Request.Headers["Stripe-Signature"].FirstOrDefault();

        if (string.IsNullOrEmpty(signature))
        {
            _logger.LogWarning("Stripe webhook received without Stripe-Signature header");
            return BadRequest("Missing Stripe-Signature header.");
        }

        try
        {
            await _service.HandleStripeWebhookAsync(rawBody, signature);
            return Ok();
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("signature"))
        {
            _logger.LogWarning(ex, "Stripe webhook signature mismatch");
            return BadRequest("Webhook signature verification failed.");
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // REPORTING
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>Get the fees summary (collected, pending, overdue totals). Pass academicYearId to filter by year.</summary>
    [HttpGet("summary")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<FeesSummaryDto>), 200)]
    public async Task<IActionResult> GetSummary([FromQuery] int? academicYearId = null)
    {
        var data = await _service.GetSummaryAsync(academicYearId);
        return Ok(ApiResponseDto<FeesSummaryDto>.Success(data));
    }

    /// <summary>Get list of students with overdue/unpaid invoices (defaulters report).</summary>
    [HttpGet("defaulters")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<IEnumerable<DefaulterDto>>), 200)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 400)]
    public async Task<IActionResult> GetDefaulters([FromQuery] DefaultersRequestDto request)
    {
        var data = await _service.GetDefaultersAsync(request);
        return Ok(ApiResponseDto<IEnumerable<DefaulterDto>>.Success(data));
    }
}
