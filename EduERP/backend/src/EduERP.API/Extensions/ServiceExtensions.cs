using System.Text;
using EduERP.Application.Interfaces;
using EduERP.Application.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Threading.RateLimiting;

namespace EduERP.API.Extensions;

public static class ServiceExtensions
{
    // ── Swagger ───────────────────────────────────────────────────────────────
    public static IServiceCollection AddSwaggerDocumentation(this IServiceCollection services)
    {
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo { Title = "EduERP API", Version = "v1" });
            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name         = "Authorization",
                Type         = SecuritySchemeType.Http,
                Scheme       = "bearer",
                BearerFormat = "JWT",
                In           = ParameterLocation.Header
            });
            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                    },
                    Array.Empty<string>()
                }
            });
        });
        return services;
    }

    // ── JWT Authentication ────────────────────────────────────────────────────
    public static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services, IConfiguration configuration)
    {
        var secretKey = configuration["Jwt:SecretKey"]
                        ?? throw new InvalidOperationException("Jwt:SecretKey is not configured.");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer           = true,
                    ValidateAudience         = true,
                    ValidateLifetime         = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer              = configuration["Jwt:Issuer"],
                    ValidAudience            = configuration["Jwt:Audience"],
                    IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
                    ClockSkew                = TimeSpan.Zero
                };

                // Read token from HttpOnly cookie
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = ctx =>
                    {
                        ctx.Token = ctx.Request.Cookies["access_token"];
                        return Task.CompletedTask;
                    }
                };
            });

        services.AddAuthorization();
        return services;
    }

    // ── CORS ──────────────────────────────────────────────────────────────────
    public static IServiceCollection AddCorsPolicy(
        this IServiceCollection services, IConfiguration configuration)
    {
        var origins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                      ?? ["http://localhost:3000", "http://localhost:5173"];

        services.AddCors(options =>
        {
            options.AddPolicy("EduERPPolicy", policy =>
                policy.WithOrigins(origins)
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials());
        });
        return services;
    }

    // ── Rate Limiting ─────────────────────────────────────────────────────────
    public static IServiceCollection AddRateLimiting(
        this IServiceCollection services, IConfiguration configuration)
    {
        services.AddRateLimiter(options =>
        {
            options.AddFixedWindowLimiter("auth-login", limiterOptions =>
            {
                limiterOptions.Window            = TimeSpan.FromSeconds(
                    configuration.GetValue("RateLimit:LoginWindowSeconds", 60));
                limiterOptions.PermitLimit       = configuration.GetValue("RateLimit:LoginMaxAttempts", 10);
                limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                limiterOptions.QueueLimit        = 2;
            });

            options.AddFixedWindowLimiter("auth-otp-send", limiterOptions =>
            {
                limiterOptions.Window      = TimeSpan.FromMinutes(1);
                limiterOptions.PermitLimit = 5;
                limiterOptions.QueueLimit  = 0;
            });

            options.AddFixedWindowLimiter("auth-otp-verify", limiterOptions =>
            {
                limiterOptions.Window      = TimeSpan.FromMinutes(5);
                limiterOptions.PermitLimit = 10;
                limiterOptions.QueueLimit  = 0;
            });

            options.AddFixedWindowLimiter("global", limiterOptions =>
            {
                limiterOptions.Window      = TimeSpan.FromSeconds(1);
                limiterOptions.PermitLimit = 100;
            });

            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        });
        return services;
    }

    // ── Application Services ──────────────────────────────────────────────────
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IStudentService, StudentService>();
        services.AddScoped<IAdmissionService, AdmissionService>();
        services.AddScoped<IExaminationService, ExaminationService>();
        return services;
    }
}
