using EduERP.Domain.Enums;

namespace EduERP.Domain.Entities;

public class Student : BaseEntity
{
    public int      StudentId        { get; set; }
    public int      UserId           { get; set; }   // FK → Users
    public string   EnrollmentNumber { get; set; } = string.Empty;
    public string   FirstName        { get; set; } = string.Empty;
    public string   LastName         { get; set; } = string.Empty;
    public DateOnly DateOfBirth      { get; set; }
    public string   Gender           { get; set; } = string.Empty;
    public string?  Email            { get; set; }
    public string?  Phone            { get; set; }
    public string?  Address          { get; set; }
    public int      ClassId          { get; set; }   // FK → Classes
    public int      SectionId        { get; set; }   // FK → Sections
    public int      AcademicYearId   { get; set; }   // FK → AcademicYears
    public DateOnly AdmissionDate    { get; set; }
    public StudentStatus Status      { get; set; } = StudentStatus.Active;
    public string?  EmergencyContactName  { get; set; }
    public string?  EmergencyContactPhone { get; set; }
    public string?  ProfileImagePath      { get; set; }
}

public class Teacher : BaseEntity
{
    public int     TeacherId    { get; set; }
    public int     UserId       { get; set; }
    public string  EmployeeCode { get; set; } = string.Empty;
    public string  FirstName    { get; set; } = string.Empty;
    public string  LastName     { get; set; } = string.Empty;
    public string? Qualification { get; set; }
    public string? Specialization { get; set; }
    public DateOnly JoiningDate  { get; set; }
    public bool    IsActive      { get; set; } = true;
}

public class Parent : BaseEntity
{
    public int    ParentId   { get; set; }
    public int    UserId     { get; set; }
    public string FirstName  { get; set; } = string.Empty;
    public string LastName   { get; set; } = string.Empty;
    public string? Occupation { get; set; }
    public string? Phone      { get; set; }
    public string? AlternatePhone { get; set; }
}

public class RefreshToken : BaseEntity
{
    public int      TokenId   { get; set; }
    public int      UserId    { get; set; }
    public string   TokenHash { get; set; } = string.Empty;  // SHA-256 hash of the token
    public string   FamilyId  { get; set; } = string.Empty;  // For rotation tracking
    public string   IpHash    { get; set; } = string.Empty;
    public string   UaHash    { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool     IsRevoked { get; set; }
    public DateTime? RevokedAt { get; set; }
}

public class FeeStructure : BaseEntity
{
    public int      FeeStructureId { get; set; }
    public string   FeeName        { get; set; } = string.Empty;
    public int      AcademicYearId { get; set; }
    public int?     ClassId        { get; set; }    // null = applies to all classes
    public decimal  Amount         { get; set; }
    public bool     IsRecurring    { get; set; }
    public string?  Frequency      { get; set; }    // Monthly | Quarterly | Annual | OneTime
    public DateOnly? DueDate       { get; set; }
}

public class FeeInvoice : BaseEntity
{
    public int      InvoiceId      { get; set; }
    public string   InvoiceNumber  { get; set; } = string.Empty;
    public int      StudentId      { get; set; }
    public int      FeeStructureId { get; set; }
    public DateOnly? InvoiceMonth  { get; set; }
    public DateOnly DueDate        { get; set; }
    public decimal  TotalAmount    { get; set; }
    public decimal  PaidAmount     { get; set; }
    public decimal  BalanceAmount  { get; set; }    // Computed column
    public string   Status         { get; set; } = "Pending";
}

public class FeePayment : BaseEntity
{
    public int      PaymentId            { get; set; }
    public int      InvoiceId            { get; set; }
    public decimal  AmountPaid           { get; set; }
    public string   PaymentMethod        { get; set; } = string.Empty;
    public string?  TransactionReference { get; set; }
    public string?  ReceiptNumber        { get; set; }
    public DateOnly PaymentDate          { get; set; }
    public int      RecordedBy           { get; set; }
}

public class PaymentSession : BaseEntity
{
    public int      SessionId        { get; set; }
    public int      InvoiceId        { get; set; }
    public string   ExternalRef      { get; set; } = string.Empty;   // Stripe session ID
    public decimal  Amount           { get; set; }
    public string   Currency         { get; set; } = "usd";
    public string   Status           { get; set; } = "Pending";
    public DateTime ExpiresAt        { get; set; }
    public DateTime? CompletedAt     { get; set; }
    public string?  PaymentIntentRef { get; set; }
}
