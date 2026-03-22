using System.Security.Cryptography;
using System.Text;
using EduERP.Application.Interfaces;
using Microsoft.Extensions.Caching.Distributed;

namespace EduERP.Infrastructure.Security;

public class OtpService : IOtpService
{
    private readonly IDistributedCache _cache;
    private const int OtpExpirySeconds = 300;    // 5 minutes
    private const int MaxAttempts      = 3;

    public OtpService(IDistributedCache cache) => _cache = cache;

    public async Task<string> GenerateAndStoreOtpAsync(string email)
    {
        // 6-digit OTP using cryptographically secure random bytes
        var bytes = RandomNumberGenerator.GetBytes(3);
        var otp   = string.Concat(bytes.Select(b => (b % 10).ToString()));

        var normalizedEmail = NormalizeEmail(email);
        var otpKey          = $"otp:{normalizedEmail}";
        var attemptKey      = $"otp_atk:{normalizedEmail}";

        // Hash before storing — raw OTP is never persisted anywhere
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(otp));
        var hash      = Convert.ToHexString(hashBytes).ToLower();

        var cacheOpts = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(OtpExpirySeconds)
        };

        await _cache.SetStringAsync(otpKey,     hash,  cacheOpts);
        await _cache.SetStringAsync(attemptKey, "0",   cacheOpts);

        return otp;  // Returned to email service only — never to client
    }

    public async Task<bool> ValidateOtpAsync(string email, string otp)
    {
        var normalizedEmail = NormalizeEmail(email);
        var otpKey          = $"otp:{normalizedEmail}";
        var attemptKey      = $"otp_atk:{normalizedEmail}";

        var attemptsStr = await _cache.GetStringAsync(attemptKey);
        var attempts    = int.TryParse(attemptsStr, out var n) ? n : 0;

        if (attempts >= MaxAttempts)
            throw new Domain.Exceptions.UnauthorizedException(
                "Too many failed OTP attempts. Please request a new OTP.");

        var storedHash = await _cache.GetStringAsync(otpKey);
        if (storedHash == null) return false;

        var inputHashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(otp));
        var inputHash      = Convert.ToHexString(inputHashBytes).ToLower();

        // Constant-time comparison prevents timing attacks
        var isValid = CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(storedHash),
            Encoding.UTF8.GetBytes(inputHash));

        if (isValid)
        {
            // Single-use: delete immediately after successful validation
            await _cache.RemoveAsync(otpKey);
            await _cache.RemoveAsync(attemptKey);
        }
        else
        {
            // Increment attempt counter (reuse existing TTL)
            await _cache.SetStringAsync(attemptKey, (attempts + 1).ToString(),
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(OtpExpirySeconds)
                });
        }

        return isValid;
    }

    private static string NormalizeEmail(string email) =>
        email.Trim().ToLowerInvariant();
}
