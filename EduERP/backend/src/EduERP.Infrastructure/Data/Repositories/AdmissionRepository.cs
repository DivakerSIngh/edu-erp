using EduERP.Application.DTOs.Admission;
using EduERP.Application.Interfaces;

namespace EduERP.Infrastructure.Data.Repositories;

public class AdmissionRepository : BaseRepository, IAdmissionRepository
{
    public AdmissionRepository(IDbConnectionFactory factory) : base(factory) { }

    public async Task<IEnumerable<AdmissionListItemDto>> GetAllAsync(
        int? academicYearId, int? classId, string? status, string? search, int offset, int limit)
    {
        return await QueryAsync<AdmissionListItemDto>(
            "usp_Admission_GetAll",
            new { AcademicYearId = academicYearId, ClassId = classId, Status = status, Search = search, Offset = offset, Limit = limit },
            readOnly: true);
    }

    public async Task<AdmissionDetailDto?> GetByIdAsync(int applicationId)
    {
        return await QueryFirstOrDefaultAsync<AdmissionDetailDto>(
            "usp_Admission_GetById",
            new { ApplicationId = applicationId },
            readOnly: true);
    }

    public async Task<AdmissionCreatedDto> SubmitAsync(AdmissionSubmitDto dto, int? createdBy)
    {
        var result = await QueryFirstOrDefaultAsync<AdmissionCreatedDto>(
            "usp_Admission_Submit",
            new
            {
                dto.ApplicantName,
                dto.DateOfBirth,
                dto.Gender,
                dto.ApplyingForClass,
                dto.AcademicYearId,
                dto.ClassId,
                dto.ParentName,
                dto.ParentEmail,
                dto.ParentPhone,
                dto.PreviousSchool,
                CreatedBy = createdBy
            });

        return result ?? throw new InvalidOperationException("Admission submission failed: no result returned.");
    }

    public async Task<int> UpdateStatusAsync(int applicationId, string status, string? remarks, int reviewedBy)
    {
        var result = await QueryFirstOrDefaultAsync<dynamic>(
            "usp_Admission_UpdateStatus",
            new { ApplicationId = applicationId, Status = status, Remarks = remarks, ReviewedBy = reviewedBy });

        return result?.RowsAffected ?? 0;
    }

    public async Task<(int StudentId, string EnrollmentNumber)> ConvertToStudentAsync(
        int applicationId, int classId, int sectionId, string passwordHash, int convertedBy)
    {
        var result = await QueryFirstOrDefaultAsync<dynamic>(
            "usp_Admission_ConvertToStudent",
            new { ApplicationId = applicationId, ClassId = classId, SectionId = sectionId, PasswordHash = passwordHash, ConvertedBy = convertedBy });

        if (result is null)
            throw new InvalidOperationException("Conversion failed: no result returned.");

        return ((int)result.StudentId, (string)result.EnrollmentNumber);
    }

    public async Task<IEnumerable<AcademicYearDto>> GetAcademicYearsAsync()
    {
        return await QueryAsync<AcademicYearDto>(
            "usp_AcademicYear_GetAll",
            readOnly: true);
    }

    public async Task<IEnumerable<ClassDto>> GetClassesAsync(int academicYearId)
    {
        return await QueryAsync<ClassDto>(
            "usp_Class_GetByAcademicYear",
            new { AcademicYearId = academicYearId },
            readOnly: true);
    }

    public async Task<IEnumerable<SectionDto>> GetSectionsAsync(int classId)
    {
        return await QueryAsync<SectionDto>(
            "usp_Section_GetByClass",
            new { ClassId = classId },
            readOnly: true);
    }
}
