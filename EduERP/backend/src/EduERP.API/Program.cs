using EduERP.API.Extensions;
using EduERP.API.Filters;
using EduERP.API.Middleware;
using EduERP.Infrastructure;
using Hangfire;
using Hangfire.Redis.StackExchange;
using Serilog;

// ── Bootstrap Serilog before anything else ───────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // ── Serilog ──────────────────────────────────────────────────────────────
    builder.Host.UseSerilog((ctx, services, config) =>
        config.ReadFrom.Configuration(ctx.Configuration)
              .ReadFrom.Services(services)
              .Enrich.FromLogContext()
              .Enrich.WithProperty("Application", "EduERP"));

    // ── Core Services ────────────────────────────────────────────────────────
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();

    // ── Custom Extension Registrations ──────────────────────────────────────
    builder.Services.AddSwaggerDocumentation();
    builder.Services.AddJwtAuthentication(builder.Configuration);
    builder.Services.AddCorsPolicy(builder.Configuration);
    builder.Services.AddRateLimiting(builder.Configuration);

    // ── Application + Infrastructure DI ─────────────────────────────────────
    builder.Services.AddInfrastructure(builder.Configuration);
    builder.Services.AddApplicationServices();

    // ── Response Compression ─────────────────────────────────────────────────
    builder.Services.AddResponseCompression(options =>
    {
        options.EnableForHttps = true;
    });

    // ── Health Checks ─────────────────────────────────────────────────────────
    builder.Services.AddHealthChecks()
        .AddSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")!)
        .AddRedis(builder.Configuration.GetConnectionString("Redis")!);

    // ── Hangfire ─────────────────────────────────────────────────────────────
    builder.Services.AddHangfire(config =>
        config.UseRedisStorage(builder.Configuration.GetConnectionString("Redis")));
    builder.Services.AddHangfireServer(options => options.WorkerCount = 4);

    // ── Build App ─────────────────────────────────────────────────────────────
    var app = builder.Build();

    // ── Middleware Pipeline (ORDER MATTERS) ──────────────────────────────────
    app.UseResponseCompression();

    // Exception handling must be first to catch all errors
    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseMiddleware<RequestLoggingMiddleware>();
    app.UseMiddleware<SecurityHeadersMiddleware>();

    if (app.Environment.IsDevelopment() || app.Environment.IsStaging())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "EduERP API v1");
            c.RoutePrefix = "swagger";
        });
    }

    app.UseHttpsRedirection();
    app.UseCors("EduERPPolicy");
    app.UseRateLimiter();

    app.UseAuthentication();
    app.UseAuthorization();

    app.UseSerilogRequestLogging();

    app.MapControllers();
    app.MapHealthChecks("/health/live",  new() { Predicate = _ => false });
    app.MapHealthChecks("/health/ready");

    // ── Seed database with default admin user (dev / first-run) ─────────────
    using (var scope = app.Services.CreateScope())
    {
        var seeder = scope.ServiceProvider.GetRequiredService<EduERP.Infrastructure.Data.DatabaseSeeder>();
        await seeder.SeedAsync();
    }

    // Hangfire dashboard — guarded by Admin policy
    app.UseHangfireDashboard("/jobs", new DashboardOptions
    {
        Authorization = [new HangfireAdminAuthFilter()]
    });

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application failed to start.");
    return 1;
}
finally
{
    Log.CloseAndFlush();
}

return 0;
