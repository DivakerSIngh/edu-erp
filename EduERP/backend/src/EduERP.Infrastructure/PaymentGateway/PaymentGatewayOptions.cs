namespace EduERP.Infrastructure.PaymentGateway;

public class PaymentGatewayOptions
{
    public const string SectionName = "PaymentGateway";

    public string Provider      { get; init; } = "Stripe";
    public string SecretKey     { get; init; } = string.Empty;
    public string PublishableKey { get; init; } = string.Empty;
    public string WebhookSecret { get; init; } = string.Empty;
    public string Currency      { get; init; } = "usd";

    /// <summary>Session expiry in minutes (Stripe minimum is 30).</summary>
    public int SessionExpiryMinutes { get; init; } = 30;
}
