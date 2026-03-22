namespace EduERP.Application.DTOs.Common;

/// <summary>Paginated list response wrapper.</summary>
public class PagedResponseDto<T>
{
    public IEnumerable<T> Items      { get; init; } = [];
    public int            Page       { get; init; }
    public int            PageSize   { get; init; }
    public int            TotalCount { get; init; }
    public int            TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}

/// <summary>Base query parameters for all paginated list endpoints.</summary>
public class PagedRequestDto
{
    /// <summary>1-based page number.</summary>
    public int    Page     { get; init; } = 1;

    /// <summary>Max 100 items per page.</summary>
    public int    PageSize { get; init; } = 20;

    public string? Search  { get; init; }

    // Resolved values used by stored procedures
    public int Offset => (Page - 1) * PageSize;
    public int Limit  => Math.Min(PageSize, 100);
}
