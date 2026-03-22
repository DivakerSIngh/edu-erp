namespace EduERP.Application.Interfaces;

public interface IEmailService
{
    Task SendOtpAsync(string toEmail, string otpCode);
    Task SendWelcomeAsync(string toEmail, string fullName, string enrollment);
}
