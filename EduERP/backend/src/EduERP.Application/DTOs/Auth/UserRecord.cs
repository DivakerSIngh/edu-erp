namespace EduERP.Application.DTOs.Auth;

/// <summary>User record returned from the database for authentication.</summary>
public class UserRecord
{
    public int       UserId       { get; set; }
    public string    FullName     { get; set; } = string.Empty;
    public string    Email        { get; set; } = string.Empty;
    public string    PasswordHash { get; set; } = string.Empty;
    public string    Role         { get; set; } = string.Empty;
    public string[]  Permissions  { get; set; } = [];
    public bool      IsActive     { get; set; }
    public DateTime? LastLoginAt  { get; set; }
}

/// <summary>Refresh token record returned from the database.</summary>
public class RefreshTokenRecord
{
    public int      TokenId   { get; set; }
    public int      UserId    { get; set; }
    public string   FamilyId  { get; set; } = string.Empty;
    public string   IpHash    { get; set; } = string.Empty;
    public string   UaHash    { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool     IsRevoked { get; set; }
}
