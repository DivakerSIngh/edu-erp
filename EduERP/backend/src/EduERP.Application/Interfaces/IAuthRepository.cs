using EduERP.Application.DTOs.Auth;

namespace EduERP.Application.Interfaces;

public interface IAuthRepository
{
    Task<UserRecord?> GetUserByEmailAsync(string email);
    Task<UserRecord?> GetUserByIdAsync(int userId);
    Task<RefreshTokenRecord?> GetRefreshTokenAsync(string token);
    Task StoreRefreshTokenAsync(StoreRefreshTokenDto dto);
    Task RevokeRefreshTokenAsync(string token);
    Task RevokeTokenFamilyAsync(string familyId);
    Task UpdateLastLoginAsync(int userId, string ip);
}
