namespace EduERP.API.Middleware;

/// <summary>
/// Injects security-hardening HTTP response headers on every response.
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        var h = context.Response.Headers;

        // Block MIME sniffing
        h["X-Content-Type-Options"]    = "nosniff";

        // Prevent clickjacking
        h["X-Frame-Options"]           = "DENY";

        // Force HTTPS for 1 year
        h["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";

        // Minimal referrer exposure
        h["Referrer-Policy"]           = "strict-origin-when-cross-origin";

        // Restrict browser features
        h["Permissions-Policy"]        = "camera=(), microphone=(), geolocation=(), payment=()";

        // Content Security Policy
        h["Content-Security-Policy"]   =
            "default-src 'self'; " +
            "script-src 'self'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https://cdn.eduerp.com; " +
            "font-src 'self'; " +
            "connect-src 'self' https://api.eduerp.com; " +
            "frame-ancestors 'none'; " +
            "upgrade-insecure-requests;";

        // Remove server identification header
        h.Remove("Server");
        h.Remove("X-Powered-By");

        await _next(context);
    }
}
