using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using EduERP.Application.DTOs.Auth;
using EduERP.Application.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace EduERP.Infrastructure.Security;

public class JwtOptions
{
    public string  SecretKey             { get; set; } = string.Empty;
    public string  Issuer                { get; set; } = string.Empty;
    public string  Audience              { get; set; } = string.Empty;
    public int     AccessTokenExpiryMinutes { get; set; } = 10;
    public string  BindingSecret         { get; set; } = string.Empty;
}

public class JwtTokenService : IJwtTokenService
{
    private readonly JwtOptions             _opts;
    private readonly JwtSecurityTokenHandler _handler = new();
    private readonly SymmetricSecurityKey   _signingKey;

    public JwtTokenService(IOptions<JwtOptions> opts)
    {
        _opts       = opts.Value;
        _signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opts.SecretKey));
    }

    public string GenerateAccessToken(UserRecord user, string clientIp, string userAgent)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub,   user.UserId.ToString()),
            new(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Role,               user.Role),
            new("ip_hash",                     ComputeBindingHash(clientIp)),
            new("ua_hash",                     ComputeBindingHash(userAgent)),
        };

        // Include permission claims
        foreach (var perm in user.Permissions)
            claims.Add(new Claim("permission", perm));

        var descriptor = new SecurityTokenDescriptor
        {
            Subject            = new ClaimsIdentity(claims),
            Expires            = DateTime.UtcNow.AddMinutes(_opts.AccessTokenExpiryMinutes),
            Issuer             = _opts.Issuer,
            Audience           = _opts.Audience,
            SigningCredentials = new SigningCredentials(_signingKey, SecurityAlgorithms.HmacSha256)
        };

        return _handler.WriteToken(_handler.CreateToken(descriptor));
    }

    /// <summary>
    /// Generates a cryptographically secure refresh token.
    /// Returns both the plain token (for cookie) and its SHA-256 hash (for DB storage).
    /// The plain token is NEVER stored in the database.
    /// </summary>
    public (string Token, string Hash) GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        var token = Convert.ToBase64String(bytes);
        var hash  = ComputeSha256(token);
        return (token, hash);
    }

    /// <summary>Computes HMAC-SHA256 binding hash for IP or User-Agent.</summary>
    public string ComputeBindingHash(string value)
    {
        var key     = Encoding.UTF8.GetBytes(_opts.BindingSecret);
        var msg     = Encoding.UTF8.GetBytes(value);
        var hmac    = HMACSHA256.HashData(key, msg);
        return Convert.ToHexString(hmac).ToLower();
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        try
        {
            var principal = _handler.ValidateToken(token,
                new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey         = _signingKey,
                    ValidateIssuer           = true,
                    ValidIssuer              = _opts.Issuer,
                    ValidateAudience         = true,
                    ValidAudience            = _opts.Audience,
                    ValidateLifetime         = true,
                    ClockSkew                = TimeSpan.Zero   // No grace period
                }, out _);
            return principal;
        }
        catch
        {
            return null;
        }
    }

    private static string ComputeSha256(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes).ToLower();
    }
}
