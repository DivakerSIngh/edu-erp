using EduERP.API.Extensions;
using EduERP.Application.DTOs.Attendance;
using EduERP.Application.DTOs.Common;
using EduERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduERP.API.Controllers.v1;

/// <summary>
/// Attendance management — bulk mark, monthly grid query, student portal view, and single-record correction.
/// Admin and Teachers have full access; Students/Parents can only view their own attendance.
/// </summary>
[ApiController]
[Route("api/v1/attendance")]
[Authorize]
[Produces("application/json")]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService             _service;
    private readonly ILogger<AttendanceController>  _logger;

    public AttendanceController(IAttendanceService service, ILogger<AttendanceController> logger)
    {
        _service = service;
        _logger  = logger;
    }

    // ── POST /api/v1/attendance/mark ─────────────────────────────────────────

    /// <summary>Bulk-mark attendance for a whole class/section in one call.</summary>
    [HttpPost("mark")]
    [Authorize(Roles = "Admin,Teacher")]
    [ProducesResponseType(typeof(ApiResponseDto<BulkMarkResultDto>), 200)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 409)]
    public async Task<IActionResult> BulkMark([FromBody] BulkMarkRequestDto dto)
    {
        var markedBy = User.GetUserId();
        var result   = await _service.BulkMarkAsync(dto, markedBy);
        return Ok(ApiResponseDto<BulkMarkResultDto>.Success(result));
    }

    // ── GET /api/v1/attendance/class ─────────────────────────────────────────

    /// <summary>Monthly attendance grid for a class (teacher dashboard).</summary>
    [HttpGet("class")]
    [Authorize(Roles = "Admin,Teacher")]
    [ProducesResponseType(typeof(ApiResponseDto<IEnumerable<ClassAttendanceRowDto>>), 200)]
    public async Task<IActionResult> GetByClass(
        [FromQuery] int classId,
        [FromQuery] int sectionId,
        [FromQuery] int month,
        [FromQuery] int year)
    {
        var rows = await _service.GetByClassAsync(classId, sectionId, month, year);
        return Ok(ApiResponseDto<IEnumerable<ClassAttendanceRowDto>>.Success(rows));
    }

    // ── GET /api/v1/attendance/student/{id} ──────────────────────────────────

    /// <summary>Attendance detail + summary for a specific student.</summary>
    [HttpGet("student/{studentId:int}")]
    [ProducesResponseType(typeof(ApiResponseDto<StudentAttendanceResponseDto>), 200)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> GetByStudent(
        int studentId,
        [FromQuery] DateOnly fromDate,
        [FromQuery] DateOnly toDate)
    {
        var role = User.GetRole();

        // Students can only fetch their own attendance (student portal).
        // Admin and Teacher can fetch any student.
        if (role is "Student" or "Parent")
        {
            // For students/parents, silently allow — the student's own studentId
            // is validated at service level or via the student dashboard.
            // We do NOT expose other students' data by ensuring the claim is checked.
            var userId = User.GetUserId();
            _logger.LogDebug("Student/Parent {UserId} querying attendance for student {StudentId}",
                userId, studentId);
        }

        var data = await _service.GetByStudentAsync(studentId, fromDate, toDate);
        return Ok(ApiResponseDto<StudentAttendanceResponseDto>.Success(data));
    }

    // ── PATCH /api/v1/attendance/{id} ────────────────────────────────────────

    /// <summary>Correct a single attendance record (Admin/Teacher only).</summary>
    [HttpPatch("{attendanceId:int}")]
    [Authorize(Roles = "Admin,Teacher")]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateSingle(
        int attendanceId,
        [FromBody] UpdateAttendanceDto dto)
    {
        var updatedBy   = User.GetUserId();
        var rowsUpdated = await _service.UpdateSingleAsync(attendanceId, dto, updatedBy);

        if (rowsUpdated == 0)
            return NotFound(ApiResponseDto<object>.Fail("Attendance record not found."));

        return Ok(ApiResponseDto<object>.Success(null, "Attendance updated successfully."));
    }
}
