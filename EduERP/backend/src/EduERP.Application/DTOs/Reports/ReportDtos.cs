namespace EduERP.Application.DTOs.Reports;

// ── Student Strength ──────────────────────────────────────────────────────────
public class StudentStrengthDto
{
    public int    ClassId      { get; init; }
    public string ClassName    { get; init; } = string.Empty;
    public int    SectionId    { get; init; }
    public string SectionName  { get; init; } = string.Empty;
    public string Gender       { get; init; } = string.Empty;
    public int    StudentCount { get; init; }
}

// ── Low Attendance ────────────────────────────────────────────────────────────
public class LowAttendanceStudentDto
{
    public int     StudentId         { get; init; }
    public string  EnrollmentNumber  { get; init; } = string.Empty;
    public string  StudentName       { get; init; } = string.Empty;
    public string  ClassName         { get; init; } = string.Empty;
    public string  SectionName       { get; init; } = string.Empty;
    public int     PresentDays       { get; init; }
    public int     LateDays          { get; init; }
    public int     TotalDays         { get; init; }
    public decimal AttendancePct     { get; init; }
}

// ── Individual Report Card ────────────────────────────────────────────────────
public class ReportCardHeaderDto
{
    public int    StudentId        { get; init; }
    public string EnrollmentNumber { get; init; } = string.Empty;
    public string StudentName      { get; init; } = string.Empty;
    public string ClassName        { get; init; } = string.Empty;
    public string SectionName      { get; init; } = string.Empty;
    public string AcademicYear     { get; init; } = string.Empty;
}

public class ReportCardResultRowDto
{
    public int      ExaminationId { get; init; }
    public string   ExamName      { get; init; } = string.Empty;
    public string   ExamType      { get; init; } = string.Empty;
    public DateOnly StartDate     { get; init; }
    public string   SubjectName   { get; init; } = string.Empty;
    public string   SubjectCode   { get; init; } = string.Empty;
    public decimal  MarksObtained { get; init; }
    public decimal  MaxMarks      { get; init; }
    public decimal  PassMarks     { get; init; }
    public string   Grade         { get; init; } = string.Empty;
    public string   Result        { get; init; } = string.Empty;  // Pass | Fail
}

public class IndividualReportCardDto
{
    public ReportCardHeaderDto       Header  { get; init; } = new();
    public IList<ReportCardResultRowDto> Results { get; init; } = [];
}

// ── Subject Performance ───────────────────────────────────────────────────────
public class SubjectPerformanceDto
{
    public int     SubjectId    { get; init; }
    public string  SubjectName  { get; init; } = string.Empty;
    public string  SubjectCode  { get; init; } = string.Empty;
    public string  ClassName    { get; init; } = string.Empty;
    public int     TotalStudents { get; init; }
    public decimal AvgMarks     { get; init; }
    public decimal MaxMarks     { get; init; }
    public decimal AvgPct       { get; init; }
    public int     PassCount    { get; init; }
    public int     FailCount    { get; init; }
    public decimal PassRate     { get; init; }
}

// ── Payment History ───────────────────────────────────────────────────────────
public class PaymentHistoryDto
{
    public int      PaymentId         { get; init; }
    public string   ReceiptNumber     { get; init; } = string.Empty;
    public DateOnly PaymentDate       { get; init; }
    public decimal  AmountPaid        { get; init; }
    public string   PaymentMethod     { get; init; } = string.Empty;
    public string   InvoiceNumber     { get; init; } = string.Empty;
    public string   FeeName           { get; init; } = string.Empty;
    public int      StudentId         { get; init; }
    public string   EnrollmentNumber  { get; init; } = string.Empty;
    public string   StudentName       { get; init; } = string.Empty;
    public string   ClassName         { get; init; } = string.Empty;
    public string   SectionName       { get; init; } = string.Empty;
    public string   AcademicYear      { get; init; } = string.Empty;
}

// ── Admission Statistics ──────────────────────────────────────────────────────
public class AdmissionStatDto
{
    public int    AcademicYearId    { get; init; }
    public string YearName          { get; init; } = string.Empty;
    public string Status            { get; init; } = string.Empty;
    public int    ApplicationCount  { get; init; }
    public int    ConvertedCount    { get; init; }
}

// ── Student Directory ─────────────────────────────────────────────────────────
public class StudentDirectoryDto
{
    public int      StudentId        { get; init; }
    public string   EnrollmentNumber { get; init; } = string.Empty;
    public string   StudentName      { get; init; } = string.Empty;
    public string   Gender           { get; init; } = string.Empty;
    public DateOnly DateOfBirth      { get; init; }
    public string   Email            { get; init; } = string.Empty;
    public string   Phone            { get; init; } = string.Empty;
    public string   Status           { get; init; } = string.Empty;
    public string   ClassName        { get; init; } = string.Empty;
    public string   SectionName      { get; init; } = string.Empty;
    public string   AcademicYear     { get; init; } = string.Empty;
    public DateOnly AdmissionDate    { get; init; }
}

// ── Request DTOs ──────────────────────────────────────────────────────────────
public class LowAttendanceRequestDto
{
    public int     ClassId      { get; init; }
    public int     Month        { get; init; }
    public int     Year         { get; init; }
    public decimal ThresholdPct { get; init; } = 75m;
}

public class SubjectPerformanceRequestDto
{
    public int  AcademicYearId { get; init; }
    public int? SubjectId      { get; init; }
    public int? ClassId        { get; init; }
}

public class PaymentHistoryRequestDto
{
    public DateOnly FromDate { get; init; }
    public DateOnly ToDate   { get; init; }
    public int?     ClassId  { get; init; }
}

public class StudentDirectoryRequestDto
{
    public int?    AcademicYearId { get; init; }
    public int?    ClassId        { get; init; }
    public int?    SectionId      { get; init; }
    public string? Gender         { get; init; }
    public string? Status         { get; init; }
}
