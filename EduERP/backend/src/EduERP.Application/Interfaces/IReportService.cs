using EduERP.Application.DTOs.Reports;

namespace EduERP.Application.Interfaces;

public interface IReportService
{
    Task<IEnumerable<StudentStrengthDto>>    GetStudentStrengthAsync(int? academicYearId);
    Task<IEnumerable<LowAttendanceStudentDto>> GetLowAttendanceAsync(LowAttendanceRequestDto request);
    Task<IndividualReportCardDto?>           GetIndividualReportCardAsync(int studentId, int academicYearId);
    Task<IEnumerable<SubjectPerformanceDto>> GetSubjectPerformanceAsync(SubjectPerformanceRequestDto request);
    Task<IEnumerable<PaymentHistoryDto>>     GetPaymentHistoryAsync(PaymentHistoryRequestDto request);
    Task<IEnumerable<AdmissionStatDto>>      GetAdmissionStatsAsync(int? academicYearId);
    Task<IEnumerable<StudentDirectoryDto>>   GetStudentDirectoryAsync(StudentDirectoryRequestDto request);
}
