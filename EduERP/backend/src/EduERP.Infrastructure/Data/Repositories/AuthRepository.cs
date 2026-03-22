using EduERP.Application.DTOs.Auth;
using EduERP.Application.Interfaces;

namespace EduERP.Infrastructure.Data.Repositories;

public class AuthRepository : BaseRepository, IAuthRepository
{
    public AuthRepository(IDbConnectionFactory factory) : base(factory) { }

    public Task<UserRecord?> GetUserByEmailAsync(string email) =>
        QueryFirstOrDefaultAsync<UserRecord>(
            "usp_Auth_GetUserByEmail",
            new { Email = email });

    public Task<UserRecord?> GetUserByIdAsync(int userId) =>
        QueryFirstOrDefaultAsync<UserRecord>(
            "usp_Auth_GetUserById",
            new { UserId = userId });

    public Task<RefreshTokenRecord?> GetRefreshTokenAsync(string token)
    {
        // Store and compare SHA-256 hash — never the raw token
        var hash = ComputeSha256(token);
        return QueryFirstOrDefaultAsync<RefreshTokenRecord>(
            "usp_Auth_GetRefreshToken",
            new { TokenHash = hash });
    }

    public Task StoreRefreshTokenAsync(StoreRefreshTokenDto dto) =>
        ExecuteAsync("usp_Auth_StoreRefreshToken", new
        {
            dto.UserId,
            dto.TokenHash,
            dto.FamilyId,
            dto.IpHash,
            dto.UaHash,
            dto.ExpiresAt
        });

    public Task RevokeRefreshTokenAsync(string token) =>
        ExecuteAsync("usp_Auth_RevokeRefreshToken",
            new { TokenHash = ComputeSha256(token) });

    public Task RevokeTokenFamilyAsync(string familyId) =>
        ExecuteAsync("usp_Auth_RevokeTokenFamily", new { FamilyId = familyId });

    public Task UpdateLastLoginAsync(int userId, string ip) =>
        ExecuteAsync("usp_Auth_UpdateLastLogin", new { UserId = userId, IpAddress = ip });

    private static string ComputeSha256(string value)
    {
        var bytes = System.Security.Cryptography.SHA256.HashData(
            System.Text.Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes).ToLower();
    }
}
