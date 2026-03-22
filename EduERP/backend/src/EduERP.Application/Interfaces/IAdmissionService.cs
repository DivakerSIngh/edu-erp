using EduERP.Application.DTOs.Admission;
using EduERP.Application.DTOs.Common;

namespace EduERP.Application.Interfaces;

public interface IAdmissionService
{
    Task<PagedResponseDto<AdmissionListItemDto>> GetAllAsync(AdmissionListRequestDto request);
    Task<AdmissionDetailDto?> GetByIdAsync(int applicationId);
    Task<AdmissionCreatedDto> SubmitAsync(AdmissionSubmitDto dto);
    Task UpdateStatusAsync(int applicationId, AdmissionUpdateStatusDto dto, int reviewedBy);
    Task<(int StudentId, string EnrollmentNumber)> ConvertToStudentAsync(int applicationId, AdmissionConvertDto dto, int convertedBy);
    Task<IEnumerable<AcademicYearDto>> GetAcademicYearsAsync();
    Task<IEnumerable<ClassDto>> GetClassesAsync(int academicYearId);
    Task<IEnumerable<SectionDto>> GetSectionsAsync(int classId);
}
