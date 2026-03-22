export type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Late';

// ── Input types ───────────────────────────────────────────────────────────────

export interface AttendanceRecordInput {
  studentId: number;
  status:    AttendanceStatus;
  remarks?:  string;
}

export interface BulkMarkRequest {
  classId:        number;
  sectionId:      number;
  subjectId?:     number;
  attendanceDate: string;   // 'YYYY-MM-DD'
  period?:        number;
  records:        AttendanceRecordInput[];
}

export interface UpdateAttendanceRequest {
  status:   AttendanceStatus;
  remarks?: string;
}

// ── Response types ────────────────────────────────────────────────────────────

export interface BulkMarkResult {
  markedCount: number;
}

export interface ClassAttendanceRow {
  studentId:         number;
  studentName:       string;
  enrollmentNumber:  string;
  attendanceDate:    string;
  period:            number;
  status:            AttendanceStatus;
  remarks?:          string;
}

export interface StudentAttendanceDetail {
  attendanceId:   number;
  attendanceDate: string;
  period:         number;
  status:         AttendanceStatus;
  remarks?:       string;
  subjectName?:   string;
}

export interface AttendanceSummary {
  totalDays:            number;
  presentDays:          number;
  absentDays:           number;
  leaveDays:            number;
  lateDays:             number;
  attendancePercentage: number;
}

export interface StudentAttendanceResponse {
  details: StudentAttendanceDetail[];
  summary: AttendanceSummary;
}

// ── UI helper types ───────────────────────────────────────────────────────────

/** Represents a student row in the mark-attendance sheet with their current status */
export interface AttendanceSheetRow {
  studentId:        number;
  studentName:      string;
  enrollmentNumber: string;
  status:           AttendanceStatus;
  remarks:          string;
}
