using EduERP.Application.DTOs.Attendance;

namespace EduERP.Application.Interfaces;

public interface IAttendanceService
{
    Task<BulkMarkResultDto>            BulkMarkAsync(BulkMarkRequestDto dto, int markedBy);
    Task<IEnumerable<ClassAttendanceRowDto>> GetByClassAsync(int classId, int sectionId, int month, int year);
    Task<StudentAttendanceResponseDto> GetByStudentAsync(int studentId, DateOnly fromDate, DateOnly toDate);
    Task<int>                          UpdateSingleAsync(int attendanceId, UpdateAttendanceDto dto, int updatedBy);
}
