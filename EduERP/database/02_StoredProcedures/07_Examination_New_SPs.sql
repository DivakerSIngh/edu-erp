-- ============================================================
-- Examination Module — New & Updated Stored Procedures
-- Run via: sqlcmd -S "(localdb)\MSSQLLocalDB" -d EduERP -I -i 07_Examination_New_SPs.sql
-- The -I flag ensures QUOTED_IDENTIFIER ON is stored in SP metadata.
-- ============================================================

USE EduERP;
GO

-- ── Recreate existing SPs with correct QUOTED_IDENTIFIER ─────────────────────

CREATE OR ALTER PROCEDURE usp_Exam_GetAll
    @AcademicYearId INT          = NULL,
    @ClassId        INT          = NULL,
    @ExamType       NVARCHAR(20) = NULL,
    @Offset         INT          = 0,
    @Limit          INT          = 20
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        e.ExaminationId,
        e.ExamName,
        e.ExamType,
        e.StartDate,
        e.EndDate,
        e.MaxMarks,
        e.PassMarks,
        e.IsPublished,
        c.ClassName,
        ay.YearName      AS AcademicYear,
        COUNT(1) OVER () AS TotalCount
    FROM  Examinations  e
    JOIN  Classes       c  ON e.ClassId        = c.ClassId
    JOIN  AcademicYears ay ON e.AcademicYearId = ay.AcademicYearId
    WHERE e.IsDeleted       = 0
    AND   (@AcademicYearId IS NULL OR e.AcademicYearId = @AcademicYearId)
    AND   (@ClassId        IS NULL OR e.ClassId        = @ClassId)
    AND   (@ExamType       IS NULL OR e.ExamType       = @ExamType)
    ORDER BY e.StartDate DESC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;
END;
GO

CREATE OR ALTER PROCEDURE usp_Exam_Create
    @ExamName       NVARCHAR(200),
    @ExamType       NVARCHAR(20),
    @ClassId        INT,
    @AcademicYearId INT,
    @StartDate      DATE,
    @EndDate        DATE,
    @MaxMarks       DECIMAL(6,2) = 100,
    @PassMarks      DECIMAL(6,2) = 40,
    @CreatedBy      INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Examinations
        (ExamName, ExamType, ClassId, AcademicYearId, StartDate, EndDate,
         MaxMarks, PassMarks, IsPublished, CreatedAt, CreatedBy, IsDeleted)
    VALUES
        (@ExamName, @ExamType, @ClassId, @AcademicYearId, @StartDate, @EndDate,
         @MaxMarks, @PassMarks, 0, GETUTCDATE(), @CreatedBy, 0);

    SELECT SCOPE_IDENTITY() AS ExaminationId;
END;
GO

CREATE OR ALTER PROCEDURE usp_Exam_BulkEnterResults
    @ExaminationId INT,
    @EnteredBy     INT,
    @Results       dbo.udt_ExamResult READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        MERGE ExamResults AS target
        USING (
            SELECT
                @ExaminationId AS ExaminationId,
                r.StudentId,
                r.SubjectId,
                r.MarksObtained,
                r.MaxMarks,
                r.Remarks
            FROM @Results r
        ) AS source
        ON (
            target.ExaminationId = source.ExaminationId
            AND target.StudentId = source.StudentId
            AND target.SubjectId = source.SubjectId
        )
        WHEN MATCHED THEN
            UPDATE SET
                MarksObtained = source.MarksObtained,
                MaxMarks      = source.MaxMarks,
                Remarks       = source.Remarks,
                UpdatedAt     = GETUTCDATE(),
                UpdatedBy     = @EnteredBy
        WHEN NOT MATCHED THEN
            INSERT (ExaminationId, StudentId, SubjectId, MarksObtained, MaxMarks, Remarks,
                    CreatedAt, CreatedBy, IsDeleted)
            VALUES (source.ExaminationId, source.StudentId, source.SubjectId,
                    source.MarksObtained, source.MaxMarks, source.Remarks,
                    GETUTCDATE(), @EnteredBy, 0);

        COMMIT TRANSACTION;
        SELECT @@ROWCOUNT AS AffectedRows;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE usp_Exam_GetReportCard
    @ExaminationId INT,
    @StudentId     INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Per-subject detail
    SELECT
        e.ExamName,
        e.ExamType,
        sub.SubjectName,
        er.MarksObtained,
        er.MaxMarks,
        CASE WHEN er.MarksObtained >= e.PassMarks THEN 'Pass' ELSE 'Fail' END AS Result,
        er.Remarks,
        er.Grade
    FROM  ExamResults  er
    JOIN  Examinations e   ON er.ExaminationId = e.ExaminationId
    JOIN  Subjects     sub ON er.SubjectId      = sub.SubjectId
    WHERE er.ExaminationId = @ExaminationId
    AND   er.StudentId     = @StudentId
    AND   er.IsDeleted     = 0;

    -- Overall summary
    SELECT
        SUM(er.MarksObtained)                AS TotalMarks,
        SUM(er.MaxMarks)                     AS TotalMaxMarks,
        CAST(
            ROUND(100.0 * SUM(er.MarksObtained) / NULLIF(SUM(er.MaxMarks), 0), 2)
        AS DECIMAL(5,2)) AS Percentage,
        CASE
            WHEN ROUND(100.0 * SUM(er.MarksObtained) / NULLIF(SUM(er.MaxMarks), 0), 2) >= 90 THEN 'A+'
            WHEN ROUND(100.0 * SUM(er.MarksObtained) / NULLIF(SUM(er.MaxMarks), 0), 2) >= 80 THEN 'A'
            WHEN ROUND(100.0 * SUM(er.MarksObtained) / NULLIF(SUM(er.MaxMarks), 0), 2) >= 70 THEN 'B'
            WHEN ROUND(100.0 * SUM(er.MarksObtained) / NULLIF(SUM(er.MaxMarks), 0), 2) >= 60 THEN 'C'
            WHEN ROUND(100.0 * SUM(er.MarksObtained) / NULLIF(SUM(er.MaxMarks), 0), 2) >= 50 THEN 'D'
            ELSE 'F'
        END AS OverallGrade
    FROM  ExamResults er
    WHERE er.ExaminationId = @ExaminationId
    AND   er.StudentId     = @StudentId
    AND   er.IsDeleted     = 0;
END;
GO

-- ── New SPs ──────────────────────────────────────────────────────────────────

CREATE OR ALTER PROCEDURE usp_Exam_GetById
    @ExaminationId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        e.ExaminationId,
        e.ExamName,
        e.ExamType,
        e.StartDate,
        e.EndDate,
        e.MaxMarks,
        e.PassMarks,
        e.IsPublished,
        e.ClassId,
        e.AcademicYearId,
        c.ClassName,
        ay.YearName AS AcademicYear,
        e.CreatedAt
    FROM  Examinations  e
    JOIN  Classes       c  ON e.ClassId        = c.ClassId
    JOIN  AcademicYears ay ON e.AcademicYearId = ay.AcademicYearId
    WHERE e.ExaminationId = @ExaminationId
    AND   e.IsDeleted     = 0;
END;
GO

CREATE OR ALTER PROCEDURE usp_Exam_Update
    @ExaminationId INT,
    @ExamName      NVARCHAR(200) = NULL,
    @ExamType      NVARCHAR(20)  = NULL,
    @StartDate     DATE          = NULL,
    @EndDate       DATE          = NULL,
    @MaxMarks      DECIMAL(6,2)  = NULL,
    @PassMarks     DECIMAL(6,2)  = NULL,
    @UpdatedBy     INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Examinations
    SET
        ExamName  = ISNULL(@ExamName,  ExamName),
        ExamType  = ISNULL(@ExamType,  ExamType),
        StartDate = ISNULL(@StartDate, StartDate),
        EndDate   = ISNULL(@EndDate,   EndDate),
        MaxMarks  = ISNULL(@MaxMarks,  MaxMarks),
        PassMarks = ISNULL(@PassMarks, PassMarks),
        UpdatedAt = GETUTCDATE(),
        UpdatedBy = @UpdatedBy
    WHERE ExaminationId = @ExaminationId
    AND   IsDeleted     = 0;
END;
GO

CREATE OR ALTER PROCEDURE usp_Exam_SoftDelete
    @ExaminationId INT,
    @DeletedBy     INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Examinations
    SET
        IsDeleted = 1,
        UpdatedAt = GETUTCDATE(),
        UpdatedBy = @DeletedBy
    WHERE ExaminationId = @ExaminationId;
END;
GO

CREATE OR ALTER PROCEDURE usp_Exam_Publish
    @ExaminationId INT,
    @IsPublished   BIT,
    @UpdatedBy     INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Examinations
    SET
        IsPublished = @IsPublished,
        UpdatedAt   = GETUTCDATE(),
        UpdatedBy   = @UpdatedBy
    WHERE ExaminationId = @ExaminationId
    AND   IsDeleted     = 0;
END;
GO

CREATE OR ALTER PROCEDURE usp_Exam_GetResults
    @ExaminationId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        er.ResultId,
        er.StudentId,
        u.FullName          AS StudentName,
        s.EnrollmentNumber,
        er.SubjectId,
        sub.SubjectName,
        sub.SubjectCode,
        er.MarksObtained,
        er.MaxMarks,
        er.Grade,
        er.Remarks,
        CASE WHEN er.MarksObtained >= e.PassMarks THEN 'Pass' ELSE 'Fail' END AS Result
    FROM  ExamResults  er
    JOIN  Examinations e   ON er.ExaminationId = e.ExaminationId
    JOIN  Students     s   ON er.StudentId     = s.StudentId
    JOIN  Users        u   ON s.UserId         = u.UserId
    JOIN  Subjects     sub ON er.SubjectId     = sub.SubjectId
    WHERE er.ExaminationId = @ExaminationId
    AND   er.IsDeleted     = 0
    ORDER BY u.FullName, sub.SubjectName;
END;
GO

CREATE OR ALTER PROCEDURE usp_Subject_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        SubjectId,
        SubjectCode,
        SubjectName,
        IsElective
    FROM  Subjects
    WHERE IsDeleted = 0
    ORDER BY SubjectName;
END;
GO

CREATE OR ALTER PROCEDURE usp_Exam_GetClassStudents
    @ClassId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        s.StudentId,
        u.FullName      AS StudentName,
        s.EnrollmentNumber,
        sec.SectionName AS Section
    FROM  Students  s
    JOIN  Users     u   ON s.UserId    = u.UserId
    JOIN  Sections  sec ON s.SectionId = sec.SectionId
    WHERE s.ClassId   = @ClassId
    AND   s.IsDeleted = 0
    AND   s.Status    = 'Active'
    ORDER BY u.FullName;
END;
GO
