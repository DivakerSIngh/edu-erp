using System.ComponentModel.DataAnnotations;
using EduERP.Application.DTOs.Common;

namespace EduERP.Application.DTOs.Examination;

// ── Request DTOs ───────────────────────────────────────────────────────────

public class ExaminationListRequestDto : PagedRequestDto
{
    public int?    AcademicYearId { get; init; }
    public int?    ClassId        { get; init; }
    public string? ExamType       { get; init; }   // Unit | MidTerm | Final | Remedial
}

public class ExaminationCreateDto
{
    [Required, MaxLength(200)]
    public string   ExamName       { get; init; } = string.Empty;

    [Required, MaxLength(20)]
    public string   ExamType       { get; init; } = string.Empty;

    [Required]
    public int      ClassId        { get; init; }

    [Required]
    public int      AcademicYearId { get; init; }

    [Required]
    public DateOnly StartDate      { get; init; }

    [Required]
    public DateOnly EndDate        { get; init; }

    [Range(1, 9999.99)]
    public decimal  MaxMarks       { get; init; } = 100;

    [Range(1, 9999.99)]
    public decimal  PassMarks      { get; init; } = 40;
}

public class ExaminationUpdateDto
{
    [MaxLength(200)]
    public string?   ExamName   { get; init; }

    [MaxLength(20)]
    public string?   ExamType   { get; init; }

    public DateOnly? StartDate  { get; init; }
    public DateOnly? EndDate    { get; init; }

    [Range(1, 9999.99)]
    public decimal?  MaxMarks   { get; init; }

    [Range(1, 9999.99)]
    public decimal?  PassMarks  { get; init; }
}

public class PublishExamDto
{
    [Required]
    public bool Publish { get; init; }
}

public class BulkResultEntryDto
{
    [Required]
    public IList<ResultRowDto> Results { get; init; } = [];
}

public class ResultRowDto
{
    [Required]
    public int     StudentId     { get; init; }

    [Required]
    public int     SubjectId     { get; init; }

    [Required, Range(0, 9999.99)]
    public decimal MarksObtained { get; init; }

    [Required, Range(1, 9999.99)]
    public decimal MaxMarks      { get; init; } = 100;

    [MaxLength(500)]
    public string? Remarks       { get; init; }
}

// ── Response DTOs ──────────────────────────────────────────────────────────

public class ExaminationListItemDto
{
    public int      ExaminationId  { get; init; }
    public string   ExamName       { get; init; } = string.Empty;
    public string   ExamType       { get; init; } = string.Empty;
    public DateOnly StartDate      { get; init; }
    public DateOnly EndDate        { get; init; }
    public decimal  MaxMarks       { get; init; }
    public decimal  PassMarks      { get; init; }
    public bool     IsPublished    { get; init; }
    public string   ClassName      { get; init; } = string.Empty;
    public string   AcademicYear   { get; init; } = string.Empty;
    public int      TotalCount     { get; init; }   // window-function column for paging
}

public class ExaminationDetailDto : ExaminationListItemDto
{
    public int      ClassId        { get; init; }
    public int      AcademicYearId { get; init; }
    public DateTime CreatedAt      { get; init; }
}

public class ExaminationCreatedDto
{
    public int ExaminationId { get; init; }
}

public class ExamResultItemDto
{
    public int     ResultId         { get; init; }
    public int     StudentId        { get; init; }
    public string  StudentName      { get; init; } = string.Empty;
    public string  EnrollmentNumber { get; init; } = string.Empty;
    public int     SubjectId        { get; init; }
    public string  SubjectName      { get; init; } = string.Empty;
    public string  SubjectCode      { get; init; } = string.Empty;
    public decimal MarksObtained    { get; init; }
    public decimal MaxMarks         { get; init; }
    public string? Grade            { get; init; }
    public string? Remarks          { get; init; }
    public string  Result           { get; init; } = string.Empty;
}

public class ReportCardSubjectDto
{
    public string  ExamName      { get; init; } = string.Empty;
    public string  ExamType      { get; init; } = string.Empty;
    public string  SubjectName   { get; init; } = string.Empty;
    public decimal MarksObtained { get; init; }
    public decimal MaxMarks      { get; init; }
    public string  Result        { get; init; } = string.Empty;
    public string? Remarks       { get; init; }
    public string? Grade         { get; init; }
}

public class ReportCardSummaryDto
{
    public decimal TotalMarks    { get; init; }
    public decimal TotalMaxMarks { get; init; }
    public decimal Percentage    { get; init; }
    public string  OverallGrade  { get; init; } = string.Empty;
}

public class ReportCardDto
{
    public List<ReportCardSubjectDto> Subjects { get; init; } = [];
    public ReportCardSummaryDto?      Summary  { get; init; }
}

public class SubjectDto
{
    public int    SubjectId   { get; init; }
    public string SubjectCode { get; init; } = string.Empty;
    public string SubjectName { get; init; } = string.Empty;
    public bool   IsElective  { get; init; }
}

public class ClassStudentDto
{
    public int    StudentId        { get; init; }
    public string StudentName      { get; init; } = string.Empty;
    public string EnrollmentNumber { get; init; } = string.Empty;
    public string Section          { get; init; } = string.Empty;
}
