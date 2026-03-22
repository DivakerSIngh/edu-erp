-- ============================================================
-- Auth Stored Procedures
-- Naming Convention: usp_{Module}_{Action}
-- All SPs:  SET NOCOUNT ON, TRY/CATCH, parameterized inputs
-- ============================================================

USE EduERP;
GO

-- ── usp_Auth_GetUserByEmail ──────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE usp_Auth_GetUserByEmail
    @Email NVARCHAR(256)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        u.UserId,
        u.FullName,
        u.Email,
        u.PasswordHash,
        u.Role,
        u.IsActive,
        u.LastLoginAt
    FROM  Users u
    WHERE u.Email     = @Email
    AND   u.IsDeleted = 0;
END;
GO

-- ── usp_Auth_GetUserById ─────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE usp_Auth_GetUserById
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        u.UserId,
        u.FullName,
        u.Email,
        u.PasswordHash,
        u.Role,
        u.IsActive,
        u.LastLoginAt
    FROM  Users u
    WHERE u.UserId    = @UserId
    AND   u.IsDeleted = 0;
END;
GO

-- ── usp_Auth_StoreRefreshToken ───────────────────────────────────────────────
CREATE OR ALTER PROCEDURE usp_Auth_StoreRefreshToken
    @UserId    INT,
    @TokenHash NVARCHAR(128),
    @FamilyId  NVARCHAR(64),
    @IpHash    NVARCHAR(128),
    @UaHash    NVARCHAR(128),
    @ExpiresAt DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        INSERT INTO RefreshTokens
            (UserId, TokenHash, FamilyId, IpHash, UaHash, ExpiresAt, IsRevoked, CreatedAt, CreatedBy, IsDeleted)
        VALUES
            (@UserId, @TokenHash, @FamilyId, @IpHash, @UaHash, @ExpiresAt, 0, GETUTCDATE(), @UserId, 0);
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH;
END;
GO

-- ── usp_Auth_GetRefreshToken ─────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE usp_Auth_GetRefreshToken
    @TokenHash NVARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        rt.TokenId,
        rt.UserId,
        rt.FamilyId,
        rt.IpHash,
        rt.UaHash,
        rt.ExpiresAt,
        rt.IsRevoked
    FROM  RefreshTokens rt
    WHERE rt.TokenHash = @TokenHash
    AND   rt.IsDeleted = 0;
END;
GO

-- ── usp_Auth_RevokeRefreshToken ──────────────────────────────────────────────
CREATE OR ALTER PROCEDURE usp_Auth_RevokeRefreshToken
    @TokenHash NVARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE RefreshTokens
    SET    IsRevoked  = 1,
           RevokedAt  = GETUTCDATE()
    WHERE  TokenHash  = @TokenHash
    AND    IsRevoked  = 0;
END;
GO

-- ── usp_Auth_RevokeTokenFamily ───────────────────────────────────────────────
-- Called when refresh token reuse is detected (possible theft)
CREATE OR ALTER PROCEDURE usp_Auth_RevokeTokenFamily
    @FamilyId NVARCHAR(64)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE RefreshTokens
    SET    IsRevoked = 1,
           RevokedAt = GETUTCDATE()
    WHERE  FamilyId  = @FamilyId
    AND    IsRevoked = 0;
END;
GO

-- ── usp_Auth_UpdateLastLogin ─────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE usp_Auth_UpdateLastLogin
    @UserId    INT,
    @IpAddress NVARCHAR(45)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Users
    SET    LastLoginAt = GETUTCDATE(),
           LastLoginIp = @IpAddress
    WHERE  UserId      = @UserId;
END;
GO

-- ── usp_Auth_CleanupExpiredTokens ────────────────────────────────────────────
-- Run nightly by Hangfire job
CREATE OR ALTER PROCEDURE usp_Auth_CleanupExpiredTokens
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM RefreshTokens
    WHERE  ExpiresAt  < GETUTCDATE()
    OR     (IsRevoked = 1 AND RevokedAt < DATEADD(DAY, -30, GETUTCDATE()));

    SELECT @@ROWCOUNT AS DeletedCount;
END;
GO
