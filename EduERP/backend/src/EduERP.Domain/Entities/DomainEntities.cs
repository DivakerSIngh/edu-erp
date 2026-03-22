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
