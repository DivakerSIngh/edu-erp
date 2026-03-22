using EduERP.Domain.Enums;

namespace EduERP.Domain.Entities;

public class User : BaseEntity
{
    public int      UserId       { get; set; }
    public string   FullName     { get; set; } = string.Empty;
    public string   Email        { get; set; } = string.Empty;
    public string   PasswordHash { get; set; } = string.Empty;
    public UserRole Role         { get; set; }
    public string?  Phone        { get; set; }
    public bool     IsActive     { get; set; } = true;
    public DateTime? LastLoginAt  { get; set; }
    public string?  LastLoginIp  { get; set; }

    // Navigation
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
}
