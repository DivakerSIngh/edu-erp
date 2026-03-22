using EduERP.API.Extensions;
using EduERP.Application.DTOs.Auth;
using EduERP.Application.DTOs.Common;
using EduERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace EduERP.API.Controllers.v1;

/// <summary>
/// Handles authentication: email/password login, OTP login, token refresh, logout.
/// All tokens are delivered and cleared via HttpOnly cookies — NEVER in response body.
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService  _authService;
    private readonly ICookieService _cookieService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthService authService,
        ICookieService cookieService,
        ILogger<AuthController> logger)
    {
        _authService   = authService;
        _cookieService = cookieService;
        _logger        = logger;
    }

    // ── Email + Password Login ───────────────────────────────────────────────

    /// <summary>Login with email and password. Tokens set as HttpOnly cookies.</summary>
    /// <response code="200">Login successful — user profile returned</response>
    /// <response code="400">Validation error</response>
    /// <response code="401">Invalid credentials</response>
    /// <response code="429">Rate limit exceeded</response>
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth-login")]
    [ProducesResponseType(typeof(ApiResponseDto<UserProfileDto>), 200)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 400)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 401)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        var clientIp  = GetClientIp();
        var userAgent = Request.Headers.UserAgent.ToString();

        var result = await _authService.LoginAsync(dto, clientIp, userAgent);

        _cookieService.SetAccessTokenCookie(Response,  result.AccessToken);
        _cookieService.SetRefreshTokenCookie(Response, result.RefreshToken);
        _cookieService.SetCsrfTokenCookie(Response,    result.CsrfToken);

        _logger.LogInformation(
            "Login successful. UserId={UserId} IP={IP}", result.User.UserId, clientIp);

        return Ok(ApiResponseDto<UserProfileDto>.Success(result.User, "Login successful"));
    }

    // ── OTP Login ───────────────────────────────────────────────────────────

    /// <summary>Send a 6-digit OTP to the user's registered email address.</summary>
    /// <response code="200">OTP sent (always 200 to prevent email enumeration)</response>
    [HttpPost("otp/send")]
    [AllowAnonymous]
    [EnableRateLimiting("auth-otp-send")]
    [ProducesResponseType(typeof(ApiResponseDto<OtpSendResponseDto>), 200)]
    public async Task<IActionResult> SendOtp([FromBody] OtpSendRequestDto dto)
    {
        // Always returns 200 regardless of whether email exists
        // This prevents user enumeration via timing analysis
        await _authService.SendOtpAsync(dto.Email);

        return Ok(ApiResponseDto<OtpSendResponseDto>.Success(
            new OtpSendResponseDto { ExpiresInSeconds = 300 },
            "OTP sent to your email if it is registered."));
    }

    /// <summary>Verify OTP and issue tokens as HttpOnly cookies.</summary>
    /// <response code="200">OTP valid — tokens issued</response>
    /// <response code="400">Invalid or expired OTP</response>
    [HttpPost("otp/verify")]
    [AllowAnonymous]
    [EnableRateLimiting("auth-otp-verify")]
    [ProducesResponseType(typeof(ApiResponseDto<UserProfileDto>), 200)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 400)]
    public async Task<IActionResult> VerifyOtp([FromBody] OtpVerifyDto dto)
    {
        var clientIp  = GetClientIp();
        var userAgent = Request.Headers.UserAgent.ToString();

        var result = await _authService.VerifyOtpAsync(dto, clientIp, userAgent);

        _cookieService.SetAccessTokenCookie(Response,  result.AccessToken);
        _cookieService.SetRefreshTokenCookie(Response, result.RefreshToken);
        _cookieService.SetCsrfTokenCookie(Response,    result.CsrfToken);

        return Ok(ApiResponseDto<UserProfileDto>.Success(result.User, "Login successful"));
    }

    // ── Token Refresh ────────────────────────────────────────────────────────

    /// <summary>
    /// Issue a new access token using the refresh token cookie.
    /// No request body required — refresh token is read from cookie.
    /// </summary>
    /// <response code="200">New access token issued</response>
    /// <response code="401">Refresh token invalid, expired, or IP/device mismatch</response>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Refresh()
    {
        var refreshToken = Request.Cookies["refresh_token"];
        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized(ApiResponseDto<object>.Fail("Refresh token missing."));

        var clientIp  = GetClientIp();
        var userAgent = Request.Headers.UserAgent.ToString();

        var result = await _authService.RefreshTokenAsync(refreshToken, clientIp, userAgent);

        _cookieService.SetAccessTokenCookie(Response, result.AccessToken);

        return Ok(ApiResponseDto<object>.Success(null, "Token refreshed"));
    }

    // ── Logout ───────────────────────────────────────────────────────────────

    /// <summary>Revoke all tokens and clear authentication cookies.</summary>
    /// <response code="204">Logged out successfully</response>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(204)]
    public async Task<IActionResult> Logout()
    {
        var refreshToken = Request.Cookies["refresh_token"];
        if (!string.IsNullOrEmpty(refreshToken))
            await _authService.LogoutAsync(refreshToken);

        _cookieService.ClearAllTokenCookies(Response);

        return NoContent();
    }

    // ── Current User ─────────────────────────────────────────────────────────

    /// <summary>Get the authenticated user's profile.</summary>
    /// <response code="200">User profile</response>
    /// <response code="401">Not authenticated</response>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponseDto<UserProfileDto>), 200)]
    public async Task<IActionResult> Me()
    {
        var userId = User.GetUserId();
        var profile = await _authService.GetProfileAsync(userId);
        return Ok(ApiResponseDto<UserProfileDto>.Success(profile));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private string GetClientIp()
    {
        // Only use X-Forwarded-For if behind a known trusted proxy
        // In production, configure trusted proxies in YARP/Nginx
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}
