-- ============================================================
-- Report Stored Procedures
-- ============================================================

USE EduERP;
GO

-- ---------------------------------------------------------------------------
-- 1. Student Strength Report  — enrollment count by class/section/gender
-- ---------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_Report_StudentStrength
    @AcademicYearId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.ClassId,
        c.ClassName,
        s.SectionId,
        s.SectionName,
        st.Gender,
        COUNT(st.StudentId) AS StudentCount
    FROM  Students      st
    JOIN  Classes       c  ON st.ClassId        = c.ClassId
    JOIN  Sections      s  ON st.SectionId      = s.SectionId
    JOIN  AcademicYears ay ON st.AcademicYearId = ay.AcademicYearId
    WHERE st.IsDeleted            = 0
      AND st.Status               = 'Active'
      AND (@AcademicYearId IS NULL OR st.AcademicYearId = @AcademicYearId)
    GROUP BY c.ClassId, c.ClassName, s.SectionId, s.SectionName, st.Gender
    ORDER BY c.ClassName, s.SectionName, st.Gender;
END;
GO

-- ---------------------------------------------------------------------------
-- 2. Low Attendance Alert  — students whose attendance % < threshold
-- ---------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_Report_LowAttendance
    @ClassId       INT,
    @Month         INT,
    @Year          INT,
    @ThresholdPct  DECIMAL(5,2) = 75.0
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        st.StudentId,
        st.EnrollmentNumber,
        CONCAT(st.FirstName, ' ', st.LastName) AS StudentName,
        c.ClassName,
        sec.SectionName,
        SUM(CASE WHEN ar.Status = 'Present' THEN 1 ELSE 0 END) AS PresentDays,
        SUM(CASE WHEN ar.Status = 'Late'    THEN 1 ELSE 0 END) AS LateDays,
        COUNT(ar.AttendanceId) AS TotalDays,
        CAST(
            CASE
                WHEN COUNT(ar.AttendanceId) = 0 THEN 0
                ELSE ROUND(
                    100.0 * SUM(CASE WHEN ar.Status IN ('Present','Late') THEN 1 ELSE 0 END)
                    / COUNT(ar.AttendanceId), 2)
            END AS DECIMAL(5,2)
        ) AS AttendancePct
    FROM  Students          st
    JOIN  Classes           c   ON st.ClassId   = c.ClassId
    JOIN  Sections          sec ON st.SectionId = sec.SectionId
    LEFT JOIN AttendanceRecords ar
           ON  ar.StudentId = st.StudentId
           AND MONTH(ar.AttendanceDate) = @Month
           AND YEAR(ar.AttendanceDate)  = @Year
    WHERE st.IsDeleted = 0
      AND st.Status    = 'Active'
      AND st.ClassId   = @ClassId
    GROUP BY
        st.StudentId, st.EnrollmentNumber,
        st.FirstName, st.LastName,
        c.ClassName, sec.SectionName
    HAVING
        CASE
            WHEN COUNT(ar.AttendanceId) = 0 THEN 0
            ELSE ROUND(
                100.0 * SUM(CASE WHEN ar.Status IN ('Present','Late') THEN 1 ELSE 0 END)
                / COUNT(ar.AttendanceId), 2)
        END < @ThresholdPct
    ORDER BY AttendancePct ASC;
END;
GO

-- ---------------------------------------------------------------------------
-- 3. Individual Report Card  — all exam results for one student in an AY
-- ---------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_Report_IndividualReportCard
    @StudentId      INT,
    @AcademicYearId INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Student header info
    SELECT
        st.StudentId,
        st.EnrollmentNumber,
        CONCAT(st.FirstName, ' ', st.LastName) AS StudentName,
        c.ClassName,
        sec.SectionName,
        ay.YearName AS AcademicYear
    FROM  Students      st
    JOIN  Classes       c   ON st.ClassId        = c.ClassId
    JOIN  Sections      sec ON st.SectionId      = sec.SectionId
    JOIN  AcademicYears ay  ON st.AcademicYearId = ay.AcademicYearId
    WHERE st.StudentId = @StudentId
      AND st.IsDeleted = 0;

    -- All exam results
    SELECT
        e.ExaminationId,
        e.ExamName,
        e.ExamType,
        e.StartDate,
        sub.SubjectName,
        sub.SubjectCode,
        er.MarksObtained,
        e.MaxMarks,
        e.PassMarks,
        er.Grade,
        CASE WHEN er.MarksObtained >= e.PassMarks THEN 'Pass' ELSE 'Fail' END AS Result
    FROM  ExamResults   er
    JOIN  Examinations  e   ON er.ExaminationId = e.ExaminationId
    JOIN  Subjects      sub ON er.SubjectId     = sub.SubjectId
    WHERE er.StudentId      = @StudentId
      AND e.AcademicYearId  = @AcademicYearId
      AND e.IsDeleted        = 0
      AND e.IsPublished      = 1
    ORDER BY e.StartDate, e.ExamType, sub.SubjectName;
END;
GO

-- ---------------------------------------------------------------------------
-- 4. Subject Performance  — average marks & pass rate per subject across classes
-- ---------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_Report_SubjectPerformance
    @AcademicYearId INT,
    @SubjectId      INT = NULL,
    @ClassId        INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        sub.SubjectId,
        sub.SubjectName,
        sub.SubjectCode,
        c.ClassName,
        COUNT(DISTINCT er.StudentId)                                                AS TotalStudents,
        CAST(ROUND(AVG(CAST(er.MarksObtained AS FLOAT)), 2) AS DECIMAL(8,2))       AS AvgMarks,
        MAX(e.MaxMarks)                                                             AS MaxMarks,
        CAST(ROUND(AVG(CAST(er.MarksObtained AS FLOAT)) * 100.0
              / NULLIF(MAX(e.MaxMarks), 0), 2) AS DECIMAL(5,2))                    AS AvgPct,
        SUM(CASE WHEN er.MarksObtained >= e.PassMarks THEN 1 ELSE 0 END)           AS PassCount,
        SUM(CASE WHEN er.MarksObtained <  e.PassMarks THEN 1 ELSE 0 END)           AS FailCount,
        CAST(ROUND(
            100.0 * SUM(CASE WHEN er.MarksObtained >= e.PassMarks THEN 1 ELSE 0 END)
            / NULLIF(COUNT(er.ResultId), 0), 2) AS DECIMAL(5,2))              AS PassRate
    FROM  ExamResults   er
    JOIN  Examinations  e   ON er.ExaminationId = e.ExaminationId
    JOIN  Subjects      sub ON er.SubjectId     = sub.SubjectId
    JOIN  Classes       c   ON e.ClassId        = c.ClassId
    WHERE e.AcademicYearId = @AcademicYearId
      AND e.IsDeleted       = 0
      AND e.IsPublished      = 1
      AND (@SubjectId IS NULL OR sub.SubjectId = @SubjectId)
      AND (@ClassId   IS NULL OR e.ClassId     = @ClassId)
    GROUP BY sub.SubjectId, sub.SubjectName, sub.SubjectCode, c.ClassName
    ORDER BY sub.SubjectName, c.ClassName;
END;
GO

-- ---------------------------------------------------------------------------
-- 5. Payment History  — range-based fee payments with student and class info
-- ---------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_Report_PaymentHistory
    @FromDate DATE,
    @ToDate   DATE,
    @ClassId  INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        fp.PaymentId,
        fp.ReceiptNumber,
        fp.PaymentDate,
        fp.AmountPaid,
        fp.PaymentMethod,
        fi.InvoiceNumber,
        fs.FeeName,
        st.StudentId,
        st.EnrollmentNumber,
        CONCAT(st.FirstName, ' ', st.LastName) AS StudentName,
        c.ClassName,
        sec.SectionName,
        ay.YearName AS AcademicYear
    FROM  FeePayments    fp
    JOIN  FeeInvoices    fi  ON fp.InvoiceId       = fi.InvoiceId
    JOIN  FeeStructures  fs  ON fi.FeeStructureId  = fs.FeeStructureId
    JOIN  Students       st  ON fi.StudentId       = st.StudentId
    JOIN  Classes        c   ON st.ClassId         = c.ClassId
    JOIN  Sections       sec ON st.SectionId       = sec.SectionId
    JOIN  AcademicYears  ay  ON st.AcademicYearId  = ay.AcademicYearId
    WHERE fp.PaymentDate BETWEEN @FromDate AND @ToDate
      AND st.IsDeleted   = 0
      AND (@ClassId IS NULL OR st.ClassId = @ClassId)
    ORDER BY fp.PaymentDate DESC, fp.PaymentId DESC;
END;
GO

-- ---------------------------------------------------------------------------
-- 6. Admission Statistics — applications grouped by status and academic year
-- ---------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_Report_AdmissionStats
    @AcademicYearId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ay.AcademicYearId,
        ay.YearName,
        aa.Status,
        COUNT(aa.ApplicationId)  AS ApplicationCount,
        SUM(CASE WHEN aa.ConvertedStudentId IS NOT NULL THEN 1 ELSE 0 END) AS ConvertedCount
    FROM  AdmissionApplications aa
    JOIN  AcademicYears         ay ON aa.AcademicYearId = ay.AcademicYearId
    WHERE aa.IsDeleted = 0
      AND (@AcademicYearId IS NULL OR aa.AcademicYearId = @AcademicYearId)
    GROUP BY ay.AcademicYearId, ay.YearName, aa.Status
    ORDER BY ay.YearName DESC, aa.Status;
END;
GO

-- ---------------------------------------------------------------------------
-- 7. Student Directory — filterable list for printing/export
-- ---------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_Report_StudentDirectory
    @AcademicYearId INT          = NULL,
    @ClassId        INT          = NULL,
    @SectionId      INT          = NULL,
    @Gender         NVARCHAR(10) = NULL,
    @Status         NVARCHAR(20) = NULL   -- Active | Inactive | Graduated | Transferred
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        st.StudentId,
        st.EnrollmentNumber,
        CONCAT(st.FirstName, ' ', st.LastName)  AS StudentName,
        st.Gender,
        st.DateOfBirth,
        st.Email,
        st.Phone,
        st.Status,
        c.ClassName,
        sec.SectionName,
        ay.YearName AS AcademicYear,
        st.AdmissionDate
    FROM  Students      st
    JOIN  Classes       c   ON st.ClassId        = c.ClassId
    JOIN  Sections      sec ON st.SectionId      = sec.SectionId
    JOIN  AcademicYears ay  ON st.AcademicYearId = ay.AcademicYearId
    WHERE st.IsDeleted = 0
      AND (@AcademicYearId IS NULL OR st.AcademicYearId = @AcademicYearId)
      AND (@ClassId        IS NULL OR st.ClassId        = @ClassId)
      AND (@SectionId      IS NULL OR st.SectionId      = @SectionId)
      AND (@Gender         IS NULL OR st.Gender         = @Gender)
      AND (@Status         IS NULL OR st.Status         = @Status)
    ORDER BY c.ClassName, sec.SectionName, st.FirstName, st.LastName;
END;
GO
