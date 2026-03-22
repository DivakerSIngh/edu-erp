-- ============================================================
-- Student Stored Procedures
-- ============================================================

USE EduERP;
GO

-- ── usp_Student_GetAll ───────────────────────────────────────────────────────
-- Paged, filterable list used by StudentController GET /students
CREATE OR ALTER PROCEDURE usp_Student_GetAll
    @Search         NVARCHAR(100) = NULL,   -- name or enrollment number
    @ClassId        INT           = NULL,
    @SectionId      INT           = NULL,
    @AcademicYearId INT           = NULL,
    @Status         NVARCHAR(20)  = NULL,   -- 'Active','Inactive','Graduated'
    @Offset         INT           = 0,
    @Limit          INT           = 20
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        s.StudentId,
        s.EnrollmentNumber,
        u.FullName,
        u.Email,
        s.DateOfBirth,
        s.Gender,
        s.Status,
        c.ClassName,
        sec.SectionName,
        ay.YearName         AS AcademicYear,
        s.AdmissionDate,
        s.Phone,
        COUNT(1) OVER ()    AS TotalCount   -- window function → single query for total
    FROM  Students s
    JOIN  Users    u   ON s.UserId         = u.UserId
    JOIN  Classes  c   ON s.ClassId        = c.ClassId
    JOIN  Sections sec ON s.SectionId      = sec.SectionId
    JOIN  AcademicYears ay ON s.AcademicYearId = ay.AcademicYearId
    WHERE s.IsDeleted       = 0
    AND   u.IsDeleted       = 0
    AND   (@ClassId        IS NULL OR s.ClassId        = @ClassId)
    AND   (@SectionId      IS NULL OR s.SectionId      = @SectionId)
    AND   (@AcademicYearId IS NULL OR s.AcademicYearId = @AcademicYearId)
    AND   (@Status         IS NULL OR s.Status         = @Status)
    AND   (@Search         IS NULL
           OR u.FullName          LIKE '%' + @Search + '%'
           OR s.EnrollmentNumber  LIKE '%' + @Search + '%')
    ORDER BY u.FullName
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;
END;
GO

-- ── usp_Student_GetById ──────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE usp_Student_GetById
    @StudentId INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Main record
    SELECT
        s.StudentId,
        s.EnrollmentNumber,
        u.UserId,
        u.FullName,
        u.Email,
        s.DateOfBirth,
        s.Gender,
        s.BloodGroup,
        s.Address,
        s.Phone,
        s.ProfileImagePath,
        s.Status,
        s.AdmissionDate,
        s.ClassId,
        c.ClassName,
        s.SectionId,
        sec.SectionName,
        s.AcademicYearId,
        ay.YearName AS AcademicYear,
        s.CreatedAt,
        s.UpdatedAt
    FROM  Students s
    JOIN  Users       u   ON s.UserId         = u.UserId
    JOIN  Classes     c   ON s.ClassId        = c.ClassId
    JOIN  Sections    sec ON s.SectionId      = sec.SectionId
    JOIN  AcademicYears ay ON s.AcademicYearId = ay.AcademicYearId
    WHERE s.StudentId = @StudentId
    AND   s.IsDeleted = 0;

    -- Parents (second result set)
    SELECT
        p.ParentId,
        pu.FullName,
        pu.Email,
        p.Phone,
        spm.Relationship
    FROM  StudentParentMap spm
    JOIN  Parents p   ON spm.ParentId = p.ParentId
    JOIN  Users   pu  ON p.UserId     = pu.UserId
    WHERE spm.StudentId = @StudentId
    AND   spm.IsDeleted = 0;
END;
GO

-- ── usp_Student_Create ───────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE usp_Student_Create
    @FullName         NVARCHAR(200),
    @Email            NVARCHAR(256),
    @PasswordHash     NVARCHAR(512),
    @DateOfBirth      DATE,
    @Gender           NVARCHAR(10),
    @BloodGroup       NVARCHAR(5)   = NULL,
    @Address          NVARCHAR(500) = NULL,
    @PhoneNumber      NVARCHAR(20)  = NULL,
    @ClassId          INT,
    @SectionId        INT,
    @AcademicYearId   INT,
    @AdmissionDate    DATE,
    @CreatedBy        INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Check for duplicate email
        IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email AND IsDeleted = 0)
        BEGIN
            RAISERROR('A user with this email already exists.', 16, 1);
            RETURN;
        END;

        -- 1. Create user account
        INSERT INTO Users (FullName, Email, PasswordHash, Role, IsActive, CreatedAt, CreatedBy, IsDeleted)
        VALUES (@FullName, @Email, @PasswordHash, 'Student', 1, GETUTCDATE(), @CreatedBy, 0);

        DECLARE @NewUserId INT = SCOPE_IDENTITY();

        -- 2. Generate enrollment number: ENR-{Year}-{5-digit sequence}
        DECLARE @EnrollmentNumber NVARCHAR(20);
        DECLARE @Seq INT;

        SELECT @Seq = ISNULL(MAX(CAST(SUBSTRING(EnrollmentNumber, 10, 5) AS INT)), 0) + 1
        FROM   Students
        WHERE  AcademicYearId = @AcademicYearId;

        SET @EnrollmentNumber = 'ENR-' + CAST(YEAR(GETDATE()) AS NVARCHAR(4))
                              + '-' + RIGHT('00000' + CAST(@Seq AS NVARCHAR(5)), 5);

        -- 3. Create student record
        INSERT INTO Students
            (UserId, EnrollmentNumber, DateOfBirth, Gender, BloodGroup, Address,
             Phone, ClassId, SectionId, AcademicYearId, Status, AdmissionDate,
             CreatedAt, CreatedBy, IsDeleted)
        VALUES
            (@NewUserId, @EnrollmentNumber, @DateOfBirth, @Gender, @BloodGroup, @Address,
             @PhoneNumber, @ClassId, @SectionId, @AcademicYearId, 'Active', @AdmissionDate,
             GETUTCDATE(), @CreatedBy, 0);

        DECLARE @NewStudentId INT = SCOPE_IDENTITY();

        COMMIT TRANSACTION;

        -- Return the new IDs
        SELECT @NewStudentId AS StudentId, @EnrollmentNumber AS EnrollmentNumber;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

-- ── usp_Student_Update ───────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE usp_Student_Update
    @StudentId      INT,
    @FullName       NVARCHAR(200),
    @DateOfBirth    DATE,
    @Gender         NVARCHAR(10),
    @BloodGroup     NVARCHAR(5)   = NULL,
    @Address        NVARCHAR(500) = NULL,
    @PhoneNumber    NVARCHAR(20)  = NULL,
    @ClassId        INT,
    @SectionId      INT,
    @Status         NVARCHAR(20),
    @UpdatedBy      INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Guard: student must exist
        IF NOT EXISTS (SELECT 1 FROM Students WHERE StudentId = @StudentId AND IsDeleted = 0)
        BEGIN
            RAISERROR('Student not found.', 16, 1);
            RETURN;
        END;

        -- Fetch UserId for user-table update
        DECLARE @UserId INT;
        SELECT @UserId = UserId FROM Students WHERE StudentId = @StudentId;

        UPDATE Users
        SET    FullName   = @FullName,
               UpdatedAt  = GETUTCDATE(),
               UpdatedBy  = @UpdatedBy
        WHERE  UserId     = @UserId;

        UPDATE Students
        SET    DateOfBirth = @DateOfBirth,
               Gender      = @Gender,
               BloodGroup  = @BloodGroup,
               Address     = @Address,
               Phone       = @PhoneNumber,
               ClassId     = @ClassId,
               SectionId   = @SectionId,
               Status      = @Status,
               UpdatedAt   = GETUTCDATE(),
               UpdatedBy   = @UpdatedBy
        WHERE  StudentId   = @StudentId;

        COMMIT TRANSACTION;

        SELECT @@ROWCOUNT AS RowsAffected;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

-- ── usp_Student_SoftDelete ───────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE usp_Student_SoftDelete
    @StudentId INT,
    @DeletedBy INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM Students WHERE StudentId = @StudentId AND IsDeleted = 0)
        BEGIN
            RAISERROR('Student not found.', 16, 1);
            RETURN;
        END;

        DECLARE @UserId INT;
        SELECT @UserId = UserId FROM Students WHERE StudentId = @StudentId;

        UPDATE Students
        SET    IsDeleted  = 1,
               DeletedAt  = GETUTCDATE(),
               DeletedBy  = @DeletedBy
        WHERE  StudentId  = @StudentId;

        UPDATE Users
        SET    IsDeleted   = 1,
               IsActive    = 0,
               DeletedAt   = GETUTCDATE(),
               DeletedBy   = @DeletedBy
        WHERE  UserId      = @UserId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
