using EduERP.Application.Interfaces;
using Konscious.Security.Cryptography;
using System.Text;

namespace EduERP.Infrastructure.Security;

/// <summary>
/// Argon2id password hashing.
/// Parameters: memory=64MB, iterations=3, parallelism=4
/// These are intentionally expensive to resist brute-force attacks.
/// </summary>
public class PasswordHasher : IPasswordHasher
{
    private const int SaltSize        = 16;
    private const int HashSize        = 32;
    private const int Iterations      = 3;
    private const int MemorySize      = 65_536; // 64 MB
    private const int Parallelism     = 4;

    public string Hash(string password)
    {
        var salt = new byte[SaltSize];
        using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
        rng.GetBytes(salt);

        var hash = ComputeHash(password, salt);

        return $"$argon2id$v=19$m={MemorySize},t={Iterations},p={Parallelism}" +
               $"${Convert.ToBase64String(salt)}" +
               $"${Convert.ToBase64String(hash)}";
    }

    public bool VerifyPassword(string password, string storedHash)
    {
        // Expected format: $argon2id$v=19$m=65536,t=3,p=4$<salt>$<hash>
        var parts = storedHash.Split('$', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length < 5) return false;

        try
        {
            var salt        = Convert.FromBase64String(parts[3]);
            var expectedHash = Convert.FromBase64String(parts[4]);
            var actualHash  = ComputeHash(password, salt);

            // Constant-time comparison to prevent timing attacks
            return CryptographicEquals(actualHash, expectedHash);
        }
        catch
        {
            return false;
        }
    }

    private static byte[] ComputeHash(string password, byte[] salt)
    {
        using var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
        {
            Salt                = salt,
            Iterations          = Iterations,
            MemorySize          = MemorySize,
            DegreeOfParallelism = Parallelism
        };

        return argon2.GetBytes(HashSize);
    }

    private static bool CryptographicEquals(byte[] a, byte[] b)
    {
        if (a.Length != b.Length) return false;
        var diff = 0;
        for (var i = 0; i < a.Length; i++) diff |= a[i] ^ b[i];
        return diff == 0;
    }
}
