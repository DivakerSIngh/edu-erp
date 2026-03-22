using EduERP.Application.DTOs.Admission;
using EduERP.Application.DTOs.Common;
using EduERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EduERP.API.Controllers.v1;

/// <summary>
/// Manage admission applications.
/// Public submission (POST /) is unauthenticated.
/// All review/convert operations require the Admin role.
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class AdmissionController : ControllerBase
{
    private readonly IAdmissionService _service;
    private readonly ILogger<AdmissionController> _logger;

    public AdmissionController(IAdmissionService service, ILogger<AdmissionController> logger)
    {
        _service = service;
        _logger  = logger;
    }

    // ── Lookup ───────────────────────────────────────────────────────────────

    /// <summary>Get active academic years (used to populate the application form).</summary>
    [HttpGet("academic-years")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponseDto<IEnumerable<AcademicYearDto>>), 200)]
    public async Task<IActionResult> GetAcademicYears()
    {
        var data = await _service.GetAcademicYearsAsync();
        return Ok(ApiResponseDto<IEnumerable<AcademicYearDto>>.Success(data));
    }

    /// <summary>Get classes for a given academic year (used in the convert-to-student form).</summary>
    [HttpGet("classes")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<IEnumerable<ClassDto>>), 200)]
    public async Task<IActionResult> GetClasses([FromQuery] int academicYearId)
    {
        var data = await _service.GetClassesAsync(academicYearId);
        return Ok(ApiResponseDto<IEnumerable<ClassDto>>.Success(data));
    }

    /// <summary>Get sections for a given class (used in the convert-to-student form).</summary>
    [HttpGet("classes/{classId:int}/sections")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<IEnumerable<SectionDto>>), 200)]
    public async Task<IActionResult> GetSections(int classId)
    {
        var data = await _service.GetSectionsAsync(classId);
        return Ok(ApiResponseDto<IEnumerable<SectionDto>>.Success(data));
    }

    // ── List ─────────────────────────────────────────────────────────────────

    /// <summary>Paginated list of admission applications.</summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<PagedResponseDto<AdmissionListItemDto>>), 200)]
    public async Task<IActionResult> GetAll([FromQuery] AdmissionListRequestDto request)
    {
        var paged = await _service.GetAllAsync(request);

        return Ok(new ApiResponseDto<PagedResponseDto<AdmissionListItemDto>>
        {
            IsSuccess  = true,
            Data       = paged,
            Message    = "Success",
            Pagination = new PaginationMeta(paged.Page, paged.PageSize, paged.TotalCount, paged.TotalPages)
        });
    }

    // ── Detail ───────────────────────────────────────────────────────────────

    /// <summary>Get a single admission application by ID.</summary>
    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<AdmissionDetailDto>), 200)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 404)]
    public async Task<IActionResult> GetById(int id)
    {
        var application = await _service.GetByIdAsync(id);

        if (application is null)
            return NotFound(ApiResponseDto<object>.Fail($"Admission application {id} not found."));

        return Ok(ApiResponseDto<AdmissionDetailDto>.Success(application));
    }

    // ── Submit (public) ───────────────────────────────────────────────────────

    /// <summary>Submit a new admission application. No authentication required.</summary>
    [HttpPost]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponseDto<AdmissionCreatedDto>), 201)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 400)]
    public async Task<IActionResult> Submit([FromBody] AdmissionSubmitDto dto)
    {
        var result = await _service.SubmitAsync(dto);

        _logger.LogInformation(
            "Admission application #{ReferenceNumber} submitted for {ApplicantName}",
            result.ReferenceNumber, dto.ApplicantName);

        return CreatedAtAction(
            nameof(GetById),
            new { id = result.ApplicationId },
            ApiResponseDto<AdmissionCreatedDto>.Success(result, "Application submitted successfully."));
    }

    // ── Status Update ─────────────────────────────────────────────────────────

    /// <summary>Update the review status of an application (Reviewed, Accepted, Rejected).</summary>
    [HttpPut("{id:int}/status")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 200)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 400)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 404)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] AdmissionUpdateStatusDto dto)
    {
        await _service.UpdateStatusAsync(id, dto, GetCurrentUserId());
        return Ok(ApiResponseDto<object>.Success(null, "Status updated successfully."));
    }

    // ── Convert to Student ───────────────────────────────────────────────────

    /// <summary>Convert an accepted application into a fully enrolled student record.</summary>
    [HttpPost("{id:int}/convert")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 200)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 400)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 404)]
    public async Task<IActionResult> ConvertToStudent(int id, [FromBody] AdmissionConvertDto dto)
    {
        var (studentId, enrollment) = await _service.ConvertToStudentAsync(id, dto, GetCurrentUserId());

        _logger.LogInformation(
            "Application {ApplicationId} converted to Student {StudentId} ({Enrollment})",
            id, studentId, enrollment);

        return Ok(ApiResponseDto<object>.Success(
            new { StudentId = studentId, EnrollmentNumber = enrollment },
            "Application converted to student successfully."));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                 ?? User.FindFirst("sub")?.Value;

        return int.TryParse(claim, out var id) ? id : 0;
    }
}
