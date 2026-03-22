-- ============================================================
-- Fees Module — Additional Stored Procedures
-- Covers: Fee structure CRUD, invoice detail, online payment
--         session management (Stripe integration)
-- ============================================================

USE EduERP;
GO

-- ============================================================
-- PaymentSessions table (tracks online checkout sessions)
-- ============================================================
IF OBJECT_ID('PaymentSessions', 'U') IS NULL
BEGIN
    CREATE TABLE PaymentSessions (
        SessionId        INT            IDENTITY(1,1) PRIMARY KEY,
        InvoiceId        INT            NOT NULL REFERENCES FeeInvoices(InvoiceId),
        ExternalRef      NVARCHAR(200)  NOT NULL,            -- Stripe checkout session ID
        Amount           DECIMAL(12,2)  NOT NULL,
        Currency         NVARCHAR(10)   NOT NULL DEFAULT 'usd',
        Status           NVARCHAR(20)   NOT NULL DEFAULT 'Pending'
                         CONSTRAINT CHK_Session_Status
                         CHECK (Status IN ('Pending','Completed','Expired','Failed')),
        ExpiresAt        DATETIME2(7)   NOT NULL,
        CompletedAt      DATETIME2(7)   NULL,
        PaymentIntentRef NVARCHAR(200)  NULL,                -- Stripe payment_intent ID
        CreatedAt        DATETIME2(7)   NOT NULL DEFAULT GETUTCDATE(),
        CreatedBy        INT            NOT NULL,
        UpdatedAt        DATETIME2(7)   NULL,
        IsDeleted        BIT            NOT NULL DEFAULT 0
    );

    CREATE UNIQUE INDEX UIX_PaymentSessions_ExternalRef
        ON PaymentSessions(ExternalRef) WHERE IsDeleted = 0;
    CREATE INDEX IX_PaymentSessions_InvoiceId
        ON PaymentSessions(InvoiceId);
END;
GO

-- ============================================================
-- usp_Fees_GetStructureById
-- ============================================================
CREATE OR ALTER PROCEDURE usp_Fees_GetStructureById
    @FeeStructureId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        fs.FeeStructureId,
        fs.FeeName,
        fs.Amount,
        fs.IsRecurring,
        fs.Frequency,
        fs.DueDate,
        fs.ClassId,
        fs.AcademicYearId,
        c.ClassName,
        ay.YearName AS AcademicYear,
        fs.CreatedAt
    FROM  FeeStructures fs
    JOIN  AcademicYears ay ON fs.AcademicYearId = ay.AcademicYearId
    LEFT JOIN Classes   c  ON fs.ClassId        = c.ClassId
    WHERE fs.FeeStructureId = @FeeStructureId
    AND   fs.IsDeleted      = 0;
END;
GO

-- ============================================================
-- usp_Fees_CreateStructure
-- ============================================================
CREATE OR ALTER PROCEDURE usp_Fees_CreateStructure
    @FeeName        NVARCHAR(200),
    @AcademicYearId INT,
    @ClassId        INT = NULL,
    @Amount         DECIMAL(12,2),
    @IsRecurring    BIT,
    @Frequency      NVARCHAR(20) = NULL,
    @DueDate        DATE         = NULL,
    @CreatedBy      INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO FeeStructures
        (FeeName, AcademicYearId, ClassId, Amount, IsRecurring, Frequency, DueDate,
         CreatedAt, CreatedBy, IsDeleted)
    VALUES
        (@FeeName, @AcademicYearId, @ClassId, @Amount, @IsRecurring, @Frequency, @DueDate,
         GETUTCDATE(), @CreatedBy, 0);

    SELECT SCOPE_IDENTITY() AS FeeStructureId;
END;
GO

-- ============================================================
-- usp_Fees_UpdateStructure
-- ============================================================
CREATE OR ALTER PROCEDURE usp_Fees_UpdateStructure
    @FeeStructureId INT,
    @FeeName        NVARCHAR(200) = NULL,
    @Amount         DECIMAL(12,2) = NULL,
    @IsRecurring    BIT           = NULL,
    @Frequency      NVARCHAR(20)  = NULL,
    @DueDate        DATE          = NULL,
    @UpdatedBy      INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE FeeStructures
    SET    FeeName     = ISNULL(@FeeName,     FeeName),
           Amount      = ISNULL(@Amount,      Amount),
           IsRecurring = ISNULL(@IsRecurring, IsRecurring),
           Frequency   = ISNULL(@Frequency,   Frequency),
           DueDate     = ISNULL(@DueDate,     DueDate),
           UpdatedAt   = GETUTCDATE(),
           UpdatedBy   = @UpdatedBy
    WHERE  FeeStructureId = @FeeStructureId
    AND    IsDeleted      = 0;
END;
GO

-- ============================================================
-- usp_Fees_SoftDeleteStructure
-- ============================================================
CREATE OR ALTER PROCEDURE usp_Fees_SoftDeleteStructure
    @FeeStructureId INT,
    @DeletedBy      INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE FeeStructures
    SET    IsDeleted  = 1,
           UpdatedAt  = GETUTCDATE(),
           UpdatedBy  = @DeletedBy
    WHERE  FeeStructureId = @FeeStructureId
    AND    IsDeleted      = 0;
END;
GO

-- ============================================================
-- usp_Fees_GetInvoiceById
-- ============================================================
CREATE OR ALTER PROCEDURE usp_Fees_GetInvoiceById
    @InvoiceId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        fi.InvoiceId,
        fi.InvoiceNumber,
        fi.InvoiceMonth,
        fi.DueDate,
        fi.TotalAmount,
        fi.PaidAmount,
        fi.BalanceAmount,
        fi.Status,
        fi.StudentId,
        fi.FeeStructureId,
        fs.FeeName          AS FeeType,
        s.EnrollmentNumber,
        u.FullName          AS StudentName,
        u.Email             AS StudentEmail,
        c.ClassName,
        sec.SectionName
    FROM  FeeInvoices   fi
    JOIN  FeeStructures fs  ON fi.FeeStructureId = fs.FeeStructureId
    JOIN  Students      s   ON fi.StudentId      = s.StudentId
    JOIN  Users         u   ON s.UserId          = u.UserId
    JOIN  Classes       c   ON s.ClassId         = c.ClassId
    JOIN  Sections      sec ON s.SectionId       = sec.SectionId
    WHERE fi.InvoiceId  = @InvoiceId
    AND   fi.IsDeleted  = 0;
END;
GO

-- ============================================================
-- usp_Fees_CreatePaymentSession
-- ============================================================
CREATE OR ALTER PROCEDURE usp_Fees_CreatePaymentSession
    @InvoiceId   INT,
    @ExternalRef NVARCHAR(200),
    @Amount      DECIMAL(12,2),
    @Currency    NVARCHAR(10),
    @ExpiresAt   DATETIME2(7),
    @CreatedBy   INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Prevent duplicate sessions for the same invoice that are still Pending
    IF EXISTS (
        SELECT 1 FROM PaymentSessions
        WHERE InvoiceId = @InvoiceId
        AND   Status    = 'Pending'
        AND   ExpiresAt > GETUTCDATE()
        AND   IsDeleted = 0
    )
    BEGIN
        -- Return the existing active session ref
        SELECT TOP 1 ExternalRef AS ExistingRef, 1 AS AlreadyExists
        FROM PaymentSessions
        WHERE InvoiceId = @InvoiceId
        AND   Status    = 'Pending'
        AND   ExpiresAt > GETUTCDATE()
        AND   IsDeleted = 0
        ORDER BY CreatedAt DESC;
        RETURN;
    END;

    INSERT INTO PaymentSessions
        (InvoiceId, ExternalRef, Amount, Currency, Status, ExpiresAt,
         CreatedAt, CreatedBy, IsDeleted)
    VALUES
        (@InvoiceId, @ExternalRef, @Amount, @Currency, 'Pending', @ExpiresAt,
         GETUTCDATE(), @CreatedBy, 0);

    SELECT SCOPE_IDENTITY() AS SessionId, NULL AS ExistingRef, 0 AS AlreadyExists;
END;
GO

-- ============================================================
-- usp_Fees_GetPaymentSessionByRef
-- ============================================================
CREATE OR ALTER PROCEDURE usp_Fees_GetPaymentSessionByRef
    @ExternalRef NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        ps.SessionId,
        ps.InvoiceId,
        ps.ExternalRef,
        ps.Amount,
        ps.Currency,
        ps.Status,
        ps.ExpiresAt,
        ps.CompletedAt,
        ps.PaymentIntentRef
    FROM  PaymentSessions ps
    WHERE ps.ExternalRef = @ExternalRef
    AND   ps.IsDeleted   = 0;
END;
GO

-- ============================================================
-- usp_Fees_CompleteOnlinePayment
-- Atomically: marks session Completed + records FeePayment + updates FeeInvoice
-- Idempotent: repeated calls with the same @ExternalRef are safe
-- ============================================================
CREATE OR ALTER PROCEDURE usp_Fees_CompleteOnlinePayment
    @ExternalRef     NVARCHAR(200),
    @PaymentIntentId NVARCHAR(200),
    @AmountPaid      DECIMAL(12,2),
    @UpdatedBy       INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @SessionId  INT;
        DECLARE @InvoiceId  INT;
        DECLARE @CurrStatus NVARCHAR(20);

        SELECT
            @SessionId  = SessionId,
            @InvoiceId  = InvoiceId,
            @CurrStatus = Status
        FROM PaymentSessions WITH (UPDLOCK)
        WHERE ExternalRef = @ExternalRef
        AND   IsDeleted   = 0;

        IF @SessionId IS NULL
        BEGIN
            RAISERROR('Payment session not found.', 16, 1);
            RETURN;
        END;

        -- Idempotency guard — already processed
        IF @CurrStatus = 'Completed'
        BEGIN
            COMMIT TRANSACTION;
            SELECT 'AlreadyCompleted' AS Result;
            RETURN;
        END;

        IF @CurrStatus <> 'Pending'
        BEGIN
            RAISERROR('Payment session is not in Pending state.', 16, 1);
            RETURN;
        END;

        -- Generate receipt number
        DECLARE @ReceiptNumber NVARCHAR(30);
        SET @ReceiptNumber = 'REC-' + CONVERT(NVARCHAR(8), GETDATE(), 112)
                           + '-' + CAST(NEXT VALUE FOR seq_ReceiptNumber AS NVARCHAR(10));

        -- Record payment
        INSERT INTO FeePayments
            (InvoiceId, AmountPaid, PaymentMethod, TransactionReference, ReceiptNumber,
             PaymentDate, RecordedBy, CreatedAt, CreatedBy, IsDeleted)
        VALUES
            (@InvoiceId, @AmountPaid, 'OnlinePortal', @PaymentIntentId, @ReceiptNumber,
             CAST(GETDATE() AS DATE), @UpdatedBy, GETUTCDATE(), @UpdatedBy, 0);

        -- Update invoice status
        UPDATE FeeInvoices
        SET    PaidAmount = PaidAmount + @AmountPaid,
               Status     = CASE
                                WHEN (PaidAmount + @AmountPaid) >= TotalAmount THEN 'Paid'
                                ELSE 'PartiallyPaid'
                            END,
               UpdatedAt  = GETUTCDATE(),
               UpdatedBy  = @UpdatedBy
        WHERE  InvoiceId  = @InvoiceId;

        -- Mark session complete
        UPDATE PaymentSessions
        SET    Status          = 'Completed',
               CompletedAt     = GETUTCDATE(),
               PaymentIntentRef = @PaymentIntentId,
               UpdatedAt       = GETUTCDATE()
        WHERE  SessionId       = @SessionId;

        COMMIT TRANSACTION;
        SELECT 'Success' AS Result, @ReceiptNumber AS ReceiptNumber;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

-- ============================================================
-- usp_Fees_GetFeesSummary
-- ============================================================
CREATE OR ALTER PROCEDURE usp_Fees_GetFeesSummary
    @AcademicYearId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        SUM(CASE WHEN fi.Status = 'Paid'         THEN fi.TotalAmount ELSE 0 END) AS TotalCollected,
        SUM(CASE WHEN fi.Status IN ('Pending','PartiallyPaid')
                 AND fi.DueDate >= CAST(GETDATE() AS DATE)
                              THEN fi.BalanceAmount ELSE 0 END)                   AS TotalPending,
        SUM(CASE WHEN fi.Status IN ('Pending','PartiallyPaid')
                 AND fi.DueDate <  CAST(GETDATE() AS DATE)
                              THEN fi.BalanceAmount ELSE 0 END)                   AS TotalOverdue,
        COUNT(fi.InvoiceId)                                                        AS TotalInvoices,
        SUM(CASE WHEN fi.Status = 'Paid'         THEN 1 ELSE 0 END)               AS PaidInvoices,
        SUM(CASE WHEN fi.Status = 'Pending'      THEN 1 ELSE 0 END)               AS PendingInvoices,
        SUM(CASE WHEN fi.Status = 'PartiallyPaid'THEN 1 ELSE 0 END)               AS PartialInvoices,
        SUM(CASE WHEN fi.Status IN ('Pending','PartiallyPaid')
                 AND fi.DueDate < CAST(GETDATE() AS DATE)
                              THEN 1 ELSE 0 END)                                   AS OverdueInvoices
    FROM  FeeInvoices  fi
    JOIN  Students     s ON fi.StudentId = s.StudentId
    WHERE fi.IsDeleted      = 0
    AND   (@AcademicYearId IS NULL OR s.AcademicYearId = @AcademicYearId)
    AND   s.IsDeleted       = 0;
END;
GO
