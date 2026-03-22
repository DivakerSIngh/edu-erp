-- ============================================================
-- Fees Stored Procedures
-- ============================================================

USE EduERP;
GO

-- -- usp_Fees_GetStructures ----------------------------------------------------
CREATE OR ALTER PROCEDURE usp_Fees_GetStructures
    @AcademicYearId INT = NULL,
    @ClassId        INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        fs.FeeStructureId,
        fs.FeeName,
        fs.Amount,
        fs.Frequency,
        fs.DueDate,
        c.ClassName,
        ay.YearName AS AcademicYear
    FROM  FeeStructures fs
    JOIN  AcademicYears ay ON fs.AcademicYearId = ay.AcademicYearId
    LEFT JOIN Classes   c  ON fs.ClassId        = c.ClassId
    WHERE fs.IsDeleted       = 0
    AND   (@AcademicYearId IS NULL OR fs.AcademicYearId = @AcademicYearId)
    AND   (@ClassId        IS NULL OR fs.ClassId        = @ClassId OR fs.ClassId IS NULL)
    ORDER BY c.ClassName, fs.FeeName;
END;
GO

-- -- usp_Fees_GenerateInvoices -------------------------------------------------
-- Hangfire job calls this monthly to create FeeInvoice rows for active students
CREATE OR ALTER PROCEDURE usp_Fees_GenerateInvoices
    @AcademicYearId INT,
    @Month          TINYINT,
    @Year           SMALLINT,
    @GeneratedBy    INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @InvoiceMonth DATE = DATEFROMPARTS(@Year, @Month, 1);
        DECLARE @DueDate      DATE = EOMONTH(@InvoiceMonth);

        INSERT INTO FeeInvoices
            (InvoiceNumber, StudentId, FeeStructureId, InvoiceMonth, DueDate,
             TotalAmount, PaidAmount, Status, CreatedAt, CreatedBy, IsDeleted)
        SELECT
            'INV-' + CAST(@Year AS NVARCHAR(4))
                + RIGHT('00' + CAST(@Month AS NVARCHAR(2)), 2)
                + '-' + RIGHT('00000' + CAST(s.StudentId AS NVARCHAR(5)), 5)
                + '-' + CAST(fs.FeeStructureId AS NVARCHAR(5)) AS InvoiceNumber,
            s.StudentId,
            fs.FeeStructureId,
            @InvoiceMonth,
            @DueDate,
            fs.Amount,
            0,
            'Pending',
            GETUTCDATE(),
            @GeneratedBy,
            0
        FROM  Students     s
        JOIN  FeeStructures fs ON (fs.ClassId = s.ClassId OR fs.ClassId IS NULL)
                               AND fs.AcademicYearId = @AcademicYearId
        WHERE s.IsDeleted         = 0
        AND   s.Status            = 'Active'
        AND   fs.IsDeleted        = 0
        AND NOT EXISTS (
            SELECT 1
            FROM   FeeInvoices fi
            WHERE  fi.StudentId      = s.StudentId
            AND    fi.FeeStructureId = fs.FeeStructureId
            AND    fi.InvoiceMonth   = @InvoiceMonth
            AND    fi.IsDeleted      = 0
        );

        COMMIT TRANSACTION;
        SELECT @@ROWCOUNT AS InvoicesCreated;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

-- -- usp_Fees_GetStudentInvoices -----------------------------------------------
CREATE OR ALTER PROCEDURE usp_Fees_GetStudentInvoices
    @StudentId INT,
    @Status    NVARCHAR(20) = NULL
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
        fs.FeeName      AS FeeType,
        fp.PaymentDate  AS PaidAt,
        fp.PaymentMethod,
        fp.ReceiptNumber
    FROM  FeeInvoices   fi
    JOIN  FeeStructures fs  ON fi.FeeStructureId = fs.FeeStructureId
    LEFT JOIN FeePayments fp ON fi.InvoiceId     = fp.InvoiceId AND fp.IsDeleted = 0
    WHERE fi.StudentId  = @StudentId
    AND   fi.IsDeleted  = 0
    AND   (@Status IS NULL OR fi.Status = @Status)
    ORDER BY fi.InvoiceMonth DESC;
END;
GO

-- -- usp_Fees_RecordPayment ----------------------------------------------------
CREATE OR ALTER PROCEDURE usp_Fees_RecordPayment
    @InvoiceId         INT,
    @AmountPaid        DECIMAL(10,2),
    @PaymentMethod     NVARCHAR(50),
    @TransactionRef    NVARCHAR(100) = NULL,
    @RecordedBy        INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @CurrentStatus  NVARCHAR(20);
        DECLARE @BalanceDue     DECIMAL(12,2);

        SELECT
            @CurrentStatus = fi.Status,
            @BalanceDue    = fi.BalanceAmount
        FROM FeeInvoices fi
        WHERE fi.InvoiceId = @InvoiceId AND fi.IsDeleted = 0;

        IF @CurrentStatus IS NULL
        BEGIN
            RAISERROR('Invoice not found.', 16, 1);
            RETURN;
        END;

        IF @CurrentStatus = 'Paid'
        BEGIN
            RAISERROR('Invoice is already fully paid.', 16, 1);
            RETURN;
        END;

        -- Generate receipt number using sequence
        DECLARE @ReceiptNumber NVARCHAR(30);
        SET @ReceiptNumber = 'REC-' + CONVERT(NVARCHAR(8), GETDATE(), 112)
                           + '-' + CAST(NEXT VALUE FOR seq_ReceiptNumber AS NVARCHAR(10));

        INSERT INTO FeePayments
            (InvoiceId, AmountPaid, PaymentMethod, TransactionReference, ReceiptNumber,
             PaymentDate, RecordedBy, CreatedAt, CreatedBy, IsDeleted)
        VALUES
            (@InvoiceId, @AmountPaid, @PaymentMethod, @TransactionRef, @ReceiptNumber,
             CAST(GETDATE() AS DATE), @RecordedBy, GETUTCDATE(), @RecordedBy, 0);

        -- Update paid amount and status on invoice
        UPDATE FeeInvoices
        SET    PaidAmount = PaidAmount + @AmountPaid,
               Status     = CASE
                                WHEN (PaidAmount + @AmountPaid) >= TotalAmount THEN 'Paid'
                                ELSE 'PartiallyPaid'
                            END,
               UpdatedAt  = GETUTCDATE(),
               UpdatedBy  = @RecordedBy
        WHERE  InvoiceId  = @InvoiceId;

        COMMIT TRANSACTION;
        SELECT @ReceiptNumber AS ReceiptNumber;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

-- -- usp_Fees_GetDefaulters ----------------------------------------------------
CREATE OR ALTER PROCEDURE usp_Fees_GetDefaulters
    @AcademicYearId INT,
    @AsOfDate       DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET @AsOfDate = ISNULL(@AsOfDate, CAST(GETDATE() AS DATE));

    SELECT
        s.StudentId,
        s.EnrollmentNumber,
        u.FullName      AS StudentName,
        u.Email,
        s.Phone,
        c.ClassName,
        sec.SectionName,
        COUNT(fi.InvoiceId)        AS OverdueCount,
        SUM(fi.BalanceAmount)      AS TotalDue,
        MIN(fi.DueDate)            AS OldestDueDate
    FROM  FeeInvoices  fi
    JOIN  Students     s   ON fi.StudentId  = s.StudentId
    JOIN  Users        u   ON s.UserId      = u.UserId
    JOIN  Classes      c   ON s.ClassId     = c.ClassId
    JOIN  Sections     sec ON s.SectionId   = sec.SectionId
    WHERE fi.Status         IN ('Pending','PartiallyPaid')
    AND   fi.DueDate        < @AsOfDate
    AND   fi.IsDeleted      = 0
    AND   s.AcademicYearId  = @AcademicYearId
    AND   s.IsDeleted       = 0
    GROUP BY
        s.StudentId, s.EnrollmentNumber, u.FullName, u.Email,
        s.Phone, c.ClassName, sec.SectionName
    ORDER BY TotalDue DESC;
END;
GO
