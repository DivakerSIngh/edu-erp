using EduERP.Application.DTOs.Admission;

namespace EduERP.Application.Interfaces;

public interface IAdmissionRepository
{
    Task<IEnumerable<AdmissionListItemDto>> GetAllAsync(int? academicYearId, int? classId, string? status, string? search, int offset, int limit);
    Task<AdmissionDetailDto?> GetByIdAsync(int applicationId);
    Task<AdmissionCreatedDto> SubmitAsync(AdmissionSubmitDto dto, int? createdBy);
    Task<int> UpdateStatusAsync(int applicationId, string status, string? remarks, int reviewedBy);
    Task<(int StudentId, string EnrollmentNumber)> ConvertToStudentAsync(int applicationId, int classId, int sectionId, string passwordHash, int convertedBy);
    Task<IEnumerable<AcademicYearDto>> GetAcademicYearsAsync();
    Task<IEnumerable<ClassDto>> GetClassesAsync(int academicYearId);
    Task<IEnumerable<SectionDto>> GetSectionsAsync(int classId);
}
