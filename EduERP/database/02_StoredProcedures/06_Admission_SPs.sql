-- ============================================================
-- Admission Stored Procedures
-- ============================================================

USE EduERP;
GO

-- -- usp_AcademicYear_GetAll ---------------------------------------------------
CREATE OR ALTER PROCEDURE usp_AcademicYear_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT AcademicYearId, YearName, IsCurrent
    FROM   AcademicYears
    WHERE  IsDeleted = 0
    ORDER BY StartDate DESC;
END;
GO

-- -- usp_Class_GetByAcademicYear ------------------------------------------------
CREATE OR ALTER PROCEDURE usp_Class_GetByAcademicYear
    @AcademicYearId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ClassId, ClassName, GradeLevel
    FROM   Classes
    WHERE  AcademicYearId = @AcademicYearId
    AND    IsDeleted = 0
    ORDER BY GradeLevel, ClassName;
END;
GO

-- -- usp_Section_GetByClass ----------------------------------------------------
CREATE OR ALTER PROCEDURE usp_Section_GetByClass
    @ClassId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT SectionId, SectionName, Capacity
    FROM   Sections
    WHERE  ClassId   = @ClassId
    AND    IsDeleted = 0
    ORDER BY SectionName;
END;
GO

-- -- usp_Admission_GetAll ------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_Admission_GetAll
    @AcademicYearId INT           = NULL,
    @ClassId        INT           = NULL,
    @Status         NVARCHAR(20)  = NULL,
    @Search         NVARCHAR(100) = NULL,
    @Offset         INT           = 0,
    @Limit          INT           = 20
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        aa.ApplicationId,
        aa.ReferenceNumber,
        aa.ApplicantName,
        aa.ParentEmail,
        aa.ParentPhone,
        aa.DateOfBirth,
        aa.Gender,
        aa.ApplyingForClass,
        aa.ClassId,
        c.ClassName,
        aa.AcademicYearId,
        ay.YearName     AS AcademicYear,
        aa.Status,
        aa.CreatedAt    AS AppliedAt,
        aa.ReviewedAt,
        aa.ReviewedBy,
        COUNT(1) OVER() AS TotalCount
    FROM  AdmissionApplications aa
    LEFT JOIN Classes      c  ON aa.ClassId        = c.ClassId
    JOIN      AcademicYears ay ON aa.AcademicYearId = ay.AcademicYearId
    WHERE aa.IsDeleted       = 0
    AND   (@AcademicYearId  IS NULL OR aa.AcademicYearId = @AcademicYearId)
    AND   (@ClassId         IS NULL OR aa.ClassId        = @ClassId)
    AND   (@Status          IS NULL OR aa.Status         = @Status)
    AND   (@Search          IS NULL
           OR aa.ApplicantName LIKE '%' + @Search + '%'
           OR aa.ParentEmail   LIKE '%' + @Search + '%')
    ORDER BY aa.CreatedAt DESC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;
END;
GO

-- -- usp_Admission_Submit ------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_Admission_Submit
    @ApplicantName   NVARCHAR(200),
    @DateOfBirth     DATE,
    @Gender          NVARCHAR(10),
    @ApplyingForClass NVARCHAR(100),
    @AcademicYearId  INT,
    @ClassId         INT           = NULL,
    @ParentName      NVARCHAR(200),
    @ParentEmail     NVARCHAR(256),
    @ParentPhone     NVARCHAR(20),
    @PreviousSchool  NVARCHAR(300) = NULL,
    @CreatedBy       INT           = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Prevent duplicate application (same parent email + class + academic year)
    IF EXISTS (
        SELECT 1
        FROM   AdmissionApplications
        WHERE  ParentEmail      = @ParentEmail
        AND    AcademicYearId   = @AcademicYearId
        AND    ISNULL(ClassId, 0) = ISNULL(@ClassId, 0)
        AND    Status          <> 'Rejected'
        AND    IsDeleted        = 0
    )
    BEGIN
        RAISERROR('An active application already exists for this email and class.', 16, 1);
        RETURN;
    END;

    -- Generate unique reference number
    DECLARE @RefNumber NVARCHAR(30) =
        'ADM-' + CAST(YEAR(GETDATE()) AS NVARCHAR(4))
        + '-' + RIGHT('000000' + CAST(
            (SELECT ISNULL(MAX(ApplicationId), 0) + 1 FROM AdmissionApplications)
        AS NVARCHAR(6)), 6);

    INSERT INTO AdmissionApplications
        (ReferenceNumber, ApplicantName, DateOfBirth, Gender, ApplyingForClass,
         AcademicYearId, ClassId, ParentName, ParentEmail, ParentPhone,
         PreviousSchool, Status, CreatedAt, CreatedBy, IsDeleted)
    VALUES
        (@RefNumber, @ApplicantName, @DateOfBirth, @Gender, @ApplyingForClass,
         @AcademicYearId, @ClassId, @ParentName, @ParentEmail, @ParentPhone,
         @PreviousSchool, 'Pending', GETUTCDATE(), ISNULL(@CreatedBy, 0), 0);

    SELECT SCOPE_IDENTITY() AS ApplicationId, @RefNumber AS ReferenceNumber;
END;
GO

-- -- usp_Admission_UpdateStatus ------------------------------------------------
CREATE OR ALTER PROCEDURE usp_Admission_UpdateStatus
    @ApplicationId INT,
    @Status        NVARCHAR(20),   -- 'Reviewed','Accepted','Rejected'
    @Remarks       NVARCHAR(1000) = NULL,
    @ReviewedBy    INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM AdmissionApplications WHERE ApplicationId = @ApplicationId AND IsDeleted = 0)
    BEGIN
        RAISERROR('Application not found.', 16, 1);
        RETURN;
    END;

    UPDATE AdmissionApplications
    SET    Status      = @Status,
           Remarks     = @Remarks,
           ReviewedAt  = GETUTCDATE(),
           ReviewedBy  = @ReviewedBy,
           UpdatedAt   = GETUTCDATE(),
           UpdatedBy   = @ReviewedBy
    WHERE  ApplicationId = @ApplicationId;

    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

-- -- usp_Admission_ConvertToStudent --------------------------------------------
-- Approved application ? create User + Student records atomically
CREATE OR ALTER PROCEDURE usp_Admission_ConvertToStudent
    @ApplicationId  INT,
    @ClassId        INT,
    @SectionId      INT,
    @PasswordHash   NVARCHAR(512),   -- Argon2id hash of temporary password
    @ConvertedBy    INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @ApplicantName  NVARCHAR(200);
        DECLARE @ParentEmail    NVARCHAR(256);
        DECLARE @ParentPhone    NVARCHAR(20);
        DECLARE @DateOfBirth    DATE;
        DECLARE @Gender         NVARCHAR(10);
        DECLARE @AcademicYearId INT;
        DECLARE @Status         NVARCHAR(20);

        SELECT
            @ApplicantName  = aa.ApplicantName,
            @ParentEmail    = aa.ParentEmail,
            @ParentPhone    = aa.ParentPhone,
            @DateOfBirth    = aa.DateOfBirth,
            @Gender         = aa.Gender,
            @AcademicYearId = aa.AcademicYearId,
            @Status         = aa.Status
        FROM AdmissionApplications aa
        WHERE aa.ApplicationId = @ApplicationId AND aa.IsDeleted = 0;

        IF @ApplicantName IS NULL
        BEGIN
            RAISERROR('Application not found.', 16, 1);
            RETURN;
        END;

        IF @Status <> 'Accepted'
        BEGIN
            RAISERROR('Only accepted applications can be converted to students.', 16, 1);
            RETURN;
        END;

        IF EXISTS (SELECT 1 FROM Users WHERE Email = @ParentEmail AND IsDeleted = 0)
        BEGIN
            RAISERROR('A user with this email already exists.', 16, 1);
            RETURN;
        END;

        -- Create user account for the student
        INSERT INTO Users (FullName, Email, PasswordHash, Role, IsActive, CreatedAt, CreatedBy, IsDeleted)
        VALUES (@ApplicantName, @ParentEmail, @PasswordHash, 'Student', 1, GETUTCDATE(), @ConvertedBy, 0);

        DECLARE @NewUserId INT = SCOPE_IDENTITY();

        -- Generate enrollment number
        DECLARE @Seq INT;
        SELECT @Seq = ISNULL(MAX(CAST(SUBSTRING(EnrollmentNumber, 10, 5) AS INT)), 0) + 1
        FROM   Students WHERE AcademicYearId = @AcademicYearId;

        DECLARE @EnrollmentNumber NVARCHAR(20) =
            'ENR-' + CAST(YEAR(GETDATE()) AS NVARCHAR(4))
            + '-' + RIGHT('00000' + CAST(@Seq AS NVARCHAR(5)), 5);

        INSERT INTO Students
            (UserId, EnrollmentNumber, DateOfBirth, Gender, Phone,
             ClassId, SectionId, AcademicYearId, Status, AdmissionDate,
             CreatedAt, CreatedBy, IsDeleted)
        VALUES
            (@NewUserId, @EnrollmentNumber, @DateOfBirth, @Gender, @ParentPhone,
             @ClassId, @SectionId, @AcademicYearId, 'Active', CAST(GETDATE() AS DATE),
             GETUTCDATE(), @ConvertedBy, 0);

        DECLARE @NewStudentId INT = SCOPE_IDENTITY();

        -- Mark application as Enrolled
        UPDATE AdmissionApplications
        SET    Status             = 'Enrolled',
               ConvertedAt        = GETUTCDATE(),
               ConvertedStudentId = @NewStudentId,
               UpdatedAt          = GETUTCDATE(),
               UpdatedBy          = @ConvertedBy
        WHERE  ApplicationId      = @ApplicationId;

        COMMIT TRANSACTION;
        SELECT @NewStudentId AS StudentId, @EnrollmentNumber AS EnrollmentNumber;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

-- -- usp_Admission_GetById ----------------------------------------------------
CREATE OR ALTER PROCEDURE usp_Admission_GetById
    @ApplicationId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        aa.ApplicationId,
        aa.ReferenceNumber,
        aa.ApplicantName,
        aa.ParentName,
        aa.ParentEmail,
        aa.ParentPhone,
        aa.DateOfBirth,
        aa.Gender,
        aa.ApplyingForClass,
        aa.ClassId,
        c.ClassName,
        aa.AcademicYearId,
        ay.YearName       AS AcademicYear,
        aa.Status,
        aa.Remarks,
        aa.PreviousSchool,
        aa.ReviewedBy,
        aa.ReviewedAt,
        aa.ConvertedAt,
        aa.ConvertedStudentId,
        aa.CreatedAt      AS AppliedAt
    FROM  AdmissionApplications aa
    LEFT JOIN Classes       c  ON aa.ClassId        = c.ClassId
    JOIN      AcademicYears ay ON aa.AcademicYearId = ay.AcademicYearId
    WHERE aa.ApplicationId = @ApplicationId
    AND   aa.IsDeleted     = 0;
END;
GO

-- -- usp_AcademicYear_GetAll ---------------------------------------------------
CREATE OR ALTER PROCEDURE usp_AcademicYear_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT AcademicYearId, YearName, IsCurrent
    FROM   AcademicYears
    WHERE  IsDeleted = 0
    ORDER  BY AcademicYearId DESC;
END;
GO
