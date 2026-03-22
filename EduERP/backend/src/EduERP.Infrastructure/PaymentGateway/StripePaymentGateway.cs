using EduERP.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Checkout;

namespace EduERP.Infrastructure.PaymentGateway;

/// <summary>
/// Stripe implementation of <see cref="IPaymentGateway"/>.
/// Uses Stripe Checkout Sessions for a hosted, PCI-compliant payment flow.
/// </summary>
public class StripePaymentGateway : IPaymentGateway
{
    private readonly PaymentGatewayOptions         _options;
    private readonly ILogger<StripePaymentGateway> _logger;

    public StripePaymentGateway(
        IOptions<PaymentGatewayOptions> options,
        ILogger<StripePaymentGateway>   logger)
    {
        _options = options.Value;
        _logger  = logger;

        // Configure the SDK with our secret key
        StripeConfiguration.ApiKey = _options.SecretKey;
    }

    // ── Create Checkout Session ───────────────────────────────────────────

    public async Task<GatewayCheckoutResult> CreateCheckoutSessionAsync(GatewayCheckoutRequest request)
    {
        var expiresAt = DateTime.UtcNow.AddMinutes(_options.SessionExpiryMinutes);

        var sessionOptions = new SessionCreateOptions
        {
            Mode             = "payment",
            CustomerEmail    = request.StudentEmail,
            ExpiresAt        = expiresAt,
            SuccessUrl       = AppendQueryParam(request.SuccessUrl, "session_id", "{CHECKOUT_SESSION_ID}"),
            CancelUrl        = request.CancelUrl,
            Metadata         = new Dictionary<string, string>
            {
                ["invoice_id"]     = request.InvoiceId.ToString(),
                ["invoice_number"] = request.InvoiceNumber,
            },
            LineItems =
            [
                new SessionLineItemOptions
                {
                    Quantity  = 1,
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency   = _options.Currency,
                        UnitAmount = ToStripeAmount(request.Amount, _options.Currency),
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name        = $"Fee: {request.FeeDescription}",
                            Description = $"Invoice {request.InvoiceNumber} — {request.StudentName}",
                        },
                    },
                }
            ],
        };

        var service = new SessionService();
        Session session;

        try
        {
            session = await service.CreateAsync(sessionOptions);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe checkout session creation failed for invoice {InvoiceId}", request.InvoiceId);
            throw new InvalidOperationException($"Payment gateway error: {ex.StripeError?.Message ?? ex.Message}", ex);
        }

        _logger.LogInformation(
            "Stripe checkout session {SessionId} created for invoice {InvoiceId}",
            session.Id, request.InvoiceId);

        return new GatewayCheckoutResult(session.Id, session.Url, expiresAt);
    }

    // ── Process Webhook ───────────────────────────────────────────────────

    public Task<GatewayWebhookResult?> ProcessWebhookAsync(string rawBody, string signatureHeader)
    {
        Event stripeEvent;

        try
        {
            stripeEvent = EventUtility.ConstructEvent(
                rawBody,
                signatureHeader,
                _options.WebhookSecret,
                throwOnApiVersionMismatch: false);
        }
        catch (StripeException ex)
        {
            _logger.LogWarning(ex, "Stripe webhook signature verification failed");
            throw new InvalidOperationException("Webhook signature verification failed.", ex);
        }

        _logger.LogInformation("Stripe webhook received: {EventType} ({EventId})", stripeEvent.Type, stripeEvent.Id);

        if (stripeEvent.Type != "checkout.session.completed")
        {
            // Not a payment-completed event — safe to ignore
            return Task.FromResult<GatewayWebhookResult?>(null);
        }

        if (stripeEvent.Data.Object is not Session session)
        {
            _logger.LogWarning("checkout.session.completed event carried unexpected object type");
            return Task.FromResult<GatewayWebhookResult?>(null);
        }

        // Only process sessions that actually ended with payment
        if (session.PaymentStatus != "paid")
        {
            _logger.LogInformation("Session {SessionId} payment_status={Status} — skipping", session.Id, session.PaymentStatus);
            return Task.FromResult<GatewayWebhookResult?>(null);
        }

        session.Metadata.TryGetValue("invoice_id", out var invoiceIdStr);
        int? invoiceId = int.TryParse(invoiceIdStr, out var id) ? id : null;

        // Amount is in smallest currency unit (cents for USD) — convert to decimal
        decimal amountPaid = session.AmountTotal.HasValue
            ? FromStripeAmount(session.AmountTotal.Value, session.Currency)
            : 0m;

        var result = new GatewayWebhookResult(
            EventType:        stripeEvent.Type,
            SessionId:        session.Id,
            PaymentIntentId:  session.PaymentIntentId,
            PaymentSucceeded: true,
            InvoiceId:        invoiceId,
            AmountPaid:       amountPaid,
            Currency:         session.Currency ?? _options.Currency);

        return Task.FromResult<GatewayWebhookResult?>(result);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    /// <summary>Convert a decimal amount to Stripe's smallest-currency-unit format (e.g. cents).</summary>
    private static long ToStripeAmount(decimal amount, string currency)
    {
        // Zero-decimal currencies (JPY, KRW, etc.) are not divided by 100
        // For standard USD/EUR/GBP etc., multiply by 100
        var zeroDecimal = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            { "bif","clp","gnf","jpy","kmf","krw","mga","pyg","rwf","ugx","vnd","vuv","xaf","xof","xpf" };

        return zeroDecimal.Contains(currency)
            ? (long)Math.Round(amount)
            : (long)Math.Round(amount * 100);
    }

    private static decimal FromStripeAmount(long stripeAmount, string? currency)
    {
        var zeroDecimal = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            { "bif","clp","gnf","jpy","kmf","krw","mga","pyg","rwf","ugx","vnd","vuv","xaf","xof","xpf" };

        return (currency is not null && zeroDecimal.Contains(currency))
            ? stripeAmount
            : stripeAmount / 100m;
    }

    private static string AppendQueryParam(string url, string key, string value)
    {
        var separator = url.Contains('?') ? "&" : "?";
        return $"{url}{separator}{key}={value}";
    }
}
