namespace EduERP.Application.Interfaces;

public interface IPasswordHasher
{
    /// <summary>Hash a plain-text password using Argon2id.</summary>
    string Hash(string password);

    /// <summary>Verify a plain-text password against a stored Argon2id hash.</summary>
    bool VerifyPassword(string password, string storedHash);
}
