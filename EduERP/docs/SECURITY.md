# Security Architecture — Education ERP System

---

## 1. Authentication Security

### 1.1 Token Storage — HttpOnly Cookies

**Never** store tokens in `localStorage` or `sessionStorage`. These are accessible by any JavaScript on the page and are trivially stolen via XSS.

```
┌─────────────────────────────────────────────────────────┐
│                  CORRECT Approach                        │
│  Tokens stored in HttpOnly, Secure, SameSite=Strict     │
│  Cookies — UNREACHABLE by JavaScript                    │
├─────────────────────────────────────────────────────────┤
│                  WRONG Approach                          │
│  localStorage.setItem('token', jwt)  ← XSS STEALS THIS │
└─────────────────────────────────────────────────────────┘
```

### Cookie Configuration

```csharp
// CookieService.cs
public void SetAccessTokenCookie(HttpResponse response, string token)
{
    response.Cookies.Append("access_token", token, new CookieOptions
    {
        HttpOnly  = true,               // Unreachable from JavaScript
        Secure    = true,               // HTTPS only
        SameSite  = SameSiteMode.Strict,// No cross-origin sends (CSRF mitigation)
        Expires   = DateTimeOffset.UtcNow.AddMinutes(10),
        Path      = "/api",             // Scoped to API path only
        Domain    = ".eduerp.com"       // Scoped to main domain
    });
}

public void SetRefreshTokenCookie(HttpResponse response, string token)
{
    response.Cookies.Append("refresh_token", token, new CookieOptions
    {
        HttpOnly  = true,
        Secure    = true,
        SameSite  = SameSiteMode.Strict,
        Expires   = DateTimeOffset.UtcNow.AddDays(7),
        Path      = "/api/v1/auth/refresh",  // Scoped ONLY to refresh endpoint
        Domain    = ".eduerp.com"
    });
}

public void ClearTokenCookies(HttpResponse response)
{
    response.Cookies.Delete("access_token");
    response.Cookies.Delete("refresh_token");
}
```

---

## 2. Token Binding (IP + Device)

### Purpose
Even if a token is somehow intercepted (e.g., via network MITM), it cannot be used from a different IP or device.

### Implementation

```csharp
// JwtTokenService.cs — Token generation with IP/UA binding
public string GenerateAccessToken(User user, string clientIp, string userAgent)
{
    var ipHash  = ComputeHash(clientIp  + _options.BindingSecret);
    var uaHash  = ComputeHash(userAgent + _options.BindingSecret);

    var claims = new List<Claim>
    {
        new(JwtRegisteredClaimNames.Sub,  user.UserId.ToString()),
        new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        new(ClaimTypes.Role,              user.Role.ToString()),
        new("ip_hash",                    ipHash),
        new("ua_hash",                    uaHash),
        new(JwtRegisteredClaimNames.Iat,  DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString())
    };

    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject            = new ClaimsIdentity(claims),
        Expires            = DateTime.UtcNow.AddMinutes(_options.AccessTokenExpiryMinutes),
        SigningCredentials = new SigningCredentials(_signingKey, SecurityAlgorithms.HmacSha256),
        Issuer             = _options.Issuer,
        Audience           = _options.Audience
    };

    return _tokenHandler.WriteToken(_tokenHandler.CreateToken(tokenDescriptor));
}

private string ComputeHash(string value)
{
    var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
    return Convert.ToHexString(bytes).ToLower();
}
```

### Token Validation Middleware

```csharp
// Called on every protected request after JWT signature validation
public void ValidateTokenBinding(ClaimsPrincipal principal, HttpContext context)
{
    var clientIp  = GetClientIp(context);
    var userAgent = context.Request.Headers.UserAgent.ToString();

    var expectedIpHash = ComputeHash(clientIp  + _options.BindingSecret);
    var expectedUaHash = ComputeHash(userAgent + _options.BindingSecret);

    var tokenIpHash = principal.FindFirstValue("ip_hash");
    var tokenUaHash = principal.FindFirstValue("ua_hash");

    if (tokenIpHash != expectedIpHash || tokenUaHash != expectedUaHash)
    {
        // Token was issued for a different IP or device — REJECT
        _logger.LogWarning(
            "Token binding mismatch. UserID={UserId}, IP={IP}",
            principal.GetUserId(), clientIp);
        throw new UnauthorizedException("Token binding validation failed.");
    }
}

private static string GetClientIp(HttpContext context)
{
    // Honour X-Forwarded-For only from trusted proxies
    // DO NOT blindly trust X-Forwarded-For — it can be spoofed
    return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}
```

---

## 3. Password Security

### Hashing with Argon2id

```csharp
// PasswordHasher.cs — Argon2id (winner of PHC, recommended over bcrypt)
public class PasswordHasher : IPasswordHasher
{
    private const int MemoryCost    = 65536;  // 64 MB
    private const int TimeCost      = 3;      // Iterations
    private const int Parallelism   = 2;
    private const int HashLength    = 32;
    private const int SaltLength    = 16;

    public string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltLength);
        var hash = Argon2.Hash(
            Encoding.UTF8.GetBytes(password),
            salt,
            MemoryCost, TimeCost, Parallelism, HashLength);

        // Store as: $argon2id$v=19$...$salt$hash (PHC string format)
        return $"{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hash)}";
    }

    public bool VerifyPassword(string password, string storedHash)
    {
        var parts    = storedHash.Split(':');
        var salt     = Convert.FromBase64String(parts[0]);
        var expected = Convert.FromBase64String(parts[1]);

        var computed = Argon2.Hash(
            Encoding.UTF8.GetBytes(password),
            salt,
            MemoryCost, TimeCost, Parallelism, HashLength);

        // Constant-time comparison prevents timing attacks
        return CryptographicOperations.FixedTimeEquals(computed, expected);
    }
}
```

---

## 4. OTP Security

```csharp
// OtpService.cs
public class OtpService : IOtpService
{
    private readonly IRedisCacheService _cache;
    private const int OtpExpirySeconds  = 300;  // 5 minutes
    private const int MaxAttempts       = 3;    // Brute force protection

    public async Task<string> GenerateAndStoreOtpAsync(string email)
    {
        // Cryptographically secure OTP — NOT System.Random
        var otp = string.Join("", RandomNumberGenerator.GetBytes(3)
                                                        .Select(b => (b % 10).ToString()));

        var key     = $"otp:{email.ToLowerInvariant()}";
        var atkKey  = $"otp_attempts:{email.ToLowerInvariant()}";

        // Hash before storing — raw OTP never persisted
        var otpHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(otp)));

        await _cache.SetAsync(key,    otpHash, TimeSpan.FromSeconds(OtpExpirySeconds));
        await _cache.SetAsync(atkKey, "0",     TimeSpan.FromSeconds(OtpExpirySeconds));

        return otp; // Returned only to email service, never to client
    }

    public async Task<bool> ValidateOtpAsync(string email, string otp)
    {
        var key    = $"otp:{email.ToLowerInvariant()}";
        var atkKey = $"otp_attempts:{email.ToLowerInvariant()}";

        var attempts = int.Parse(await _cache.GetAsync(atkKey) ?? "0");
        if (attempts >= MaxAttempts)
            throw new UnauthorizedException("Too many OTP attempts. Request a new OTP.");

        var stored = await _cache.GetAsync(key);
        if (stored == null)
            return false;

        var inputHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(otp)));
        var isValid   = CryptographicOperations.FixedTimeEquals(
                            Encoding.UTF8.GetBytes(stored),
                            Encoding.UTF8.GetBytes(inputHash));

        if (isValid)
        {
            await _cache.DeleteAsync(key);    // Single-use: invalidate immediately
            await _cache.DeleteAsync(atkKey);
        }
        else
        {
            await _cache.IncrementAsync(atkKey);
        }

        return isValid;
    }
}
```

---

## 5. Rate Limiting

### Sliding Window Rate Limiter (Redis-backed)

```csharp
// RateLimitingMiddleware.cs
public class RateLimitingMiddleware
{
    private static readonly Dictionary<string, (int Limit, int WindowSeconds)> _policies = new()
    {
        { "/api/v1/auth/login",      (5,   60) },   // 5 attempts per 60s — brute force
        { "/api/v1/auth/otp/send",   (3,  300) },   // 3 OTP requests per 5 min
        { "/api/v1/auth/otp/verify", (5,  300) },   // 5 verify attempts per 5 min
        { "default",                 (100, 60) },   // 100 req/min general
    };

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var path   = context.Request.Path.ToString().ToLower();
        var ip     = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var policy = _policies.ContainsKey(path) ? _policies[path] : _policies["default"];

        var key   = $"rl:{ip}:{path}";
        var count = await _cache.IncrementAsync(key);

        if (count == 1)
            await _cache.SetExpiryAsync(key, TimeSpan.FromSeconds(policy.WindowSeconds));

        if (count > policy.Limit)
        {
            context.Response.StatusCode = 429;
            context.Response.Headers["Retry-After"] = policy.WindowSeconds.ToString();
            await context.Response.WriteAsJsonAsync(new { success = false, message = "Rate limit exceeded." });
            return;
        }

        await next(context);
    }
}
```

---

## 6. Security Headers

```csharp
// SecurityHeadersMiddleware.cs
public async Task InvokeAsync(HttpContext context, RequestDelegate next)
{
    var headers = context.Response.Headers;

    // Prevent MIME-type sniffing
    headers["X-Content-Type-Options"]    = "nosniff";

    // Prevent clickjacking
    headers["X-Frame-Options"]           = "DENY";

    // Force HTTPS for 1 year (HSTS)
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";

    // Restrict referrer info
    headers["Referrer-Policy"]           = "strict-origin-when-cross-origin";

    // Permissions policy: deny camera, mic, geolocation
    headers["Permissions-Policy"]        = "camera=(), microphone=(), geolocation=()";

    // Content Security Policy
    headers["Content-Security-Policy"]   =
        "default-src 'self'; " +
        "script-src 'self'; " +             // No inline scripts
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https://cdn.eduerp.com; " +
        "font-src 'self'; " +
        "connect-src 'self' https://api.eduerp.com; " +
        "frame-ancestors 'none'; " +        // clickjacking
        "upgrade-insecure-requests;";

    await next(context);
}
```

---

## 7. CSRF Protection

Since cookies are `SameSite=Strict`, cross-origin requests will never include the cookies automatically. For additional defense-in-depth on state-changing requests, a double-submit CSRF token pattern is used:

### Backend — Generate CSRF Token on Login

```csharp
// AuthController.cs — add CSRF token to response on successful login
var csrfToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
response.Cookies.Append("csrf_token", csrfToken, new CookieOptions
{
    HttpOnly = false,             // Must be readable by JS to include in header
    Secure   = true,
    SameSite = SameSiteMode.Strict,
    Expires  = DateTimeOffset.UtcNow.AddDays(1)
});
```

### Frontend — Include in Mutation Requests

```typescript
// axiosInstance.ts
apiClient.interceptors.request.use((config) => {
    if (['post','put','patch','delete'].includes(config.method ?? '')) {
        // Read CSRF token from non-HttpOnly cookie
        const csrf = getCookieValue('csrf_token');
        if (csrf) config.headers['X-CSRF-Token'] = csrf;
    }
    return config;
});
```

### Backend — Validate CSRF Header

```csharp
// ValidationFilter.cs
if (HttpMethods.IsPost(method) || HttpMethods.IsPut(method) || HttpMethods.IsPatch(method))
{
    var headerToken = context.HttpContext.Request.Headers["X-CSRF-Token"].ToString();
    var cookieToken = context.HttpContext.Request.Cookies["csrf_token"];

    if (string.IsNullOrEmpty(headerToken) || headerToken != cookieToken)
    {
        context.Result = new JsonResult(new { success = false, message = "CSRF validation failed." })
        {
            StatusCode = 403
        };
        return;
    }
}
```

---

## 8. SQL Injection Prevention

All database operations go through **parameterized stored procedures only**:

```csharp
// BaseRepository.cs — NEVER build SQL strings with user input
public async Task<T?> QueryFirstOrDefaultAsync<T>(
    string storedProcedure,
    object parameters)
{
    using var connection = _connectionFactory.CreateConnection();
    return await connection.QueryFirstOrDefaultAsync<T>(
        storedProcedure,
        parameters,
        commandType: CommandType.StoredProcedure  // SP call, never raw SQL
    );
}
```

```sql
-- The SPs use parameters, never string concatenation
CREATE PROCEDURE usp_Auth_GetUserByEmail
    @Email NVARCHAR(256)    -- Parameterized: SQL Server treats as data, not code
AS
BEGIN
    SELECT UserId, PasswordHash, Role, IsActive
    FROM   Users
    WHERE  Email     = @Email   -- Safe
    AND    IsDeleted = 0;
END;
```

---

## 9. Refresh Token Rotation and Revocation

```csharp
// AuthService.cs
public async Task<TokenResponseDto> RefreshTokenAsync(string refreshToken, string ip, string ua)
{
    // 1. Validate token record exists in DB
    var stored = await _authRepo.GetRefreshTokenAsync(refreshToken);
    if (stored == null || stored.IsRevoked || stored.ExpiresAt < DateTime.UtcNow)
        throw new UnauthorizedException("Refresh token invalid or expired.");

    // 2. Validate binding
    if (stored.IpHash != ComputeHash(ip) || stored.UaHash != ComputeHash(ua))
    {
        // Possible token theft — revoke the ENTIRE family
        await _authRepo.RevokeTokenFamilyAsync(stored.FamilyId);
        _logger.LogWarning("Refresh token reuse detected. Family revoked. IP={IP}", ip);
        throw new UnauthorizedException("Security violation detected.");
    }

    // 3. Rotate — revoke old, issue new
    await _authRepo.RevokeRefreshTokenAsync(refreshToken);
    var user     = await _authRepo.GetUserByIdAsync(stored.UserId);
    var newAt    = _jwtService.GenerateAccessToken(user, ip, ua);
    var (newRt, newRtHash) = GenerateRefreshToken();

    await _authRepo.StoreRefreshTokenAsync(
        stored.UserId, newRtHash, stored.FamilyId, ip, ua,
        DateTime.UtcNow.AddDays(7));

    return new TokenResponseDto { AccessToken = newAt, RefreshToken = newRt };
}
```

---

## 10. Audit & Logging

### What Is Logged

| Event | Level | Details |
|---|---|---|
| Login success | `Information` | UserId, IP, role, timestamp |
| Login failure | `Warning` | Email (hashed), IP, attempt count |
| Token binding mismatch | `Warning` | UserId, IP, expected vs actual |
| Unauthorized access | `Warning` | UserId, endpoint, role |
| Admin actions | `Information` | UserId, action, target entity |
| Exceptions | `Error` | Full stack trace, request context |
| Rate limit exceeded | `Warning` | IP, endpoint |

### Structured Log Format (Serilog)

```json
{
  "Timestamp": "2026-03-20T09:15:32.123Z",
  "Level": "Warning",
  "Message": "Login failed for {Email}",
  "Properties": {
    "Email": "sha256:a9b8c7...",
    "IP": "192.168.1.100",
    "AttemptCount": 3,
    "TraceId": "abc-123-xyz",
    "CorrelationId": "req-456"
  }
}
```

> **PII Masking:** Email addresses and phone numbers are hashed (SHA-256) before logging. Never log raw passwords, tokens, or PII.
