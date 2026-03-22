// ── Enums ─────────────────────────────────────────────────────────────────────

export type ExamType = 'Unit' | 'MidTerm' | 'Final' | 'Remedial';

// ── Response shapes ───────────────────────────────────────────────────────────

export interface ExaminationListItem {
  examinationId: number;
  examName:      string;
  examType:      ExamType;
  startDate:     string;
  endDate:       string;
  maxMarks:      number;
  passMarks:     number;
  isPublished:   boolean;
  className:     string;
  academicYear:  string;
  totalCount:    number;
}

export interface ExaminationDetail extends ExaminationListItem {
  classId:        number;
  academicYearId: number;
  createdAt:      string;
}

export interface ExaminationCreated {
  examinationId: number;
}

export interface ExamResultItem {
  resultId:         number;
  studentId:        number;
  studentName:      string;
  enrollmentNumber: string;
  subjectId:        number;
  subjectName:      string;
  subjectCode:      string;
  marksObtained:    number;
  maxMarks:         number;
  grade:            string | null;
  remarks:          string | null;
  result:           string;
}

export interface ReportCardSubject {
  examName:      string;
  examType:      string;
  subjectName:   string;
  marksObtained: number;
  maxMarks:      number;
  result:        string;
  remarks:       string | null;
  grade:         string | null;
}

export interface ReportCardSummary {
  totalMarks:    number;
  totalMaxMarks: number;
  percentage:    number;
  overallGrade:  string;
}

export interface ReportCard {
  subjects: ReportCardSubject[];
  summary:  ReportCardSummary | null;
}

export interface Subject {
  subjectId:   number;
  subjectCode: string;
  subjectName: string;
  isElective:  boolean;
}

export interface ClassStudent {
  studentId:        number;
  studentName:      string;
  enrollmentNumber: string;
  section:          string;
}

// ── Request / Form shapes ─────────────────────────────────────────────────────

export interface ExaminationListParams {
  page?:          number;
  pageSize?:      number;
  academicYearId?: number;
  classId?:       number;
  examType?:      ExamType | '';
}

export interface ExaminationCreateFormData {
  examName:       string;
  examType:       ExamType;
  classId:        number;
  academicYearId: number;
  startDate:      string;
  endDate:        string;
  maxMarks:       number;
  passMarks:      number;
}

export interface ExaminationUpdateFormData {
  examName?:  string;
  examType?:  ExamType;
  startDate?: string;
  endDate?:   string;
  maxMarks?:  number;
  passMarks?: number;
}

export interface ResultRow {
  studentId:    number;
  subjectId:    number;
  marksObtained: number;
  maxMarks:     number;
  remarks?:     string;
}

export interface BulkResultEntry {
  results: ResultRow[];
}
