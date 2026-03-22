using System.Data;
using Dapper;
using EduERP.Application.DTOs.Attendance;
using EduERP.Application.Interfaces;

namespace EduERP.Infrastructure.Data.Repositories;

public class AttendanceRepository : BaseRepository, IAttendanceRepository
{
    public AttendanceRepository(IDbConnectionFactory connectionFactory)
        : base(connectionFactory) { }

    public async Task<int> BulkMarkAsync(BulkMarkRequestDto dto, int markedBy)
    {
        // Build DataTable matching dbo.udt_AttendanceRecord
        var dt = new DataTable();
        dt.Columns.Add("StudentId", typeof(int));
        dt.Columns.Add("Status",    typeof(string));
        dt.Columns.Add("Remarks",   typeof(string));

        foreach (var r in dto.Records)
            dt.Rows.Add(r.StudentId, r.Status, (object?)r.Remarks ?? DBNull.Value);

        var p = new DynamicParameters();
        p.Add("@ClassId",        dto.ClassId);
        p.Add("@SectionId",      dto.SectionId);
        p.Add("@SubjectId",      (object?)dto.SubjectId ?? DBNull.Value);
        p.Add("@AttendanceDate", dto.AttendanceDate.ToDateTime(TimeOnly.MinValue), DbType.Date);
        p.Add("@Period",         (object?)dto.Period ?? DBNull.Value);
        p.Add("@MarkedBy",       markedBy);
        p.Add("@Records",        dt.AsTableValuedParameter("dbo.udt_AttendanceRecord"));

        var result = await QueryFirstOrDefaultAsync<BulkMarkResultDto>(
            "usp_Attendance_BulkMark", p);

        return result?.MarkedCount ?? 0;
    }

    public async Task<IEnumerable<ClassAttendanceRowDto>> GetByClassAsync(
        int classId, int sectionId, int month, int year)
    {
        var p = new DynamicParameters();
        p.Add("@ClassId",   classId);
        p.Add("@SectionId", sectionId);
        p.Add("@Month",     (byte)month);
        p.Add("@Year",      (short)year);

        return await QueryAsync<ClassAttendanceRowDto>("usp_Attendance_GetByClass", p);
    }

    public async Task<StudentAttendanceResponseDto> GetByStudentAsync(
        int studentId, DateOnly fromDate, DateOnly toDate)
    {
        var p = new DynamicParameters();
        p.Add("@StudentId", studentId);
        p.Add("@FromDate",  fromDate.ToDateTime(TimeOnly.MinValue), DbType.Date);
        p.Add("@ToDate",    toDate.ToDateTime(TimeOnly.MinValue),   DbType.Date);

        using var multi = await QueryMultipleAsync("usp_Attendance_GetByStudent", p);

        var details = (await multi.ReadAsync<StudentAttendanceDetailDto>()).ToList();
        var summary = await multi.ReadFirstOrDefaultAsync<AttendanceSummaryDto>()
                      ?? new AttendanceSummaryDto(0, 0, 0, 0, 0, 0m);

        return new StudentAttendanceResponseDto(details, summary);
    }

    public async Task<int> UpdateSingleAsync(
        int attendanceId, UpdateAttendanceDto dto, int updatedBy)
    {
        var p = new DynamicParameters();
        p.Add("@AttendanceId", attendanceId);
        p.Add("@Status",       dto.Status);
        p.Add("@Remarks",      (object?)dto.Remarks ?? DBNull.Value);
        p.Add("@UpdatedBy",    updatedBy);

        var result = await QueryFirstOrDefaultAsync<UpdateResultDto>(
            "usp_Attendance_UpdateSingle", p);

        return result?.RowsAffected ?? 0;
    }

    private record UpdateResultDto(int RowsAffected);
}
