using EduERP.Application.DTOs.Common;
using EduERP.Application.DTOs.Student;
using EduERP.Application.Interfaces;

namespace EduERP.Application.Services;

public class StudentService : IStudentService
{
    private readonly IStudentRepository _repo;
    private readonly IPasswordHasher    _passwordHasher;

    public StudentService(IStudentRepository repo, IPasswordHasher passwordHasher)
    {
        _repo           = repo;
        _passwordHasher = passwordHasher;
    }

    public async Task<PagedResponseDto<StudentResponseDto>> GetAllAsync(StudentListRequestDto request)
    {
        var (items, totalCount) = await _repo.GetAllAsync(request);

        return new PagedResponseDto<StudentResponseDto>
        {
            Items      = items,
            Page       = request.Page,
            PageSize   = request.PageSize,
            TotalCount = totalCount
        };
    }

    public async Task<StudentDetailDto> GetByIdAsync(int studentId, int requestingUserId, string requestingRole)
    {
        var student = await _repo.GetByIdAsync(studentId)
                      ?? throw new KeyNotFoundException($"Student {studentId} not found.");

        return student;
    }

    public Task<StudentCreatedDto> CreateAsync(StudentCreateDto dto, int createdBy)
    {
        // Generate a temporary password: Student@<Year> — user must change on first login
        var tempPassword = $"Student@{dto.AdmissionDate.Year}";
        var passwordHash = _passwordHasher.Hash(tempPassword);
        return _repo.CreateAsync(dto, passwordHash, createdBy);
    }

    public async Task<StudentResponseDto> UpdateAsync(int studentId, StudentUpdateDto dto, int updatedBy)
    {
        await _repo.UpdateAsync(dto, studentId, updatedBy);
        var updated = await _repo.GetByIdAsync(studentId)
                      ?? throw new KeyNotFoundException($"Student {studentId} not found.");
        return updated;
    }

    public Task DeleteAsync(int studentId, int deletedBy)
        => _repo.SoftDeleteAsync(studentId, deletedBy);
}
