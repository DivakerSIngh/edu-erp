using System.Security.Claims;
using EduERP.Application.DTOs.Auth;

namespace EduERP.Application.Interfaces;

public interface IJwtTokenService
{
    string GenerateAccessToken(UserRecord user, string clientIp, string userAgent);
    (string Token, string Hash) GenerateRefreshToken();
    string ComputeBindingHash(string value);
    ClaimsPrincipal? ValidateToken(string token);
}
