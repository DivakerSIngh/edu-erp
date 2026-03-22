using System.ComponentModel.DataAnnotations;
using EduERP.Application.DTOs.Common;

namespace EduERP.Application.DTOs.Admission;

// ── Request DTOs ──────────────────────────────────────────────────────────────

public class AdmissionListRequestDto : PagedRequestDto
{
    public int?    AcademicYearId { get; init; }
    public int?    ClassId        { get; init; }
    public string? Status         { get; init; }
}

public class AdmissionSubmitDto
{
    [Required, MaxLength(200)]
    public string ApplicantName    { get; init; } = string.Empty;

    [Required]
    public DateTime DateOfBirth    { get; init; }

    [Required, MaxLength(10)]
    public string Gender           { get; init; } = string.Empty;

    [Required, MaxLength(100)]
    public string ApplyingForClass { get; init; } = string.Empty;

    [Required]
    public int AcademicYearId      { get; init; }

    public int? ClassId            { get; init; }

    [Required, MaxLength(200)]
    public string ParentName       { get; init; } = string.Empty;

    [Required, EmailAddress, MaxLength(256)]
    public string ParentEmail      { get; init; } = string.Empty;

    [Required, MaxLength(20)]
    public string ParentPhone      { get; init; } = string.Empty;

    [MaxLength(300)]
    public string? PreviousSchool  { get; init; }
}

public class AdmissionUpdateStatusDto
{
    [Required]
    public string Status   { get; init; } = string.Empty;

    [MaxLength(1000)]
    public string? Remarks { get; init; }
}

public class AdmissionConvertDto
{
    [Required]
    public int    ClassId      { get; init; }

    [Required]
    public int    SectionId    { get; init; }

    [Required, MinLength(8), MaxLength(512)]
    public string TempPassword { get; init; } = string.Empty;
}

// ── Response DTOs ─────────────────────────────────────────────────────────────

public class AdmissionListItemDto
{
    public int      ApplicationId    { get; init; }
    public string   ReferenceNumber  { get; init; } = string.Empty;
    public string   ApplicantName    { get; init; } = string.Empty;
    public string   ParentEmail      { get; init; } = string.Empty;
    public string   ParentPhone      { get; init; } = string.Empty;
    public DateTime DateOfBirth      { get; init; }
    public string   Gender           { get; init; } = string.Empty;
    public string   ApplyingForClass { get; init; } = string.Empty;
    public int?     ClassId          { get; init; }
    public string?  ClassName        { get; init; }
    public int      AcademicYearId   { get; init; }
    public string   AcademicYear     { get; init; } = string.Empty;
    public string   Status           { get; init; } = string.Empty;
    public DateTime AppliedAt        { get; init; }
    public DateTime? ReviewedAt      { get; init; }
    public int      TotalCount       { get; init; }
}

public class AdmissionDetailDto : AdmissionListItemDto
{
    public string?  PreviousSchool  { get; init; }
    public string   ParentName      { get; init; } = string.Empty;
    public string?  Remarks         { get; init; }
    public int?     ReviewedBy      { get; init; }
    public DateTime? ConvertedAt    { get; init; }
    public int?     ConvertedStudentId { get; init; }
}

public class AdmissionCreatedDto
{
    public int    ApplicationId   { get; init; }
    public string ReferenceNumber { get; init; } = string.Empty;
}

public class AcademicYearDto
{
    public int    AcademicYearId { get; init; }
    public string YearName       { get; init; } = string.Empty;
    public bool   IsCurrent      { get; init; }
}

public class ClassDto
{
    public int    ClassId    { get; init; }
    public string ClassName  { get; init; } = string.Empty;
    public int    GradeLevel { get; init; }
}

public class SectionDto
{
    public int    SectionId   { get; init; }
    public string SectionName { get; init; } = string.Empty;
    public int    Capacity    { get; init; }
}
