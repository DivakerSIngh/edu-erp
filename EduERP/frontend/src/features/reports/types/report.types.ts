// ── Student Strength ─────────────────────────────────────────────────────────
export interface StudentStrengthItem {
  classId:      number;
  className:    string;
  sectionId:    number;
  sectionName:  string;
  gender:       string;
  studentCount: number;
}

// ── Low Attendance ───────────────────────────────────────────────────────────
export interface LowAttendanceStudent {
  studentId:        number;
  enrollmentNumber: string;
  studentName:      string;
  className:        string;
  sectionName:      string;
  presentDays:      number;
  lateDays:         number;
  totalDays:        number;
  attendancePct:    number;
}

// ── Individual Report Card ───────────────────────────────────────────────────
export interface ReportCardHeader {
  studentId:        number;
  enrollmentNumber: string;
  studentName:      string;
  className:        string;
  sectionName:      string;
  academicYear:     string;
}

export interface ReportCardResultRow {
  examinationId: number;
  examName:      string;
  examType:      string;
  startDate:     string;
  subjectName:   string;
  subjectCode:   string;
  marksObtained: number;
  maxMarks:      number;
  passMarks:     number;
  grade:         string;
  result:        string;  // 'Pass' | 'Fail'
}

export interface IndividualReportCard {
  header:  ReportCardHeader;
  results: ReportCardResultRow[];
}

// ── Subject Performance ──────────────────────────────────────────────────────
export interface SubjectPerformanceItem {
  subjectId:     number;
  subjectName:   string;
  subjectCode:   string;
  className:     string;
  totalStudents: number;
  avgMarks:      number;
  maxMarks:      number;
  avgPct:        number;
  passCount:     number;
  failCount:     number;
  passRate:      number;
}

// ── Payment History ──────────────────────────────────────────────────────────
export interface PaymentHistoryItem {
  feePaymentId:     number;
  receiptNumber:    string;
  paymentDate:      string;
  amountPaid:       number;
  paymentMethod:    string;
  invoiceNumber:    string;
  feeName:          string;
  studentId:        number;
  enrollmentNumber: string;
  studentName:      string;
  className:        string;
  sectionName:      string;
  academicYear:     string;
}

// ── Admission Stats ──────────────────────────────────────────────────────────
export interface AdmissionStatItem {
  academicYearId:   number;
  yearName:         string;
  status:           string;
  applicationCount: number;
  convertedCount:   number;
}

// ── Student Directory ────────────────────────────────────────────────────────
export interface StudentDirectoryItem {
  studentId:        number;
  enrollmentNumber: string;
  studentName:      string;
  gender:           string;
  dateOfBirth:      string;
  email:            string;
  phone:            string;
  status:           string;
  className:        string;
  sectionName:      string;
  academicYear:     string;
  admissionDate:    string;
}

// ── Request params ───────────────────────────────────────────────────────────
export interface LowAttendanceParams {
  classId:      number;
  month:        number;
  year:         number;
  thresholdPct: number;
}

export interface SubjectPerformanceParams {
  academicYearId: number;
  subjectId?:     number;
  classId?:       number;
}

export interface PaymentHistoryParams {
  fromDate: string;   // YYYY-MM-DD
  toDate:   string;
  classId?: number;
}

export interface StudentDirectoryParams {
  academicYearId?: number;
  classId?:        number;
  sectionId?:      number;
  gender?:         string;
  status?:         string;
}
