using EduERP.Application.DTOs.Auth;

namespace EduERP.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResultDto>  LoginAsync(LoginRequestDto dto, string clientIp, string userAgent);
    Task                 SendOtpAsync(string email);
    Task<AuthResultDto>  VerifyOtpAsync(OtpVerifyDto dto, string clientIp, string userAgent);
    Task<AuthResultDto>  RefreshTokenAsync(string refreshToken, string clientIp, string userAgent);
    Task                 LogoutAsync(string refreshToken);
    Task<UserProfileDto> GetProfileAsync(int userId);
}
