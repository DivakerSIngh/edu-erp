using EduERP.Application.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;

namespace EduERP.Infrastructure.Security;

public class CookieService : ICookieService
{
    private readonly IWebHostEnvironment _env;

    public CookieService(IWebHostEnvironment env) => _env = env;

    /// <summary>
    /// Access token cookie.
    /// HttpOnly: unreachable from JS → eliminates XSS-based theft.
    /// SameSite=Strict: never sent on cross-origin requests → CSRF mitigation.
    /// Path=/api: scoped to API endpoints only.
    /// </summary>
    public void SetAccessTokenCookie(HttpResponse response, string token)
    {
        response.Cookies.Append("access_token", token, new CookieOptions
        {
            HttpOnly  = true,
            Secure    = !_env.IsDevelopment(),  // HTTPS only outside dev
            SameSite  = SameSiteMode.Strict,
            Expires   = DateTimeOffset.UtcNow.AddMinutes(10),
            Path      = "/api"
        });
    }

    /// <summary>
    /// Refresh token cookie.
    /// Path scoped to ONLY the refresh endpoint — cannot be sent to any other API route.
    /// </summary>
    public void SetRefreshTokenCookie(HttpResponse response, string token)
    {
        response.Cookies.Append("refresh_token", token, new CookieOptions
        {
            HttpOnly  = true,
            Secure    = !_env.IsDevelopment(),
            SameSite  = SameSiteMode.Strict,
            Expires   = DateTimeOffset.UtcNow.AddDays(7),
            Path      = "/api/v1/auth/refresh"  // Scoped to refresh endpoint only
        });
    }

    /// <summary>
    /// CSRF token — NOT HttpOnly so JavaScript can read it and inject into X-CSRF-Token header.
    /// Valid because it provides no value to an attacker without the HttpOnly access_token.
    /// </summary>
    public void SetCsrfTokenCookie(HttpResponse response, string token)
    {
        response.Cookies.Append("csrf_token", token, new CookieOptions
        {
            HttpOnly  = false,              // Must be readable by JS
            Secure    = !_env.IsDevelopment(),
            SameSite  = SameSiteMode.Strict,
            Expires   = DateTimeOffset.UtcNow.AddDays(1),
            Path      = "/"
        });
    }

    /// <summary>Expire all auth cookies — used on logout.</summary>
    public void ClearAllTokenCookies(HttpResponse response)
    {
        var accessExpired  = new CookieOptions { Expires = DateTimeOffset.UnixEpoch, Path = "/api" };
        var refreshExpired = new CookieOptions { Expires = DateTimeOffset.UnixEpoch, Path = "/api/v1/auth/refresh" };
        var csrfExpired    = new CookieOptions { Expires = DateTimeOffset.UnixEpoch, Path = "/" };

        response.Cookies.Append("access_token",  string.Empty, accessExpired);
        response.Cookies.Append("refresh_token", string.Empty, refreshExpired);
        response.Cookies.Append("csrf_token",    string.Empty, csrfExpired);
    }
}
