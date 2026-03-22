using EduERP.Application.DTOs.Attendance;
using EduERP.Application.Interfaces;

namespace EduERP.Application.Services;

public class AttendanceService : IAttendanceService
{
    private readonly IAttendanceRepository _repo;

    public AttendanceService(IAttendanceRepository repo) => _repo = repo;

    public async Task<BulkMarkResultDto> BulkMarkAsync(BulkMarkRequestDto dto, int markedBy)
    {
        var count = await _repo.BulkMarkAsync(dto, markedBy);
        return new BulkMarkResultDto(count);
    }

    public Task<IEnumerable<ClassAttendanceRowDto>> GetByClassAsync(
        int classId, int sectionId, int month, int year)
        => _repo.GetByClassAsync(classId, sectionId, month, year);

    public Task<StudentAttendanceResponseDto> GetByStudentAsync(
        int studentId, DateOnly fromDate, DateOnly toDate)
        => _repo.GetByStudentAsync(studentId, fromDate, toDate);

    public Task<int> UpdateSingleAsync(int attendanceId, UpdateAttendanceDto dto, int updatedBy)
        => _repo.UpdateSingleAsync(attendanceId, dto, updatedBy);
}
