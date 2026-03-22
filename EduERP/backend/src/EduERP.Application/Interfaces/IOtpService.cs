namespace EduERP.Application.Interfaces;

public interface IOtpService
{
    Task<string> GenerateAndStoreOtpAsync(string email);
    Task<bool> ValidateOtpAsync(string email, string otp);
}
