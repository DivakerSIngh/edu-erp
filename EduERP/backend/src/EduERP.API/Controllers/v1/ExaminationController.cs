using EduERP.API.Extensions;
using EduERP.Application.DTOs.Common;
using EduERP.Application.DTOs.Examination;
using EduERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduERP.API.Controllers.v1;

/// <summary>
/// Examination management — create exams, enter results, generate report cards.
/// Admin has full access; Teachers can enter results; Students/Parents read published exams only.
/// </summary>
[ApiController]
[Route("api/v1/examinations")]
[Authorize]
[Produces("application/json")]
public class ExaminationController : ControllerBase
{
    private readonly IExaminationService             _service;
    private readonly ILogger<ExaminationController>  _logger;

    public ExaminationController(IExaminationService service, ILogger<ExaminationController> logger)
    {
        _service = service;
        _logger  = logger;
    }

    // ── Lookup: subjects ─────────────────────────────────────────────────────

    /// <summary>Get all subjects (used when entering results).</summary>
    [HttpGet("subjects")]
    [Authorize(Roles = "Admin,Teacher")]
    [ProducesResponseType(typeof(ApiResponseDto<IEnumerable<SubjectDto>>), 200)]
    public async Task<IActionResult> GetSubjects()
    {
        var subjects = await _service.GetAllSubjectsAsync();
        return Ok(ApiResponseDto<IEnumerable<SubjectDto>>.Success(subjects));
    }

    // ── Lookup: class students ────────────────────────────────────────────────

    /// <summary>Get active students for a class (used in bulk results entry grid).</summary>
    [HttpGet("classes/{classId:int}/students")]
    [Authorize(Roles = "Admin,Teacher")]
    [ProducesResponseType(typeof(ApiResponseDto<IEnumerable<ClassStudentDto>>), 200)]
    public async Task<IActionResult> GetClassStudents(int classId)
    {
        var students = await _service.GetClassStudentsAsync(classId);
        return Ok(ApiResponseDto<IEnumerable<ClassStudentDto>>.Success(students));
    }

    // ── List ─────────────────────────────────────────────────────────────────

    /// <summary>Get paginated list of examinations with optional filters.</summary>
    [HttpGet]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    [ProducesResponseType(typeof(ApiResponseDto<PagedResponseDto<ExaminationListItemDto>>), 200)]
    public async Task<IActionResult> GetAll([FromQuery] ExaminationListRequestDto request)
    {
        var result = await _service.GetAllAsync(request);
        return Ok(ApiResponseDto<PagedResponseDto<ExaminationListItemDto>>.Success(result));
    }

    // ── Get By ID ─────────────────────────────────────────────────────────────

    /// <summary>Get full details of a single examination.</summary>
    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    [ProducesResponseType(typeof(ApiResponseDto<ExaminationDetailDto>), 200)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 404)]
    public async Task<IActionResult> GetById(int id)
    {
        var exam = await _service.GetByIdAsync(id);
        return Ok(ApiResponseDto<ExaminationDetailDto>.Success(exam));
    }

    // ── Create ────────────────────────────────────────────────────────────────

    /// <summary>Create a new examination.</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<ExaminationCreatedDto>), 201)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 400)]
    public async Task<IActionResult> Create([FromBody] ExaminationCreateDto dto)
    {
        var createdBy = User.GetUserId();
        var result    = await _service.CreateAsync(dto, createdBy);

        _logger.LogInformation(
            "Examination created. ExaminationId={ExaminationId} By={CreatedBy}",
            result.ExaminationId, createdBy);

        return CreatedAtAction(nameof(GetById), new { id = result.ExaminationId },
            ApiResponseDto<ExaminationCreatedDto>.Success(result, "Examination created successfully."));
    }

    // ── Update ────────────────────────────────────────────────────────────────

    /// <summary>Update an existing examination.</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<ExaminationDetailDto>), 200)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 404)]
    public async Task<IActionResult> Update(int id, [FromBody] ExaminationUpdateDto dto)
    {
        var updatedBy = User.GetUserId();
        var result    = await _service.UpdateAsync(id, dto, updatedBy);
        return Ok(ApiResponseDto<ExaminationDetailDto>.Success(result, "Examination updated successfully."));
    }

    // ── Publish / Unpublish ───────────────────────────────────────────────────

    /// <summary>Publish or unpublish an examination (makes results visible to students).</summary>
    [HttpPatch("{id:int}/publish")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<ExaminationDetailDto>), 200)]
    public async Task<IActionResult> Publish(int id, [FromBody] PublishExamDto dto)
    {
        var updatedBy = User.GetUserId();
        var result    = await _service.PublishAsync(id, dto.Publish, updatedBy);
        var msg       = dto.Publish ? "Examination published." : "Examination unpublished.";
        return Ok(ApiResponseDto<ExaminationDetailDto>.Success(result, msg));
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    /// <summary>Soft-delete an examination.</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(204)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 404)]
    public async Task<IActionResult> Delete(int id)
    {
        var deletedBy = User.GetUserId();
        await _service.DeleteAsync(id, deletedBy);

        _logger.LogInformation(
            "Examination soft-deleted. ExaminationId={ExaminationId} By={DeletedBy}", id, deletedBy);

        return NoContent();
    }

    // ── Results ───────────────────────────────────────────────────────────────

    /// <summary>Get all entered results for an examination.</summary>
    [HttpGet("{id:int}/results")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    [ProducesResponseType(typeof(ApiResponseDto<IEnumerable<ExamResultItemDto>>), 200)]
    public async Task<IActionResult> GetResults(int id)
    {
        var results = await _service.GetResultsAsync(id);
        return Ok(ApiResponseDto<IEnumerable<ExamResultItemDto>>.Success(results));
    }

    /// <summary>Bulk insert or update results for an examination.</summary>
    [HttpPost("{id:int}/results")]
    [Authorize(Roles = "Admin,Teacher")]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 200)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 400)]
    public async Task<IActionResult> BulkEnterResults(int id, [FromBody] BulkResultEntryDto dto)
    {
        var enteredBy = User.GetUserId();
        await _service.BulkEnterResultsAsync(id, dto, enteredBy);

        _logger.LogInformation(
            "Results entered for ExaminationId={ExaminationId} Count={Count} By={EnteredBy}",
            id, dto.Results.Count, enteredBy);

        return Ok(ApiResponseDto<object>.Success(null, "Results saved successfully."));
    }

    // ── Report Card ───────────────────────────────────────────────────────────

    /// <summary>Get a student's report card for a specific examination.</summary>
    [HttpGet("{id:int}/reportcard/{studentId:int}")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    [ProducesResponseType(typeof(ApiResponseDto<ReportCardDto>), 200)]
    public async Task<IActionResult> GetReportCard(int id, int studentId)
    {
        var card = await _service.GetReportCardAsync(id, studentId);
        return Ok(ApiResponseDto<ReportCardDto>.Success(card));
    }
}
