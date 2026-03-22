using Dapper;
using EduERP.Application.DTOs.Reports;
using EduERP.Application.Interfaces;
using EduERP.Infrastructure.Data;

namespace EduERP.Infrastructure.Data.Repositories;

public class ReportRepository : BaseRepository, IReportRepository
{
    public ReportRepository(IDbConnectionFactory factory) : base(factory) { }

    public Task<IEnumerable<StudentStrengthDto>> GetStudentStrengthAsync(int? academicYearId) =>
        QueryAsync<StudentStrengthDto>(
            "usp_Report_StudentStrength",
            new { AcademicYearId = academicYearId },
            readOnly: true);

    public Task<IEnumerable<LowAttendanceStudentDto>> GetLowAttendanceAsync(LowAttendanceRequestDto request) =>
        QueryAsync<LowAttendanceStudentDto>(
            "usp_Report_LowAttendance",
            new
            {
                request.ClassId,
                request.Month,
                request.Year,
                request.ThresholdPct,
            },
            readOnly: true);

    public async Task<(ReportCardHeaderDto? header, IEnumerable<ReportCardResultRowDto> results)>
        GetReportCardAsync(int studentId, int academicYearId)
    {
        using var multi = await QueryMultipleAsync(
            "usp_Report_IndividualReportCard",
            new { StudentId = studentId, AcademicYearId = academicYearId });

        var header  = await multi.ReadFirstOrDefaultAsync<ReportCardHeaderDto>();
        var results = await multi.ReadAsync<ReportCardResultRowDto>();
        return (header, results);
    }

    public Task<IEnumerable<SubjectPerformanceDto>> GetSubjectPerformanceAsync(
        SubjectPerformanceRequestDto request) =>
        QueryAsync<SubjectPerformanceDto>(
            "usp_Report_SubjectPerformance",
            new
            {
                request.AcademicYearId,
                SubjectId = request.SubjectId,
                ClassId   = request.ClassId,
            },
            readOnly: true);

    public Task<IEnumerable<PaymentHistoryDto>> GetPaymentHistoryAsync(
        PaymentHistoryRequestDto request) =>
        QueryAsync<PaymentHistoryDto>(
            "usp_Report_PaymentHistory",
            new
            {
                FromDate = request.FromDate.ToDateTime(TimeOnly.MinValue),
                ToDate   = request.ToDate.ToDateTime(TimeOnly.MinValue),
                ClassId  = request.ClassId,
            },
            readOnly: true);

    public Task<IEnumerable<AdmissionStatDto>> GetAdmissionStatsAsync(int? academicYearId) =>
        QueryAsync<AdmissionStatDto>(
            "usp_Report_AdmissionStats",
            new { AcademicYearId = academicYearId },
            readOnly: true);

    public Task<IEnumerable<StudentDirectoryDto>> GetStudentDirectoryAsync(
        StudentDirectoryRequestDto request) =>
        QueryAsync<StudentDirectoryDto>(
            "usp_Report_StudentDirectory",
            new
            {
                AcademicYearId = request.AcademicYearId,
                ClassId        = request.ClassId,
                SectionId      = request.SectionId,
                Gender         = request.Gender,
                Status         = request.Status,
            },
            readOnly: true);
}
