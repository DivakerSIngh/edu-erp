using Dapper;
using EduERP.Application.Interfaces;
using Microsoft.Extensions.Logging;
using System.Data;

namespace EduERP.Infrastructure.Data;

/// <summary>
/// Runs once on startup to ensure the database has at least one Admin user.
/// Safe to call repeatedly — checks existence before inserting.
/// </summary>
public class DatabaseSeeder
{
    private readonly IDbConnectionFactory _factory;
    private readonly IPasswordHasher      _hasher;
    private readonly ILogger<DatabaseSeeder> _logger;

    public DatabaseSeeder(
        IDbConnectionFactory factory,
        IPasswordHasher hasher,
        ILogger<DatabaseSeeder> logger)
    {
        _factory = factory;
        _hasher  = hasher;
        _logger  = logger;
    }

    public async Task SeedAsync()
    {
        try
        {
            using var conn = _factory.CreateConnection();

            var adminExists = await conn.ExecuteScalarAsync<int>(
                "SELECT COUNT(1) FROM Users WHERE Role = 'Admin' AND IsDeleted = 0",
                commandType: CommandType.Text);

            if (adminExists > 0)
            {
                _logger.LogInformation("Seed: Admin user already exists — skipping.");
                return;
            }

            // Seed default admin — change credentials after first login in production
            var passwordHash = _hasher.Hash("Admin@1234");

            await conn.ExecuteAsync(@"
                INSERT INTO Users (FullName, Email, PasswordHash, Role, IsActive, CreatedAt, CreatedBy, IsDeleted)
                VALUES (@FullName, @Email, @PasswordHash, 'Admin', 1, GETUTCDATE(), 1, 0)",
                new
                {
                    FullName     = "System Administrator",
                    Email        = "admin@eduerp.local",
                    PasswordHash = passwordHash,
                },
                commandType: CommandType.Text);

            // Seed an HR / Staff user matching the demo credentials from the screenshot
            var hrHash = _hasher.Hash("Hr@12345");

            await conn.ExecuteAsync(@"
                INSERT INTO Users (FullName, Email, PasswordHash, Role, IsActive, CreatedAt, CreatedBy, IsDeleted)
                VALUES (@FullName, @Email, @PasswordHash, 'Admin', 1, GETUTCDATE(), 1, 0)",
                new
                {
                    FullName     = "HR Administrator",
                    Email        = "hr@yopmail.com",
                    PasswordHash = hrHash,
                },
                commandType: CommandType.Text);

            _logger.LogInformation(
                "Seed: Created default admin users. " +
                "admin@eduerp.local / Admin@1234  |  hr@yopmail.com / Hr@12345  " +
                "— CHANGE THESE IN PRODUCTION.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Seed: Failed to seed database.");
            // Don't crash startup — app may still be functional with existing data
        }
    }
}
