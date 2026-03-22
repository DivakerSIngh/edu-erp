using EduERP.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace EduERP.Infrastructure.Messaging;

/// <summary>
/// Stub email service — logs emails instead of sending them.
/// Replace with a real SMTP / SendGrid / SES implementation for production.
/// </summary>
public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;

    public EmailService(ILogger<EmailService> logger) => _logger = logger;

    public Task SendOtpAsync(string toEmail, string otpCode)
    {
        _logger.LogInformation("[EMAIL] OTP {Otp} → {Email}", otpCode, Redact(toEmail));
        return Task.CompletedTask;
    }

    public Task SendWelcomeAsync(string toEmail, string fullName, string enrollment)
    {
        _logger.LogInformation("[EMAIL] Welcome {FullName} ({Enrollment}) → {Email}", fullName, enrollment, Redact(toEmail));
        return Task.CompletedTask;
    }

    private static string Redact(string email)
    {
        var at = email.IndexOf('@');
        if (at <= 1) return "***";
        return email[0] + "***" + email[at..];
    }
}
