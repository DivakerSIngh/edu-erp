using EduERP.Application.DTOs.Reports;
using EduERP.Application.Interfaces;

namespace EduERP.Application.Services;

public class ReportService : IReportService
{
    private readonly IReportRepository _repo;

    public ReportService(IReportRepository repo)
    {
        _repo = repo;
    }

    public Task<IEnumerable<StudentStrengthDto>> GetStudentStrengthAsync(int? academicYearId) =>
        _repo.GetStudentStrengthAsync(academicYearId);

    public Task<IEnumerable<LowAttendanceStudentDto>> GetLowAttendanceAsync(
        LowAttendanceRequestDto request) =>
        _repo.GetLowAttendanceAsync(request);

    public async Task<IndividualReportCardDto?> GetIndividualReportCardAsync(
        int studentId, int academicYearId)
    {
        var (header, results) = await _repo.GetReportCardAsync(studentId, academicYearId);
        if (header is null) return null;
        return new IndividualReportCardDto
        {
            Header  = header,
            Results = results.ToList(),
        };
    }

    public Task<IEnumerable<SubjectPerformanceDto>> GetSubjectPerformanceAsync(
        SubjectPerformanceRequestDto request) =>
        _repo.GetSubjectPerformanceAsync(request);

    public Task<IEnumerable<PaymentHistoryDto>> GetPaymentHistoryAsync(
        PaymentHistoryRequestDto request) =>
        _repo.GetPaymentHistoryAsync(request);

    public Task<IEnumerable<AdmissionStatDto>> GetAdmissionStatsAsync(int? academicYearId) =>
        _repo.GetAdmissionStatsAsync(academicYearId);

    public Task<IEnumerable<StudentDirectoryDto>> GetStudentDirectoryAsync(
        StudentDirectoryRequestDto request) =>
        _repo.GetStudentDirectoryAsync(request);
}
