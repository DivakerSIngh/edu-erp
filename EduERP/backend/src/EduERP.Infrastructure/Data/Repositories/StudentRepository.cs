using Dapper;
using EduERP.Application.DTOs.Student;
using EduERP.Application.Interfaces;

namespace EduERP.Infrastructure.Data.Repositories;

public class StudentRepository : BaseRepository, IStudentRepository
{
    public StudentRepository(IDbConnectionFactory connectionFactory)
        : base(connectionFactory) { }

    public async Task<(IEnumerable<StudentResponseDto> Items, int TotalCount)> GetAllAsync(
        StudentListRequestDto request)
    {
        var parameters = new DynamicParameters();
        parameters.Add("@Search",         request.Search);
        parameters.Add("@ClassId",        request.ClassId);
        parameters.Add("@SectionId",      request.SectionId);
        parameters.Add("@AcademicYearId", request.AcademicYearId);
        parameters.Add("@Status",         request.Status);
        parameters.Add("@Offset",         (request.Page - 1) * request.PageSize);
        parameters.Add("@Limit",          request.PageSize);

        var rows = await QueryAsync<StudentResponseDto>(
            "usp_Student_GetAll", parameters);

        var list       = rows.ToList();
        var totalCount = list.Count > 0
            ? list[0].TotalCount   // window-function column on first row
            : 0;

        return (list, totalCount);
    }

    public async Task<StudentDetailDto?> GetByIdAsync(int studentId)
    {
        var parameters = new DynamicParameters();
        parameters.Add("@StudentId", studentId);

        using var multi = await QueryMultipleAsync("usp_Student_GetById", parameters);

        var student = await multi.ReadFirstOrDefaultAsync<StudentDetailDto>();
        if (student is null) return null;

        student.Parents = (await multi.ReadAsync<ParentSummaryDto>()).ToList();
        return student;
    }

    public async Task<StudentCreatedDto> CreateAsync(
        StudentCreateDto dto, string passwordHash, int createdBy)
    {
        var parameters = new DynamicParameters();
        parameters.Add("@FullName",              $"{dto.FirstName} {dto.LastName}");
        parameters.Add("@Email",                 dto.Email);
        parameters.Add("@PasswordHash",          passwordHash);
        parameters.Add("@DateOfBirth",           dto.DateOfBirth);
        parameters.Add("@Gender",                dto.Gender);
        parameters.Add("@BloodGroup",            dto.BloodGroup);
        parameters.Add("@Address",               dto.Address);
        parameters.Add("@PhoneNumber",           dto.Phone);
        parameters.Add("@ClassId",               dto.ClassId);
        parameters.Add("@SectionId",             dto.SectionId);
        parameters.Add("@AcademicYearId",        dto.AcademicYearId);
        parameters.Add("@AdmissionDate",         dto.AdmissionDate);
        parameters.Add("@EmergencyContactName",  dto.EmergencyContactName);
        parameters.Add("@EmergencyContactPhone", dto.EmergencyContactPhone);
        parameters.Add("@CreatedBy",             createdBy);

        return await QueryFirstOrDefaultAsync<StudentCreatedDto>(
            "usp_Student_Create", parameters)
               ?? throw new InvalidOperationException("Student creation SP returned no row.");
    }

    public async Task UpdateAsync(StudentUpdateDto dto, int studentId, int updatedBy)
    {
        string? fullName = (dto.FirstName != null || dto.LastName != null)
            ? $"{dto.FirstName ?? string.Empty} {dto.LastName ?? string.Empty}".Trim()
            : null;

        var parameters = new DynamicParameters();
        parameters.Add("@StudentId",   studentId);
        parameters.Add("@FullName",    fullName);
        parameters.Add("@Address",     dto.Address);
        parameters.Add("@PhoneNumber", dto.Phone);
        parameters.Add("@ClassId",     dto.ClassId);
        parameters.Add("@SectionId",   dto.SectionId);
        parameters.Add("@Status",      dto.Status);
        parameters.Add("@UpdatedBy",   updatedBy);

        await ExecuteAsync("usp_Student_Update", parameters);
    }

    public async Task<StudentDetailDto?> GetByUserIdAsync(int userId)
    {
        var parameters = new DynamicParameters();
        parameters.Add("@UserId", userId);

        using var multi = await QueryMultipleAsync("usp_Student_GetByUserId", parameters);

        var student = await multi.ReadFirstOrDefaultAsync<StudentDetailDto>();
        if (student is null) return null;

        student.Parents = (await multi.ReadAsync<ParentSummaryDto>()).ToList();
        return student;
    }

    public async Task<IEnumerable<StudentResultDto>> GetMyResultsAsync(int studentId)
    {
        var parameters = new DynamicParameters();
        parameters.Add("@StudentId", studentId);
        return await QueryAsync<StudentResultDto>("usp_Student_GetMyResults", parameters);
    }

    public async Task SoftDeleteAsync(int studentId, int deletedBy)
    {
        var parameters = new DynamicParameters();
        parameters.Add("@StudentId", studentId);
        parameters.Add("@DeletedBy", deletedBy);

        await ExecuteAsync("usp_Student_SoftDelete", parameters);
    }
}
