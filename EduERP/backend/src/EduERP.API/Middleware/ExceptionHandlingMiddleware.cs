using EduERP.Application.DTOs.Common;
using EduERP.Domain.Exceptions;
using System.Net;
using System.Text.Json;

namespace EduERP.API.Middleware;

/// <summary>
/// Global exception handler — converts domain exceptions to structured JSON responses.
/// Prevents stack traces leaking to clients in production.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IHostEnvironment env)
    {
        _next   = next;
        _logger = logger;
        _env    = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var traceId    = context.TraceIdentifier;
        var statusCode = HttpStatusCode.InternalServerError;
        var message    = "An unexpected error occurred.";
        object? errors = null;

        switch (exception)
        {
            case ValidationException ve:
                statusCode = HttpStatusCode.BadRequest;
                message    = "Validation failed.";
                errors     = ve.Errors.Select(e => new { field = e.Key, message = e.Value });
                _logger.LogWarning("Validation error. TraceId={TraceId}", traceId);
                break;

            case NotFoundException:
                statusCode = HttpStatusCode.NotFound;
                message    = exception.Message;
                _logger.LogWarning("Not found: {Message}. TraceId={TraceId}", exception.Message, traceId);
                break;

            case UnauthorizedException:
                statusCode = HttpStatusCode.Unauthorized;
                message    = exception.Message;
                _logger.LogWarning("Unauthorized: {Message}. TraceId={TraceId}", exception.Message, traceId);
                break;

            case ForbiddenException:
                statusCode = HttpStatusCode.Forbidden;
                message    = exception.Message;
                break;

            case ConflictException:
                statusCode = HttpStatusCode.Conflict;
                message    = exception.Message;
                break;

            default:
                // Log full stack trace for unexpected errors only
                _logger.LogError(exception,
                    "Unhandled exception. TraceId={TraceId} Path={Path}",
                    traceId,
                    context.Request.Path);

                // In development, include exception detail; in production, hide it
                if (_env.IsDevelopment())
                    message = exception.Message;
                break;
        }

        var response = new
        {
            success = false,
            data    = (object?)null,
            message,
            errors,
            traceId
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode  = (int)statusCode;

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
    }
}
