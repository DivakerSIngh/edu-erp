using EduERP.Application.DTOs.Auth;
using EduERP.Application.DTOs.Common;
using EduERP.Application.Interfaces;
using EduERP.Domain.Exceptions;
using Microsoft.Extensions.Logging;

namespace EduERP.Application.Services;

public class AuthService : IAuthService
{
    private readonly IAuthRepository  _authRepo;
    private readonly IJwtTokenService _jwtService;
    private readonly IPasswordHasher  _passwordHasher;
    private readonly IOtpService      _otpService;
    private readonly IEmailService    _emailService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IAuthRepository authRepo,
        IJwtTokenService jwtService,
        IPasswordHasher passwordHasher,
        IOtpService otpService,
        IEmailService emailService,
        ILogger<AuthService> logger)
    {
        _authRepo       = authRepo;
        _jwtService     = jwtService;
        _passwordHasher = passwordHasher;
        _otpService     = otpService;
        _emailService   = emailService;
        _logger         = logger;
    }

    // ── Email + Password Login ────────────────────────────────────────────────

    public async Task<AuthResultDto> LoginAsync(LoginRequestDto dto, string clientIp, string userAgent)
    {
        var user = await _authRepo.GetUserByEmailAsync(dto.Email);

        // Use timing-safe comparison even when user is null (prevent enumeration)
        var passwordValid = user != null &&
                            _passwordHasher.VerifyPassword(dto.Password, user.PasswordHash);

        if (!passwordValid)
        {
            _logger.LogWarning("Failed login attempt for email hash={EmailHash} IP={IP}",
                HashForLog(dto.Email), clientIp);
            throw new UnauthorizedException("Invalid email or password.");
        }

        if (!user!.IsActive)
            throw new UnauthorizedException("Account is deactivated.");

        return await IssueTokensAsync(user, clientIp, userAgent);
    }

    // ── OTP Flow ──────────────────────────────────────────────────────────────

    public async Task SendOtpAsync(string email)
    {
        var user = await _authRepo.GetUserByEmailAsync(email);

        // Always succeed (no enumeration) — only send email if user exists
        if (user != null && user.IsActive)
        {
            var otp = await _otpService.GenerateAndStoreOtpAsync(email);
            await _emailService.SendOtpAsync(user.Email, otp);
        }
    }

    public async Task<AuthResultDto> VerifyOtpAsync(OtpVerifyDto dto, string clientIp, string userAgent)
    {
        var isValid = await _otpService.ValidateOtpAsync(dto.Email, dto.Otp);
        if (!isValid)
            throw new UnauthorizedException("Invalid or expired OTP.");

        var user = await _authRepo.GetUserByEmailAsync(dto.Email);
        if (user == null || !user.IsActive)
            throw new UnauthorizedException("Account not found or deactivated.");

        return await IssueTokensAsync(user, clientIp, userAgent);
    }

    // ── Token Refresh ─────────────────────────────────────────────────────────

    public async Task<AuthResultDto> RefreshTokenAsync(string refreshToken, string clientIp, string userAgent)
    {
        var stored = await _authRepo.GetRefreshTokenAsync(refreshToken);

        if (stored == null || stored.IsRevoked || stored.ExpiresAt < DateTime.UtcNow)
            throw new UnauthorizedException("Refresh token is invalid or expired.");

        // Validate IP and device binding
        var expectedIpHash = _jwtService.ComputeBindingHash(clientIp);
        var expectedUaHash = _jwtService.ComputeBindingHash(userAgent);

        if (stored.IpHash != expectedIpHash || stored.UaHash != expectedUaHash)
        {
            // Potential token theft — revoke entire token family
            await _authRepo.RevokeTokenFamilyAsync(stored.FamilyId);
            _logger.LogWarning(
                "Refresh token binding mismatch — family revoked. UserId={UserId} IP={IP}",
                stored.UserId, clientIp);
            throw new UnauthorizedException("Security violation detected.");
        }

        // Rotate — invalidate old, issue new
        await _authRepo.RevokeRefreshTokenAsync(refreshToken);

        var user       = await _authRepo.GetUserByIdAsync(stored.UserId);
        var newAt      = _jwtService.GenerateAccessToken(user!, clientIp, userAgent);
        var (rt, hash) = _jwtService.GenerateRefreshToken();

        await _authRepo.StoreRefreshTokenAsync(new StoreRefreshTokenDto
        {
            UserId    = stored.UserId,
            TokenHash = hash,
            FamilyId  = stored.FamilyId,  // Keep same family for rotation tracking
            IpHash    = expectedIpHash,
            UaHash    = expectedUaHash,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });

        return new AuthResultDto
        {
            AccessToken  = newAt,
            RefreshToken = rt,
            User         = MapToProfile(user!),
            CsrfToken    = string.Empty  // CSRF not rotated on refresh
        };
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    public async Task LogoutAsync(string refreshToken)
    {
        await _authRepo.RevokeRefreshTokenAsync(refreshToken);
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    public async Task<UserProfileDto> GetProfileAsync(int userId)
    {
        var user = await _authRepo.GetUserByIdAsync(userId);
        if (user == null) throw new NotFoundException("User not found.");
        return MapToProfile(user);
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private async Task<AuthResultDto> IssueTokensAsync(
        UserRecord user, string clientIp, string userAgent)
    {
        var accessToken       = _jwtService.GenerateAccessToken(user, clientIp, userAgent);
        var (refreshPlain, hash) = _jwtService.GenerateRefreshToken();
        var familyId          = Guid.NewGuid().ToString();

        await _authRepo.StoreRefreshTokenAsync(new StoreRefreshTokenDto
        {
            UserId    = user.UserId,
            TokenHash = hash,
            FamilyId  = familyId,
            IpHash    = _jwtService.ComputeBindingHash(clientIp),
            UaHash    = _jwtService.ComputeBindingHash(userAgent),
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });

        await _authRepo.UpdateLastLoginAsync(user.UserId, clientIp);

        return new AuthResultDto
        {
            AccessToken  = accessToken,
            RefreshToken = refreshPlain,
            CsrfToken    = GenerateCsrfToken(),
            User         = MapToProfile(user)
        };
    }

    private static UserProfileDto MapToProfile(UserRecord user) => new()
    {
        UserId      = user.UserId,
        FullName    = user.FullName,
        Email       = user.Email,
        Role        = user.Role,
        Permissions = user.Permissions,
        LastLoginAt = user.LastLoginAt
    };

    private static string GenerateCsrfToken() =>
        Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));

    private static string HashForLog(string value) =>
        Convert.ToHexString(
            System.Security.Cryptography.SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes(value)))[..16];
}
