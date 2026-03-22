-- ============================================================
-- EduERP — SQL Server Database Schema
-- Version  : 1.0.0
-- Naming   : PascalCase tables, PK = TableName + 'Id'
-- Auditing : Every table has CreatedAt/By, UpdatedAt/By, IsDeleted
-- Deletes  : Soft-delete only (IsDeleted = 1). Hard deletes prohibited.
-- ============================================================

USE EduERP;
GO
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================
-- 1. REFERENCE / LOOKUP TABLES
-- ============================================================

CREATE TABLE AcademicYears (
    AcademicYearId INT           IDENTITY(1,1) PRIMARY KEY,
    YearName       NVARCHAR(50)  NOT NULL UNIQUE,   -- e.g., "2025-2026"
    StartDate      DATE          NOT NULL,
    EndDate        DATE          NOT NULL,
    IsCurrent      BIT           NOT NULL DEFAULT 0,
    CreatedAt      DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy      INT           NOT NULL,
    UpdatedAt      DATETIME2(7)  NULL,
    UpdatedBy      INT           NULL,
    IsDeleted      BIT           NOT NULL DEFAULT 0
);

CREATE TABLE Classes (
    ClassId        INT           IDENTITY(1,1) PRIMARY KEY,
    ClassName      NVARCHAR(100) NOT NULL,           -- e.g., "Grade 10"
    GradeLevel     INT           NOT NULL,
    AcademicYearId INT           NOT NULL REFERENCES AcademicYears(AcademicYearId),
    CreatedAt      DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy      INT           NOT NULL,
    UpdatedAt      DATETIME2(7)  NULL,
    UpdatedBy      INT           NULL,
    IsDeleted      BIT           NOT NULL DEFAULT 0
);

CREATE TABLE Sections (
    SectionId  INT           IDENTITY(1,1) PRIMARY KEY,
    ClassId    INT           NOT NULL REFERENCES Classes(ClassId),
    SectionName NVARCHAR(10) NOT NULL,               -- e.g., "A", "B"
    Capacity   INT           NOT NULL DEFAULT 40,
    CreatedAt  DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy  INT           NOT NULL,
    IsDeleted  BIT           NOT NULL DEFAULT 0
);

CREATE TABLE Subjects (
    SubjectId   INT           IDENTITY(1,1) PRIMARY KEY,
    SubjectCode NVARCHAR(20)  NOT NULL UNIQUE,
    SubjectName NVARCHAR(150) NOT NULL,
    IsElective  BIT           NOT NULL DEFAULT 0,
    CreatedAt   DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy   INT           NOT NULL,
    IsDeleted   BIT           NOT NULL DEFAULT 0
);

-- ============================================================
-- 2. USERS & AUTH
-- ============================================================

CREATE TABLE Users (
    UserId       INT            IDENTITY(1,1) PRIMARY KEY,
    FullName     NVARCHAR(200)  NOT NULL,
    Email        NVARCHAR(256)  NOT NULL,
    PasswordHash NVARCHAR(500)  NOT NULL,           -- Argon2id hash
    Role         NVARCHAR(20)   NOT NULL             -- Admin | Teacher | Student | Parent
                 CONSTRAINT CHK_Users_Role CHECK (Role IN ('Admin','Teacher','Student','Parent')),
    Phone        NVARCHAR(20)   NULL,
    IsActive     BIT            NOT NULL DEFAULT 1,
    LastLoginAt  DATETIME2(7)   NULL,
    LastLoginIp  NVARCHAR(45)   NULL,               -- IPv6 max length
    CreatedAt    DATETIME2(7)   NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy    INT            NOT NULL,
    UpdatedAt    DATETIME2(7)   NULL,
    UpdatedBy    INT            NULL,
    IsDeleted    BIT            NOT NULL DEFAULT 0,
    DeletedAt    DATETIME2(7)   NULL,
    DeletedBy    INT            NULL
);

CREATE UNIQUE INDEX UIX_Users_Email ON Users(Email) WHERE IsDeleted = 0;

CREATE TABLE RefreshTokens (
    TokenId   INT           IDENTITY(1,1) PRIMARY KEY,
    UserId    INT           NOT NULL REFERENCES Users(UserId),
    TokenHash NVARCHAR(128) NOT NULL,               -- SHA-256 hex — never plain token
    FamilyId  NVARCHAR(64)  NOT NULL,               -- Rotation family tracking
    IpHash    NVARCHAR(128) NOT NULL,               -- HMAC-SHA256 of client IP
    UaHash    NVARCHAR(128) NOT NULL,               -- HMAC-SHA256 of User-Agent
    ExpiresAt DATETIME2(7)  NOT NULL,
    IsRevoked BIT           NOT NULL DEFAULT 0,
    RevokedAt DATETIME2(7)  NULL,
    CreatedAt DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy INT           NOT NULL DEFAULT 0,
    IsDeleted BIT           NOT NULL DEFAULT 0
);

CREATE INDEX IX_RefreshTokens_TokenHash ON RefreshTokens(TokenHash) INCLUDE (UserId, IsRevoked, ExpiresAt);
CREATE INDEX IX_RefreshTokens_UserId    ON RefreshTokens(UserId)    WHERE IsRevoked = 0;
CREATE INDEX IX_RefreshTokens_FamilyId  ON RefreshTokens(FamilyId);

-- ============================================================
-- 3. STUDENTS & TEACHERS & PARENTS
-- ============================================================

CREATE TABLE Students (
    StudentId             INT           IDENTITY(1,1) PRIMARY KEY,
    UserId                INT           NOT NULL REFERENCES Users(UserId),
    EnrollmentNumber      NVARCHAR(30)  NOT NULL,
    FirstName             NVARCHAR(100) NULL,          -- nullable: FullName lives in Users
    LastName              NVARCHAR(100) NULL,
    DateOfBirth           DATE          NOT NULL,
    Gender                NVARCHAR(10)  NOT NULL
                          CONSTRAINT CHK_Students_Gender CHECK (Gender IN ('Male','Female','Other')),
    BloodGroup            NVARCHAR(5)   NULL,
    Email                 NVARCHAR(256) NULL,
    Phone                 NVARCHAR(20)  NULL,
    Address               NVARCHAR(500) NULL,
    ClassId               INT           NOT NULL REFERENCES Classes(ClassId),
    SectionId             INT           NOT NULL REFERENCES Sections(SectionId),
    AcademicYearId        INT           NOT NULL REFERENCES AcademicYears(AcademicYearId),
    AdmissionDate         DATE          NOT NULL,
    Status                NVARCHAR(20)  NOT NULL DEFAULT 'Active'
                          CONSTRAINT CHK_Students_Status CHECK (Status IN ('Active','Inactive','Graduated','Withdrawn')),
    EmergencyContactName  NVARCHAR(200) NULL,
    EmergencyContactPhone NVARCHAR(20)  NULL,
    ProfileImagePath      NVARCHAR(500) NULL,
    CreatedAt             DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy             INT           NOT NULL,
    UpdatedAt             DATETIME2(7)  NULL,
    UpdatedBy             INT           NULL,
    IsDeleted             BIT           NOT NULL DEFAULT 0,
    DeletedAt             DATETIME2(7)  NULL,
    DeletedBy             INT           NULL
);

CREATE UNIQUE INDEX UIX_Students_EnrollmentNumber ON Students(EnrollmentNumber) WHERE IsDeleted = 0;
CREATE        INDEX IX_Students_ClassSection       ON Students(ClassId, SectionId) WHERE IsDeleted = 0;
CREATE        INDEX IX_Students_AcademicYear       ON Students(AcademicYearId, Status) WHERE IsDeleted = 0;

CREATE TABLE Teachers (
    TeacherId      INT           IDENTITY(1,1) PRIMARY KEY,
    UserId         INT           NOT NULL REFERENCES Users(UserId),
    EmployeeCode   NVARCHAR(30)  NOT NULL,
    FirstName      NVARCHAR(100) NOT NULL,
    LastName       NVARCHAR(100) NOT NULL,
    Qualification  NVARCHAR(200) NULL,
    Specialization NVARCHAR(200) NULL,
    JoiningDate    DATE          NOT NULL,
    IsActive       BIT           NOT NULL DEFAULT 1,
    CreatedAt      DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy      INT           NOT NULL,
    UpdatedAt      DATETIME2(7)  NULL,
    UpdatedBy      INT           NULL,
    IsDeleted      BIT           NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX UIX_Teachers_EmployeeCode ON Teachers(EmployeeCode) WHERE IsDeleted = 0;

CREATE TABLE Parents (
    ParentId         INT           IDENTITY(1,1) PRIMARY KEY,
    UserId           INT           NOT NULL REFERENCES Users(UserId),
    FirstName        NVARCHAR(100) NOT NULL,
    LastName         NVARCHAR(100) NOT NULL,
    Occupation       NVARCHAR(150) NULL,
    Phone            NVARCHAR(20)  NULL,
    AlternatePhone   NVARCHAR(20)  NULL,
    CreatedAt        DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy        INT           NOT NULL,
    IsDeleted        BIT           NOT NULL DEFAULT 0
);

CREATE TABLE StudentParentMap (
    MapId        INT          IDENTITY(1,1) PRIMARY KEY,
    StudentId    INT          NOT NULL REFERENCES Students(StudentId),
    ParentId     INT          NOT NULL REFERENCES Parents(ParentId),
    Relationship NVARCHAR(50) NOT NULL,              -- Father | Mother | Guardian
    IsPrimary    BIT          NOT NULL DEFAULT 0,
    CreatedAt    DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy    INT          NOT NULL,
    IsDeleted    BIT          NOT NULL DEFAULT 0,
    CONSTRAINT UIX_StudentParent UNIQUE (StudentId, ParentId)
);

-- ============================================================
-- 4. ADMISSION
-- ============================================================

CREATE TABLE AdmissionApplications (
    ApplicationId      INT           IDENTITY(1,1) PRIMARY KEY,
    ReferenceNumber    NVARCHAR(30)  NOT NULL,
    ApplicantName      NVARCHAR(200) NOT NULL,
    DateOfBirth        DATE          NOT NULL,
    Gender             NVARCHAR(10)  NOT NULL,
    ApplyingForClass   NVARCHAR(100) NOT NULL,
    AcademicYearId     INT           NOT NULL REFERENCES AcademicYears(AcademicYearId),
    ParentName         NVARCHAR(200) NOT NULL,
    ParentEmail        NVARCHAR(256) NOT NULL,
    ParentPhone        NVARCHAR(20)  NOT NULL,
    PreviousSchool     NVARCHAR(300) NULL,
    Status             NVARCHAR(20)  NOT NULL DEFAULT 'Pending'
                       CONSTRAINT CHK_Admission_Status CHECK (Status IN ('Pending','Reviewed','Accepted','Rejected','Enrolled')),
    Remarks            NVARCHAR(1000) NULL,
    ClassId            INT            NULL REFERENCES Classes(ClassId),
    ConvertedAt        DATETIME2(7)   NULL,
    ConvertedStudentId INT            NULL,
    ReviewedBy         INT           NULL,
    ReviewedAt         DATETIME2(7)  NULL,
    CreatedAt          DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy          INT           NOT NULL DEFAULT 0,
    UpdatedAt          DATETIME2(7)  NULL,
    UpdatedBy          INT           NULL,
    IsDeleted          BIT           NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX UIX_Admission_ReferenceNumber ON AdmissionApplications(ReferenceNumber);
CREATE        INDEX IX_Admission_Status           ON AdmissionApplications(Status, AcademicYearId) WHERE IsDeleted = 0;

-- ============================================================
-- 5. ATTENDANCE
-- ============================================================

CREATE TABLE AttendanceRecords (
    AttendanceId   INT           IDENTITY(1,1) PRIMARY KEY,
    StudentId      INT           NOT NULL REFERENCES Students(StudentId),
    ClassId        INT           NOT NULL REFERENCES Classes(ClassId),
    SectionId      INT           NOT NULL REFERENCES Sections(SectionId),
    AttendanceDate DATE          NOT NULL,
    Period         TINYINT       NOT NULL DEFAULT 0,  -- 0 = daily, 1-8 = period-wise
    SubjectId      INT           NULL REFERENCES Subjects(SubjectId),
    Status         NVARCHAR(10)  NOT NULL
                   CONSTRAINT CHK_Attendance_Status CHECK (Status IN ('Present','Absent','Late','Leave')),
    Remarks        NVARCHAR(500) NULL,
    MarkedBy       INT           NOT NULL REFERENCES Users(UserId),
    CreatedAt      DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy      INT           NOT NULL,
    UpdatedAt      DATETIME2(7)  NULL,
    UpdatedBy      INT           NULL,
    IsDeleted      BIT           NOT NULL DEFAULT 0,
    CONSTRAINT UIX_Attendance UNIQUE (StudentId, AttendanceDate, Period)
);

CREATE INDEX IX_Attendance_ClassDate ON AttendanceRecords(ClassId, SectionId, AttendanceDate) WHERE IsDeleted = 0;
CREATE INDEX IX_Attendance_Student   ON AttendanceRecords(StudentId, AttendanceDate)          WHERE IsDeleted = 0;

-- ============================================================
-- 6. EXAMINATIONS & RESULTS
-- ============================================================

CREATE TABLE Examinations (
    ExaminationId  INT           IDENTITY(1,1) PRIMARY KEY,
    ExamName       NVARCHAR(200) NOT NULL,
    ExamType       NVARCHAR(20)  NOT NULL
                   CONSTRAINT CHK_Exam_Type CHECK (ExamType IN ('Unit','MidTerm','Final','Remedial')),
    AcademicYearId INT           NOT NULL REFERENCES AcademicYears(AcademicYearId),
    ClassId        INT           NOT NULL REFERENCES Classes(ClassId),
    StartDate      DATE          NOT NULL,
    EndDate        DATE          NOT NULL,
    MaxMarks       DECIMAL(6,2)  NOT NULL DEFAULT 100,
    PassMarks      DECIMAL(6,2)  NOT NULL DEFAULT 40,
    IsPublished    BIT           NOT NULL DEFAULT 0,
    CreatedAt      DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy      INT           NOT NULL,
    UpdatedAt      DATETIME2(7)  NULL,
    UpdatedBy      INT           NULL,
    IsDeleted      BIT           NOT NULL DEFAULT 0
);

CREATE TABLE ExamResults (
    ResultId       INT             IDENTITY(1,1) PRIMARY KEY,
    ExaminationId  INT             NOT NULL REFERENCES Examinations(ExaminationId),
    StudentId      INT             NOT NULL REFERENCES Students(StudentId),
    SubjectId      INT             NOT NULL REFERENCES Subjects(SubjectId),
    MarksObtained  DECIMAL(6,2)    NOT NULL,
    MaxMarks       DECIMAL(6,2)    NOT NULL,
    Grade          NVARCHAR(5)     NULL,
    Remarks        NVARCHAR(500)   NULL,
    CreatedAt      DATETIME2(7)    NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy      INT             NOT NULL,
    UpdatedAt      DATETIME2(7)    NULL,
    UpdatedBy      INT             NULL,
    IsDeleted      BIT             NOT NULL DEFAULT 0,
    CONSTRAINT UIX_ExamResult UNIQUE (ExaminationId, StudentId, SubjectId)
);

CREATE INDEX IX_ExamResults_Student ON ExamResults(StudentId, ExaminationId) WHERE IsDeleted = 0;

-- ============================================================
-- 7. FEES
-- ============================================================

CREATE TABLE FeeStructures (
    FeeStructureId INT            IDENTITY(1,1) PRIMARY KEY,
    FeeName        NVARCHAR(200)  NOT NULL,
    AcademicYearId INT            NOT NULL REFERENCES AcademicYears(AcademicYearId),
    ClassId        INT            NULL REFERENCES Classes(ClassId),    -- NULL = applies to all classes
    Amount         DECIMAL(12,2)  NOT NULL,
    IsRecurring    BIT            NOT NULL DEFAULT 0,
    Frequency      NVARCHAR(20)   NULL                                  -- Monthly | Quarterly | Annual
                   CONSTRAINT CHK_Fee_Freq CHECK (Frequency IS NULL OR Frequency IN ('Monthly','Quarterly','Annual','OneTime')),
    DueDate        DATE           NULL,
    CreatedAt      DATETIME2(7)   NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy      INT            NOT NULL,
    UpdatedAt      DATETIME2(7)   NULL,
    UpdatedBy      INT            NULL,
    IsDeleted      BIT            NOT NULL DEFAULT 0
);

CREATE TABLE FeeInvoices (
    InvoiceId      INT            IDENTITY(1,1) PRIMARY KEY,
    InvoiceNumber  NVARCHAR(30)   NOT NULL,
    InvoiceMonth   DATE           NULL,
    StudentId      INT            NOT NULL REFERENCES Students(StudentId),
    FeeStructureId INT            NOT NULL REFERENCES FeeStructures(FeeStructureId),
    TotalAmount    DECIMAL(12,2)  NOT NULL,
    PaidAmount     DECIMAL(12,2)  NOT NULL DEFAULT 0,
    BalanceAmount  AS (TotalAmount - PaidAmount),               -- Computed column
    Status         NVARCHAR(20)   NOT NULL DEFAULT 'Pending'
                   CONSTRAINT CHK_Invoice_Status CHECK (Status IN ('Pending','Paid','PartiallyPaid','Overdue','Waived')),
    DueDate        DATE           NOT NULL,
    CreatedAt      DATETIME2(7)   NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy      INT            NOT NULL,
    UpdatedAt      DATETIME2(7)   NULL,
    UpdatedBy      INT            NULL,
    IsDeleted      BIT            NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX UIX_FeeInvoice_Number ON FeeInvoices(InvoiceNumber);
CREATE        INDEX IX_FeeInvoice_Student ON FeeInvoices(StudentId, Status) WHERE IsDeleted = 0;

CREATE TABLE FeePayments (
    PaymentId            INT            IDENTITY(1,1) PRIMARY KEY,
    InvoiceId            INT            NOT NULL REFERENCES FeeInvoices(InvoiceId),
    AmountPaid           DECIMAL(12,2)  NOT NULL,
    PaymentMethod        NVARCHAR(50)   NOT NULL
                         CONSTRAINT CHK_Payment_Method CHECK (PaymentMethod IN ('Cash','BankTransfer','Card','OnlinePortal','Cheque')),
    TransactionReference NVARCHAR(100)  NULL,
    ReceiptNumber        NVARCHAR(30)   NULL,
    PaymentDate          DATE           NOT NULL,
    RecordedBy           INT            NOT NULL REFERENCES Users(UserId),
    CreatedAt            DATETIME2(7)   NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy            INT            NOT NULL,
    IsDeleted            BIT            NOT NULL DEFAULT 0
);

-- ============================================================
-- 8. COMMUNICATION
-- ============================================================

CREATE TABLE Announcements (
    AnnouncementId INT            IDENTITY(1,1) PRIMARY KEY,
    Title          NVARCHAR(300)  NOT NULL,
    Body           NVARCHAR(MAX)  NOT NULL,
    TargetRoles    NVARCHAR(200)  NOT NULL,    -- Comma-separated: "Student,Parent"
    PublishAt      DATETIME2(7)   NOT NULL DEFAULT GETUTCDATE(),
    ExpiresAt      DATETIME2(7)   NULL,
    IsActive       BIT            NOT NULL DEFAULT 1,
    CreatedAt      DATETIME2(7)   NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy      INT            NOT NULL,
    UpdatedAt      DATETIME2(7)   NULL,
    UpdatedBy      INT            NULL,
    IsDeleted      BIT            NOT NULL DEFAULT 0
);

CREATE TABLE Messages (
    MessageId   INT           IDENTITY(1,1) PRIMARY KEY,
    SenderId    INT           NOT NULL REFERENCES Users(UserId),
    RecipientId INT           NOT NULL REFERENCES Users(UserId),
    Subject     NVARCHAR(300) NOT NULL,
    Body        NVARCHAR(MAX) NOT NULL,
    IsRead      BIT           NOT NULL DEFAULT 0,
    ReadAt      DATETIME2(7)  NULL,
    SentAt      DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE(),
    CreatedAt   DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy   INT           NOT NULL,
    IsDeleted   BIT           NOT NULL DEFAULT 0
);

CREATE INDEX IX_Messages_Recipient ON Messages(RecipientId, IsRead) WHERE IsDeleted = 0;

-- ============================================================
-- 9. AUDIT LOG
-- ============================================================

CREATE TABLE AuditLogs (
    AuditId    BIGINT        IDENTITY(1,1) PRIMARY KEY,
    UserId     INT           NULL,
    Action     NVARCHAR(100) NOT NULL,       -- e.g., "Student.Create"
    TableName  NVARCHAR(100) NOT NULL,
    RecordId   INT           NULL,
    OldValues  NVARCHAR(MAX) NULL,           -- JSON snapshot before change
    NewValues  NVARCHAR(MAX) NULL,           -- JSON snapshot after change
    IpAddress  NVARCHAR(45)  NULL,
    UserAgent  NVARCHAR(500) NULL,
    CreatedAt  DATETIME2(7)  NOT NULL DEFAULT GETUTCDATE()
                                             -- AuditLogs are never soft-deleted
);

CREATE INDEX IX_AuditLogs_UserId    ON AuditLogs(UserId, CreatedAt DESC);
CREATE INDEX IX_AuditLogs_TableName ON AuditLogs(TableName, RecordId);

-- ============================================================
-- SEQUENCES
-- ============================================================
GO
CREATE SEQUENCE seq_ReceiptNumber
    START WITH 1
    INCREMENT BY 1
    MINVALUE 1
    NO CYCLE;
GO
