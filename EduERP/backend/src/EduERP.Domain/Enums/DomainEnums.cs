namespace EduERP.Domain.Enums;

public enum UserRole
{
    Admin   = 1,
    Teacher = 2,
    Student = 3,
    Parent  = 4
}

public enum StudentStatus
{
    Active    = 1,
    Inactive  = 2,
    Graduated = 3,
    Withdrawn = 4
}

public enum AdmissionStatus
{
    Pending   = 1,
    Reviewed  = 2,
    Accepted  = 3,
    Rejected  = 4,
    Enrolled  = 5
}

public enum AttendanceStatus
{
    Present = 1,
    Absent  = 2,
    Late    = 3,
    Leave   = 4
}

public enum FeeStatus
{
    Pending       = 1,
    Paid          = 2,
    PartiallyPaid = 3,
    Overdue       = 4,
    Waived        = 5
}

public enum ExaminationType
{
    Unit     = 1,
    MidTerm  = 2,
    Final    = 3,
    Remedial = 4
}
