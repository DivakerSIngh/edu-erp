using EduERP.API.Extensions;
using EduERP.Application.DTOs.Common;
using EduERP.Application.DTOs.Student;
using EduERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduERP.API.Controllers.v1;

/// <summary>
/// Student management operations.
/// Access is role-scoped: Admin has full access; Teachers/Students/Parents have read-only.
/// </summary>
[ApiController]
[Route("api/v1/students")]
[Authorize]
[Produces("application/json")]
public class StudentController : ControllerBase
{
    private readonly IStudentService _studentService;
    private readonly ILogger<StudentController> _logger;

    public StudentController(IStudentService studentService, ILogger<StudentController> logger)
    {
        _studentService = studentService;
        _logger         = logger;
    }

    // ── List ─────────────────────────────────────────────────────────────────

    /// <summary>Get paginated list of students with filters.</summary>
    [HttpGet]
    [Authorize(Roles = "Admin,Teacher")]
    [ProducesResponseType(typeof(ApiResponseDto<PagedResponseDto<StudentResponseDto>>), 200)]
    public async Task<IActionResult> GetAll([FromQuery] StudentListRequestDto request)
    {
        var result = await _studentService.GetAllAsync(request);
        return Ok(ApiResponseDto<PagedResponseDto<StudentResponseDto>>.Success(result));
    }

    // ── Get By ID ─────────────────────────────────────────────────────────────

    /// <summary>Get a student's full profile by ID.</summary>
    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    [ProducesResponseType(typeof(ApiResponseDto<StudentDetailDto>), 200)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 404)]
    public async Task<IActionResult> GetById(int id)
    {
        // Students can only view their own profile; Parents can only see their child
        var requestingUserId = User.GetUserId();
        var requestingRole   = User.GetRole();

        var student = await _studentService.GetByIdAsync(id, requestingUserId, requestingRole);
        return Ok(ApiResponseDto<StudentDetailDto>.Success(student));
    }

    // ── Create ────────────────────────────────────────────────────────────────

    /// <summary>Create a new student record.</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<StudentCreatedDto>), 201)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 400)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 409)]
    public async Task<IActionResult> Create([FromBody] StudentCreateDto dto)
    {
        var createdBy = User.GetUserId();
        var result   = await _studentService.CreateAsync(dto, createdBy);

        _logger.LogInformation(
            "Student created. StudentId={StudentId} By={CreatedBy}", result.StudentId, createdBy);

        return CreatedAtAction(nameof(GetById), new { id = result.StudentId },
            ApiResponseDto<StudentCreatedDto>.Success(result, "Student created successfully"));
    }

    // ── Update ────────────────────────────────────────────────────────────────

    /// <summary>Update an existing student's information.</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponseDto<StudentResponseDto>), 200)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 400)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 404)]
    public async Task<IActionResult> Update(int id, [FromBody] StudentUpdateDto dto)
    {
        var updatedBy = User.GetUserId();
        var result   = await _studentService.UpdateAsync(id, dto, updatedBy);
        return Ok(ApiResponseDto<StudentResponseDto>.Success(result, "Student updated successfully"));
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    /// <summary>Soft-delete a student record.</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(204)]
    [ProducesResponseType(typeof(ApiResponseDto<object>), 404)]
    public async Task<IActionResult> Delete(int id)
    {
        var deletedBy = User.GetUserId();
        await _studentService.DeleteAsync(id, deletedBy);

        _logger.LogInformation(
            "Student soft-deleted. StudentId={StudentId} By={DeletedBy}", id, deletedBy);

        return NoContent();
    }
}
