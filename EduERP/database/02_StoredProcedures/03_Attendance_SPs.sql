-- ============================================================
-- Attendance Stored Procedures
-- ============================================================

USE EduERP;
GO

-- ── TYPE: udt_AttendanceRecord ───────────────────────────────────────────────
-- Table-Valued Parameter type for bulk insert
IF TYPE_ID('dbo.udt_AttendanceRecord') IS NULL
    CREATE TYPE dbo.udt_AttendanceRecord AS TABLE
    (
        StudentId INT            NOT NULL,
        Status    NVARCHAR(10)   NOT NULL,  -- 'Present','Absent','Leave','Late'
        Remarks   NVARCHAR(200)  NULL
    );
GO

-- ── usp_Attendance_BulkMark ──────────────────────────────────────────────────
-- Teacher marks attendance for an entire class in one call
CREATE OR ALTER PROCEDURE usp_Attendance_BulkMark
    @ClassId        INT,
    @SectionId      INT,
    @SubjectId      INT           = NULL,
    @AttendanceDate DATE,
    @Period         TINYINT       = NULL,   -- NULL = full-day
    @MarkedBy       INT,
    @Records        dbo.udt_AttendanceRecord READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Prevent duplicate marking for same class/date/period
        IF EXISTS (
            SELECT 1
            FROM   AttendanceRecords ar
            JOIN   Students s ON ar.StudentId = s.StudentId
            WHERE  s.ClassId        = @ClassId
            AND    s.SectionId      = @SectionId
            AND    ar.AttendanceDate = @AttendanceDate
            AND    ar.Period         = ISNULL(@Period, 0)
            AND    ar.IsDeleted      = 0
        )
        BEGIN
            RAISERROR('Attendance already marked for this class, date and period.', 16, 1);
            RETURN;
        END;

        INSERT INTO AttendanceRecords
            (StudentId, ClassId, SectionId, SubjectId, AttendanceDate,
             Period, Status, Remarks, MarkedBy, CreatedAt, CreatedBy, IsDeleted)
        SELECT
            r.StudentId,
            @ClassId,
            @SectionId,
            @SubjectId,
            @AttendanceDate,
            ISNULL(@Period, 0),
            r.Status,
            r.Remarks,
            @MarkedBy,
            GETUTCDATE(),
            @MarkedBy,
            0
        FROM @Records r;

        COMMIT TRANSACTION;

        SELECT @@ROWCOUNT AS MarkedCount;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

-- ── usp_Attendance_GetByClass ─────────────────────────────────────────────────
-- Monthly view for teacher dashboard; returns student × day grid
CREATE OR ALTER PROCEDURE usp_Attendance_GetByClass
    @ClassId   INT,
    @SectionId INT,
    @Month     TINYINT,
    @Year      SMALLINT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @StartDate DATE = DATEFROMPARTS(@Year, @Month, 1);
    DECLARE @EndDate   DATE = EOMONTH(@StartDate);

    SELECT
        ar.StudentId,
        u.FullName     AS StudentName,
        s.EnrollmentNumber,
        ar.AttendanceDate,
        ar.Period,
        ar.Status,
        ar.Remarks
    FROM  AttendanceRecords ar
    JOIN  Students          s  ON ar.StudentId = s.StudentId
    JOIN  Users             u  ON s.UserId     = u.UserId
    WHERE ar.ClassId        = @ClassId
    AND   ar.SectionId      = @SectionId
    AND   ar.AttendanceDate BETWEEN @StartDate AND @EndDate
    AND   ar.IsDeleted      = 0
    ORDER BY u.FullName, ar.AttendanceDate, ar.Period;
END;
GO

-- ── usp_Attendance_GetByStudent ───────────────────────────────────────────────
-- Used by student portal and parent portal
CREATE OR ALTER PROCEDURE usp_Attendance_GetByStudent
    @StudentId INT,
    @FromDate  DATE,
    @ToDate    DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Detail rows
    SELECT
        ar.AttendanceId,
        ar.AttendanceDate,
        ar.Period,
        ar.Status,
        ar.Remarks,
        sub.SubjectName
    FROM  AttendanceRecords ar
    LEFT JOIN Subjects sub ON ar.SubjectId = sub.SubjectId
    WHERE ar.StudentId  = @StudentId
    AND   ar.AttendanceDate BETWEEN @FromDate AND @ToDate
    AND   ar.IsDeleted  = 0
    ORDER BY ar.AttendanceDate, ar.Period;

    -- Summary (second result set)
    SELECT
        COUNT(*)                                         AS TotalDays,
        SUM(CASE WHEN ar.Status = 'Present' THEN 1 ELSE 0 END) AS PresentDays,
        SUM(CASE WHEN ar.Status = 'Absent'  THEN 1 ELSE 0 END) AS AbsentDays,
        SUM(CASE WHEN ar.Status = 'Leave'   THEN 1 ELSE 0 END) AS LeaveDays,
        SUM(CASE WHEN ar.Status = 'Late'    THEN 1 ELSE 0 END) AS LateDays,
        CAST(
            ROUND(
                100.0 * SUM(CASE WHEN ar.Status = 'Present' THEN 1 ELSE 0 END)
                / NULLIF(COUNT(*), 0),
            2)
        AS DECIMAL(5,2)) AS AttendancePercentage
    FROM  AttendanceRecords ar
    WHERE ar.StudentId  = @StudentId
    AND   ar.AttendanceDate BETWEEN @FromDate AND @ToDate
    AND   ar.IsDeleted  = 0;
END;
GO

-- ── usp_Attendance_UpdateSingle ──────────────────────────────────────────────
-- Correct a single attendance record
CREATE OR ALTER PROCEDURE usp_Attendance_UpdateSingle
    @AttendanceId INT,
    @Status       NVARCHAR(10),
    @Remarks      NVARCHAR(200) = NULL,
    @UpdatedBy    INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE AttendanceRecords
    SET    Status    = @Status,
           Remarks   = @Remarks,
           UpdatedAt = GETUTCDATE(),
           UpdatedBy = @UpdatedBy
    WHERE  AttendanceId = @AttendanceId
    AND    IsDeleted    = 0;

    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO
