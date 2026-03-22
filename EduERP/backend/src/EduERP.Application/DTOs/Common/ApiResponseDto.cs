namespace EduERP.Application.DTOs.Common;

/// <summary>Standard API response envelope returned by all endpoints.</summary>
public class ApiResponseDto<T>
{
    public bool     IsSuccess  { get; init; }
    public T?       Data       { get; init; }
    public string   Message    { get; init; } = string.Empty;
    public object?  Errors     { get; init; }
    public PaginationMeta? Pagination { get; init; }
    public string   TraceId    { get; init; } = string.Empty;

    public static ApiResponseDto<T> Success(T? data, string message = "Success") => new()
    {
        IsSuccess = true,
        Data      = data,
        Message   = message
    };

    public static ApiResponseDto<T> Fail(string message, object? errors = null) => new()
    {
        IsSuccess = false,
        Message   = message,
        Errors    = errors
    };
}

public record PaginationMeta(int Page, int PageSize, int TotalCount, int TotalPages);
