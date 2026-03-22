using EduERP.Application.DTOs.Student;
using EduERP.Application.DTOs.Common;

namespace EduERP.Application.Interfaces;

public interface IStudentService
{
    Task<PagedResponseDto<StudentResponseDto>> GetAllAsync(StudentListRequestDto request);
    Task<StudentDetailDto>                     GetByIdAsync(int studentId, int requestingUserId, string requestingRole);
    Task<StudentCreatedDto>                    CreateAsync(StudentCreateDto dto, int createdBy);
    Task<StudentResponseDto>                   UpdateAsync(int studentId, StudentUpdateDto dto, int updatedBy);
    Task                                       DeleteAsync(int studentId, int deletedBy);
}
