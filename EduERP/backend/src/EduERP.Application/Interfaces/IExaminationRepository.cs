using EduERP.Application.DTOs.Common;
using EduERP.Application.DTOs.Examination;

namespace EduERP.Application.Interfaces;

public interface IExaminationRepository
{
    Task<(IEnumerable<ExaminationListItemDto> Items, int TotalCount)> GetAllAsync(ExaminationListRequestDto request);
    Task<ExaminationDetailDto?>                    GetByIdAsync(int examinationId);
    Task<ExaminationCreatedDto>                    CreateAsync(ExaminationCreateDto dto, int createdBy);
    Task                                           UpdateAsync(int examinationId, ExaminationUpdateDto dto, int updatedBy);
    Task                                           PublishAsync(int examinationId, bool publish, int updatedBy);
    Task                                           SoftDeleteAsync(int examinationId, int deletedBy);
    Task<IEnumerable<ExamResultItemDto>>           GetResultsAsync(int examinationId);
    Task                                           BulkEnterResultsAsync(int examinationId, IEnumerable<ResultRowDto> results, int enteredBy);
    Task<ReportCardDto>                            GetReportCardAsync(int examinationId, int studentId);
    Task<IEnumerable<SubjectDto>>                  GetAllSubjectsAsync();
    Task<IEnumerable<ClassStudentDto>>             GetClassStudentsAsync(int classId);
}
