using EduERP.Application.DTOs.Admission;
using EduERP.Application.DTOs.Common;
using EduERP.Application.Interfaces;

namespace EduERP.Application.Services;

public class AdmissionService : IAdmissionService
{
    private readonly IAdmissionRepository _repo;
    private readonly IPasswordHasher _passwordHasher;

    public AdmissionService(IAdmissionRepository repo, IPasswordHasher passwordHasher)
    {
        _repo           = repo;
        _passwordHasher = passwordHasher;
    }

    public async Task<PagedResponseDto<AdmissionListItemDto>> GetAllAsync(AdmissionListRequestDto request)
    {
        var rows = (await _repo.GetAllAsync(
            request.AcademicYearId,
            request.ClassId,
            request.Status,
            request.Search,
            request.Offset,
            request.Limit)).ToList();

        var totalCount = rows.FirstOrDefault()?.TotalCount ?? 0;

        return new PagedResponseDto<AdmissionListItemDto>
        {
            Items      = rows,
            Page       = request.Page,
            PageSize   = request.PageSize,
            TotalCount = totalCount
        };
    }

    public Task<AdmissionDetailDto?> GetByIdAsync(int applicationId)
        => _repo.GetByIdAsync(applicationId);

    public Task<AdmissionCreatedDto> SubmitAsync(AdmissionSubmitDto dto)
        => _repo.SubmitAsync(dto, createdBy: null);

    public async Task UpdateStatusAsync(int applicationId, AdmissionUpdateStatusDto dto, int reviewedBy)
    {
        var validStatuses = new[] { "Pending", "Reviewed", "Accepted", "Rejected" };
        if (!validStatuses.Contains(dto.Status))
            throw new ArgumentException($"Invalid status '{dto.Status}'. Must be one of: {string.Join(", ", validStatuses)}.");

        var rows = await _repo.UpdateStatusAsync(applicationId, dto.Status, dto.Remarks, reviewedBy);
        if (rows == 0)
            throw new KeyNotFoundException($"Admission application {applicationId} not found or already finalised.");
    }

    public async Task<(int StudentId, string EnrollmentNumber)> ConvertToStudentAsync(
        int applicationId, AdmissionConvertDto dto, int convertedBy)
    {
        var passwordHash = _passwordHasher.Hash(dto.TempPassword);  // Argon2id via IPasswordHasher
        return await _repo.ConvertToStudentAsync(applicationId, dto.ClassId, dto.SectionId, passwordHash, convertedBy);
    }

    public Task<IEnumerable<AcademicYearDto>> GetAcademicYearsAsync()
        => _repo.GetAcademicYearsAsync();

    public Task<IEnumerable<ClassDto>> GetClassesAsync(int academicYearId)
        => _repo.GetClassesAsync(academicYearId);

    public Task<IEnumerable<SectionDto>> GetSectionsAsync(int classId)
        => _repo.GetSectionsAsync(classId);
}
