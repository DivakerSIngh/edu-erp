-- ============================================================
-- Examination Stored Procedures
-- ============================================================

USE EduERP;
GO

-- -- usp_Exam_GetAll -----------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_Exam_GetAll
    @AcademicYearId INT          = NULL,
    @ClassId        INT          = NULL,
    @ExamType       NVARCHAR(20) = NULL,   -- 'Unit','MidTerm','Final','Remedial'
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

-- -- usp_Exam_Create -----------------------------------------------------------
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

-- -- TYPE: udt_ExamResult ------------------------------------------------------
IF TYPE_ID('dbo.udt_ExamResult') IS NULL
    CREATE TYPE dbo.udt_ExamResult AS TABLE
    (
        StudentId     INT             NOT NULL,
        SubjectId     INT             NOT NULL,
        MarksObtained DECIMAL(6,2)    NOT NULL,
        MaxMarks      DECIMAL(6,2)    NOT NULL DEFAULT 100,
        Remarks       NVARCHAR(200)   NULL
    );
GO

-- -- usp_Exam_BulkEnterResults -------------------------------------------------
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

-- -- usp_Exam_GetReportCard -----------------------------------------------------
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
