using System.ComponentModel.DataAnnotations;

namespace EduERP.Application.DTOs.Auth;

public record LoginRequestDto
{
    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required, MinLength(8), MaxLength(128)]
    public string Password { get; init; } = string.Empty;

    public bool RememberMe { get; init; }
}

public record OtpSendRequestDto
{
    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; init; } = string.Empty;
}

public record OtpVerifyDto
{
    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required, MinLength(6), MaxLength(6)]
    public string Otp { get; init; } = string.Empty;
}

public record OtpSendResponseDto
{
    public int ExpiresInSeconds { get; init; }
}

public class AuthResultDto
{
    public string         AccessToken  { get; set; } = string.Empty;
    public string         RefreshToken { get; set; } = string.Empty;
    public string         CsrfToken    { get; set; } = string.Empty;
    public UserProfileDto User         { get; set; } = null!;
}

public class UserProfileDto
{
    public int       UserId          { get; set; }
    public string    FullName        { get; set; } = string.Empty;
    public string    Email           { get; set; } = string.Empty;
    public string    Role            { get; set; } = string.Empty;
    public string[]  Permissions     { get; set; } = [];
    public string?   ProfileImageUrl { get; set; }
    public DateTime? LastLoginAt     { get; set; }
}

public class TokenResponseDto
{
    public string AccessToken  { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}

public class StoreRefreshTokenDto
{
    public int      UserId    { get; set; }
    public string   TokenHash { get; set; } = string.Empty;
    public string   FamilyId  { get; set; } = string.Empty;
    public string   IpHash    { get; set; } = string.Empty;
    public string   UaHash    { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}
