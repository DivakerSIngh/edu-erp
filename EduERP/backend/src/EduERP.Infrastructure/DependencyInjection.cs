using Dapper;
using EduERP.Application.Interfaces;
using EduERP.Infrastructure.Caching;
using EduERP.Infrastructure.Data;
using EduERP.Infrastructure.Data.Repositories;
using EduERP.Infrastructure.Messaging;
using EduERP.Infrastructure.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;
using System.Data;

namespace EduERP.Infrastructure;

// ── Dapper type handler: SQL date → C# DateOnly ───────────────────────────────
file sealed class DateOnlyTypeHandler : SqlMapper.TypeHandler<DateOnly>
{
    public override DateOnly Parse(object value) =>
        DateOnly.FromDateTime((DateTime)value);

    public override void SetValue(IDbDataParameter parameter, DateOnly value)
    {
        parameter.DbType = DbType.Date;
        parameter.Value  = value.ToDateTime(TimeOnly.MinValue);
    }
}

/// <summary>
/// Registers all Infrastructure services into the DI container.
/// Called from Program.cs:  builder.Services.AddInfrastructure(builder.Configuration)
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ── Dapper global type handlers ───────────────────────────────────────
        SqlMapper.AddTypeHandler(new DateOnlyTypeHandler());

        // ── Database ──────────────────────────────────────────────────────────
        services.AddSingleton<IDbConnectionFactory>(
            _ => new DbConnectionFactory(
                primary:  configuration.GetConnectionString("DefaultConnection")!,
                replica:  configuration.GetConnectionString("ReadReplicaConnection")));

        // ── Repositories ──────────────────────────────────────────────────────
        services.AddScoped<IAuthRepository, AuthRepository>();
        services.AddScoped<IStudentRepository, StudentRepository>();
        services.AddScoped<IAdmissionRepository, AdmissionRepository>();
        services.AddScoped<IExaminationRepository, ExaminationRepository>();

        // ── Redis ─────────────────────────────────────────────────────────────
        services.AddSingleton<IConnectionMultiplexer>(
            _ => ConnectionMultiplexer.Connect(
                configuration.GetConnectionString("Redis")!));

        services.AddSingleton<IRedisCacheService, RedisCacheService>();

        // ── Security services ─────────────────────────────────────────────────
        services.Configure<JwtOptions>(configuration.GetSection("Jwt"));
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddScoped<ICookieService, CookieService>();

        // OtpService uses IDistributedCache — register Redis as distributed cache
        services.AddStackExchangeRedisCache(opts =>
            opts.Configuration = configuration.GetConnectionString("Redis"));
        services.AddScoped<IOtpService, OtpService>();

        // ── Messaging ─────────────────────────────────────────────────────────
        services.AddScoped<IEmailService, EmailService>();

        // ── Database Seeder ───────────────────────────────────────────────────
        services.AddTransient<DatabaseSeeder>();

        return services;
    }
}
