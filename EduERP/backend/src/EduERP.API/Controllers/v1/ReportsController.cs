using EduERP.Application.DTOs.Common;
using EduERP.Application.DTOs.Reports;
using EduERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduERP.API.Controllers.v1;

/// <summary>
/// Cross-module reporting endpoints. Admin + Teacher access unless noted.
/// All endpoints are read-only; no data mutations occur here.
/// </summary>
[ApiController]
[Route("api/v1/reports")]
[Authorize(Roles = "Admin,Teacher")]
[Produces("application/json")]
public class ReportsController : ControllerBase
{
    private readonly IReportService          _service;
    private readonly ILogger<ReportsController> _logger;

    public ReportsController(IReportService service, ILogger<ReportsController> logger)
    {
        _service = service;
        _logger  = logger;
    }

    // ── Students ─────────────────────────────────────────────────────────────

    /// <summary>Student strength (count) grouped by class, section, gender.</summary>
    [HttpGet("students/strength")]
    [ProducesResponseType(typeof(ApiResponseDto<IEnumerable<StudentStrengthDto>>), 200)]
    public async Task<IActionResult> GetStudentStrength([FromQuery] int? academicYearId)
    {
        var data = await _service.GetStudentStrengthAsync(academicYearId);
        return Ok(ApiResponseDto<IEnumerable<StudentStrengthDto>>.Success(data));
    }

    /// <summary>Printable student directory with filters.</summary>
    [HttpGet("students/directory")]
    [ProducesResponseType(typeof(ApiResponseDto<IEnumerable<StudentDirectoryDto>>), 200)]
    public async Task<IActionResult> GetStudentDirectory([FromQuery] StudentDirectoryRequestDto request)
    {
        var data = await _service.GetStudentDirectoryAsync(request);
        return Ok(ApiResponseDto<IEnumerable<StudentDirectoryDto>>.Success(data));
    }

    // ── Attendance ────────────────────────────────────────────────────────────

    /// <summary>Students with attendance percentage below the given threshold for a class/month.</summary>
    [HttpGet("attendance/low")]
    [ProducesResponseType(typeof(ApiResponseDto<IEnumerable<LowAttendanceStudentDto>>), 200)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 400)]
    public async Task<IActionResult> GetLowAttendance([FromQuery] LowAttendanceRequestDto request)
    {
        if (request.ClassId <= 0 || request.Month is < 1 or > 12 || request.Year < 2000)
            return BadRequest(ApiResponseDto<object>.Fail("Invalid filter parameters."));

        var data = await _service.GetLowAttendanceAsync(request);
        return Ok(ApiResponseDto<IEnumerable<LowAttendanceStudentDto>>.Success(data));
    }

    // ── Examination ───────────────────────────────────────────────────────────

    /// <summary>Full report card for a single student across all exams in an academic year.</summary>
    [HttpGet("academic/reportcard/{studentId:int}")]
    [ProducesResponseType(typeof(ApiResponseDto<IndividualReportCardDto>), 200)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 404)]
    public async Task<IActionResult> GetReportCard(int studentId, [FromQuery] int academicYearId)
    {
        var data = await _service.GetIndividualReportCardAsync(studentId, academicYearId);
        if (data is null)
            return NotFound(ApiResponseDto<object>.Fail("Student not found."));
        return Ok(ApiResponseDto<IndividualReportCardDto>.Success(data));
    }

    /// <summary>Subject-wise average marks and pass rates across classes.</summary>
    [HttpGet("academic/subjects")]
    [ProducesResponseType(typeof(ApiResponseDto<IEnumerable<SubjectPerformanceDto>>), 200)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 400)]
    public async Task<IActionResult> GetSubjectPerformance(
        [FromQuery] SubjectPerformanceRequestDto request)
    {
        if (request.AcademicYearId <= 0)
            return BadRequest(ApiResponseDto<object>.Fail("academicYearId is required."));

        var data = await _service.GetSubjectPerformanceAsync(request);
        return Ok(ApiResponseDto<IEnumerable<SubjectPerformanceDto>>.Success(data));
    }

    // ── Fees ──────────────────────────────────────────────────────────────────

    /// <summary>Detailed fee payment history for a date range, optionally filtered by class.</summary>
    [HttpGet("fees/payments")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<IEnumerable<PaymentHistoryDto>>), 200)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 400)]
    public async Task<IActionResult> GetPaymentHistory(
        [FromQuery] PaymentHistoryRequestDto request)
    {
        if (request.FromDate == default || request.ToDate == default)
            return BadRequest(ApiResponseDto<object>.Fail("fromDate and toDate are required."));

        if (request.ToDate < request.FromDate)
            return BadRequest(ApiResponseDto<object>.Fail("toDate must be >= fromDate."));

        var data = await _service.GetPaymentHistoryAsync(request);
        return Ok(ApiResponseDto<IEnumerable<PaymentHistoryDto>>.Success(data));
    }

    // ── Admission ─────────────────────────────────────────────────────────────

    /// <summary>Admission application count by status, optionally filtered by academic year.</summary>
    [HttpGet("admission")]
    [ProducesResponseType(typeof(ApiResponseDto<IEnumerable<AdmissionStatDto>>), 200)]
    public async Task<IActionResult> GetAdmissionStats([FromQuery] int? academicYearId)
    {
        var data = await _service.GetAdmissionStatsAsync(academicYearId);
        return Ok(ApiResponseDto<IEnumerable<AdmissionStatDto>>.Success(data));
    }
}
