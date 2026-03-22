using System.Data;
using Dapper;
using EduERP.Application.DTOs.Examination;
using EduERP.Application.Interfaces;

namespace EduERP.Infrastructure.Data.Repositories;

public class ExaminationRepository : BaseRepository, IExaminationRepository
{
    public ExaminationRepository(IDbConnectionFactory connectionFactory)
        : base(connectionFactory) { }

    public async Task<(IEnumerable<ExaminationListItemDto> Items, int TotalCount)> GetAllAsync(
        ExaminationListRequestDto request)
    {
        var p = new DynamicParameters();
        p.Add("@AcademicYearId", request.AcademicYearId);
        p.Add("@ClassId",        request.ClassId);
        p.Add("@ExamType",       request.ExamType);
        p.Add("@Offset",         (request.Page - 1) * request.PageSize);
        p.Add("@Limit",          request.PageSize);

        var rows  = await QueryAsync<ExaminationListItemDto>("usp_Exam_GetAll", p);
        var list  = rows.ToList();
        var total = list.Count > 0 ? list[0].TotalCount : 0;
        return (list, total);
    }

    public Task<ExaminationDetailDto?> GetByIdAsync(int id)
    {
        var p = new DynamicParameters();
        p.Add("@ExaminationId", id);
        return QueryFirstOrDefaultAsync<ExaminationDetailDto>("usp_Exam_GetById", p);
    }

    public async Task<ExaminationCreatedDto> CreateAsync(ExaminationCreateDto dto, int createdBy)
    {
        var p = new DynamicParameters();
        p.Add("@ExamName",       dto.ExamName);
        p.Add("@ExamType",       dto.ExamType);
        p.Add("@ClassId",        dto.ClassId);
        p.Add("@AcademicYearId", dto.AcademicYearId);
        p.Add("@StartDate",      dto.StartDate);
        p.Add("@EndDate",        dto.EndDate);
        p.Add("@MaxMarks",       dto.MaxMarks);
        p.Add("@PassMarks",      dto.PassMarks);
        p.Add("@CreatedBy",      createdBy);

        return await QueryFirstOrDefaultAsync<ExaminationCreatedDto>("usp_Exam_Create", p)
               ?? throw new InvalidOperationException("Exam creation SP returned no row.");
    }

    public Task UpdateAsync(int id, ExaminationUpdateDto dto, int updatedBy)
    {
        var p = new DynamicParameters();
        p.Add("@ExaminationId", id);
        p.Add("@ExamName",      dto.ExamName);
        p.Add("@ExamType",      dto.ExamType);
        p.Add("@StartDate",     dto.StartDate);
        p.Add("@EndDate",       dto.EndDate);
        p.Add("@MaxMarks",      dto.MaxMarks);
        p.Add("@PassMarks",     dto.PassMarks);
        p.Add("@UpdatedBy",     updatedBy);
        return ExecuteAsync("usp_Exam_Update", p);
    }

    public Task PublishAsync(int id, bool publish, int updatedBy)
    {
        var p = new DynamicParameters();
        p.Add("@ExaminationId", id);
        p.Add("@IsPublished",   publish);
        p.Add("@UpdatedBy",     updatedBy);
        return ExecuteAsync("usp_Exam_Publish", p);
    }

    public Task SoftDeleteAsync(int id, int deletedBy)
    {
        var p = new DynamicParameters();
        p.Add("@ExaminationId", id);
        p.Add("@DeletedBy",     deletedBy);
        return ExecuteAsync("usp_Exam_SoftDelete", p);
    }

    public async Task<IEnumerable<ExamResultItemDto>> GetResultsAsync(int id)
    {
        var p = new DynamicParameters();
        p.Add("@ExaminationId", id);
        return await QueryAsync<ExamResultItemDto>("usp_Exam_GetResults", p);
    }

    public async Task BulkEnterResultsAsync(
        int examinationId, IEnumerable<ResultRowDto> results, int enteredBy)
    {
        // Build DataTable matching udt_ExamResult
        var dt = new DataTable();
        dt.Columns.Add("StudentId",     typeof(int));
        dt.Columns.Add("SubjectId",     typeof(int));
        dt.Columns.Add("MarksObtained", typeof(decimal));
        dt.Columns.Add("MaxMarks",      typeof(decimal));
        dt.Columns.Add("Remarks",       typeof(string));

        foreach (var r in results)
            dt.Rows.Add(r.StudentId, r.SubjectId, r.MarksObtained, r.MaxMarks,
                        (object?)r.Remarks ?? DBNull.Value);

        var p = new DynamicParameters();
        p.Add("@ExaminationId", examinationId);
        p.Add("@EnteredBy",     enteredBy);
        p.Add("@Results",       dt.AsTableValuedParameter("dbo.udt_ExamResult"));

        await ExecuteAsync("usp_Exam_BulkEnterResults", p);
    }

    public async Task<ReportCardDto> GetReportCardAsync(int examinationId, int studentId)
    {
        var p = new DynamicParameters();
        p.Add("@ExaminationId", examinationId);
        p.Add("@StudentId",     studentId);

        using var multi  = await QueryMultipleAsync("usp_Exam_GetReportCard", p);
        var subjects     = (await multi.ReadAsync<ReportCardSubjectDto>()).ToList();
        var summary      = await multi.ReadFirstOrDefaultAsync<ReportCardSummaryDto>();

        return new ReportCardDto { Subjects = subjects, Summary = summary };
    }

    public async Task<IEnumerable<SubjectDto>> GetAllSubjectsAsync()
        => await QueryAsync<SubjectDto>("usp_Subject_GetAll");

    public async Task<IEnumerable<ClassStudentDto>> GetClassStudentsAsync(int classId)
    {
        var p = new DynamicParameters();
        p.Add("@ClassId", classId);
        return await QueryAsync<ClassStudentDto>("usp_Exam_GetClassStudents", p);
    }
}
