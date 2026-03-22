namespace EduERP.Application.DTOs.Attendance;

// ── Input DTOs ────────────────────────────────────────────────────────────────

public record AttendanceRecordInputDto(
    int     StudentId,
    string  Status,          // Present | Absent | Leave | Late
    string? Remarks
);

public record BulkMarkRequestDto(
    int       ClassId,
    int       SectionId,
    int?      SubjectId,
    DateOnly  AttendanceDate,
    byte?     Period,        // null = full-day
    List<AttendanceRecordInputDto> Records
);

public record UpdateAttendanceDto(
    string  Status,
    string? Remarks
);

// ── Output DTOs ───────────────────────────────────────────────────────────────

public record BulkMarkResultDto(int MarkedCount);

public record ClassAttendanceRowDto(
    int      StudentId,
    string   StudentName,
    string   EnrollmentNumber,
    DateOnly AttendanceDate,
    byte     Period,
    string   Status,
    string?  Remarks
);

public record StudentAttendanceDetailDto(
    int      AttendanceId,
    DateOnly AttendanceDate,
    byte     Period,
    string   Status,
    string?  Remarks,
    string?  SubjectName
);

public record AttendanceSummaryDto(
    int     TotalDays,
    int     PresentDays,
    int     AbsentDays,
    int     LeaveDays,
    int     LateDays,
    decimal AttendancePercentage
);

public record StudentAttendanceResponseDto(
    IEnumerable<StudentAttendanceDetailDto> Details,
    AttendanceSummaryDto                    Summary
);
