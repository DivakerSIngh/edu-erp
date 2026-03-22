namespace EduERP.Application.Interfaces;

/// <summary>
/// Abstracts online payment gateway operations.
/// Concrete implementations (e.g. Stripe) live in Infrastructure.
/// </summary>
public interface IPaymentGateway
{
    /// <summary>Create a hosted checkout session and return its URL and ID.</summary>
    Task<GatewayCheckoutResult> CreateCheckoutSessionAsync(GatewayCheckoutRequest request);

    /// <summary>
    /// Parse and verify an incoming webhook payload.
    /// Returns null if the event is not actionable (e.g. non-payment event).
    /// Throws <see cref="InvalidOperationException"/> when signature verification fails.
    /// </summary>
    Task<GatewayWebhookResult?> ProcessWebhookAsync(string rawBody, string signatureHeader);
}

public record GatewayCheckoutRequest(
    int     InvoiceId,
    string  InvoiceNumber,
    decimal Amount,
    string  Currency,
    string  StudentName,
    string  StudentEmail,
    string  FeeDescription,
    string  SuccessUrl,
    string  CancelUrl);

public record GatewayCheckoutResult(
    string   SessionId,
    string   CheckoutUrl,
    DateTime ExpiresAt);

public record GatewayWebhookResult(
    string   EventType,
    string   SessionId,
    string?  PaymentIntentId,
    bool     PaymentSucceeded,
    int?     InvoiceId,
    decimal? AmountPaid,
    string   Currency);
