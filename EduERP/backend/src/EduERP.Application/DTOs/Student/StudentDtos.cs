using System.ComponentModel.DataAnnotations;
using EduERP.Application.DTOs.Common;

namespace EduERP.Application.DTOs.Student;

// ── Request DTOs ───────────────────────────────────────────────────────────

public class StudentListRequestDto : PagedRequestDto
{
    public int?    ClassId        { get; init; }
    public int?    SectionId      { get; init; }
    public int?    AcademicYearId { get; init; }
    public string? Status         { get; init; }  // Active | Inactive | Graduated
}

public class StudentCreateDto
{
    [Required, MaxLength(100)]
    public string FirstName { get; init; } = string.Empty;

    [Required, MaxLength(100)]
    public string LastName { get; init; } = string.Empty;

    [Required]
    public DateOnly DateOfBirth { get; init; }

    [Required, MaxLength(10)]
    public string Gender { get; init; } = string.Empty;

    [EmailAddress, MaxLength(256)]
    public string? Email { get; init; }

    [MaxLength(20)]
    public string? Phone { get; init; }

    [MaxLength(500)]
    public string? Address { get; init; }

    [MaxLength(5)]
    public string? BloodGroup { get; init; }

    [Required]
    public int ClassId { get; init; }

    [Required]
    public int SectionId { get; init; }

    [Required]
    public int AcademicYearId { get; init; }

    [Required]
    public DateOnly AdmissionDate { get; init; }

    [MaxLength(200)]
    public string? EmergencyContactName { get; init; }

    [MaxLength(20)]
    public string? EmergencyContactPhone { get; init; }
}

public class StudentUpdateDto
{
    [MaxLength(100)]
    public string? FirstName { get; init; }

    [MaxLength(100)]
    public string? LastName { get; init; }

    [EmailAddress, MaxLength(256)]
    public string? Email { get; init; }

    [MaxLength(20)]
    public string? Phone { get; init; }

    [MaxLength(500)]
    public string? Address { get; init; }

    public int?    ClassId    { get; init; }
    public int?    SectionId  { get; init; }
    public string? Status     { get; init; }
}

// ── Response DTOs ──────────────────────────────────────────────────────────

public class StudentResponseDto
{
    public int     StudentId        { get; init; }
    public string  EnrollmentNumber { get; init; } = string.Empty;
    public string  FullName         { get; init; } = string.Empty;
    public string  ClassName        { get; init; } = string.Empty;
    public string  Section          { get; init; } = string.Empty;
    public string  Gender           { get; init; } = string.Empty;
    public string  Status           { get; init; } = string.Empty;
    public string? Email            { get; init; }
    public string? ParentName       { get; init; }
    public string? ParentPhone      { get; init; }
    public int     TotalCount       { get; init; }  // window-function column for server-side paging
}

public class StudentDetailDto : StudentResponseDto
{
    public int       UserId                 { get; init; }
    public DateOnly  DateOfBirth            { get; init; }
    public string?   BloodGroup             { get; init; }
    public string?   Phone                  { get; init; }
    public string?   Address                { get; init; }
    public DateOnly  AdmissionDate          { get; init; }
    public int       ClassId                { get; init; }
    public int       SectionId              { get; init; }
    public int       AcademicYearId         { get; init; }
    public string?   EmergencyContactName   { get; init; }
    public string?   EmergencyContactPhone  { get; init; }
    public double    AttendancePercentage   { get; init; }
    public string    AcademicYear           { get; init; } = string.Empty;
    public DateTime  CreatedAt              { get; init; }
    public List<ParentSummaryDto> Parents   { get; set; } = [];
}

public class ParentSummaryDto
{
    public int    ParentId      { get; init; }
    public string FullName      { get; init; } = string.Empty;
    public string Relationship  { get; init; } = string.Empty;
    public string PhoneNumber   { get; init; } = string.Empty;
    public string? Email        { get; init; }
}

public class StudentCreatedDto
{
    public int    StudentId        { get; init; }
    public string EnrollmentNumber { get; init; } = string.Empty;
}
