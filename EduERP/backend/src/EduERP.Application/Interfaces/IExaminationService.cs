using EduERP.Application.DTOs.Common;
using EduERP.Application.DTOs.Examination;

namespace EduERP.Application.Interfaces;

public interface IExaminationService
{
    Task<PagedResponseDto<ExaminationListItemDto>> GetAllAsync(ExaminationListRequestDto request);
    Task<ExaminationDetailDto>                     GetByIdAsync(int examinationId);
    Task<ExaminationCreatedDto>                    CreateAsync(ExaminationCreateDto dto, int createdBy);
    Task<ExaminationDetailDto>                     UpdateAsync(int examinationId, ExaminationUpdateDto dto, int updatedBy);
    Task<ExaminationDetailDto>                     PublishAsync(int examinationId, bool publish, int updatedBy);
    Task                                           DeleteAsync(int examinationId, int deletedBy);
    Task<IEnumerable<ExamResultItemDto>>           GetResultsAsync(int examinationId);
    Task                                           BulkEnterResultsAsync(int examinationId, BulkResultEntryDto dto, int enteredBy);
    Task<ReportCardDto>                            GetReportCardAsync(int examinationId, int studentId);
    Task<IEnumerable<SubjectDto>>                  GetAllSubjectsAsync();
    Task<IEnumerable<ClassStudentDto>>             GetClassStudentsAsync(int classId);
    Task<IEnumerable<ClassDto>>                    GetAllClassesAsync();
    Task<IEnumerable<SectionDto>>                  GetSectionsByClassAsync(int classId);
}
