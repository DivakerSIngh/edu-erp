using EduERP.Application.DTOs.Common;
using EduERP.Application.DTOs.Examination;
using EduERP.Application.Interfaces;

namespace EduERP.Application.Services;

public class ExaminationService : IExaminationService
{
    private readonly IExaminationRepository _repo;

    public ExaminationService(IExaminationRepository repo) => _repo = repo;

    public async Task<PagedResponseDto<ExaminationListItemDto>> GetAllAsync(ExaminationListRequestDto request)
    {
        var (items, totalCount) = await _repo.GetAllAsync(request);
        return new PagedResponseDto<ExaminationListItemDto>
        {
            Items      = items,
            Page       = request.Page,
            PageSize   = request.PageSize,
            TotalCount = totalCount,
        };
    }

    public async Task<ExaminationDetailDto> GetByIdAsync(int id)
        => await _repo.GetByIdAsync(id)
           ?? throw new KeyNotFoundException($"Examination {id} not found.");

    public Task<ExaminationCreatedDto> CreateAsync(ExaminationCreateDto dto, int createdBy)
        => _repo.CreateAsync(dto, createdBy);

    public async Task<ExaminationDetailDto> UpdateAsync(int id, ExaminationUpdateDto dto, int updatedBy)
    {
        await _repo.UpdateAsync(id, dto, updatedBy);
        return await GetByIdAsync(id);
    }

    public async Task<ExaminationDetailDto> PublishAsync(int id, bool publish, int updatedBy)
    {
        await _repo.PublishAsync(id, publish, updatedBy);
        return await GetByIdAsync(id);
    }

    public Task DeleteAsync(int id, int deletedBy)
        => _repo.SoftDeleteAsync(id, deletedBy);

    public Task<IEnumerable<ExamResultItemDto>> GetResultsAsync(int id)
        => _repo.GetResultsAsync(id);

    public Task BulkEnterResultsAsync(int id, BulkResultEntryDto dto, int enteredBy)
        => _repo.BulkEnterResultsAsync(id, dto.Results, enteredBy);

    public Task<ReportCardDto> GetReportCardAsync(int examinationId, int studentId)
        => _repo.GetReportCardAsync(examinationId, studentId);

    public Task<IEnumerable<SubjectDto>> GetAllSubjectsAsync()
        => _repo.GetAllSubjectsAsync();

    public Task<IEnumerable<ClassStudentDto>> GetClassStudentsAsync(int classId)
        => _repo.GetClassStudentsAsync(classId);
}
