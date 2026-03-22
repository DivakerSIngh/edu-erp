using EduERP.Application.DTOs.Student;

namespace EduERP.Application.Interfaces;

public interface IStudentRepository
{
    Task<(IEnumerable<StudentResponseDto> Items, int TotalCount)> GetAllAsync(StudentListRequestDto request);
    Task<StudentDetailDto?> GetByIdAsync(int studentId);
    Task<StudentCreatedDto> CreateAsync(StudentCreateDto dto, string passwordHash, int createdBy);
    Task UpdateAsync(StudentUpdateDto dto, int studentId, int updatedBy);
    Task SoftDeleteAsync(int studentId, int deletedBy);
}
