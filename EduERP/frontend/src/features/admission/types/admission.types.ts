// ── API Response Shapes ───────────────────────────────────────────────────────

export interface AdmissionListItem {
  applicationId:    number;
  referenceNumber:  string;
  applicantName:    string;
  parentEmail:      string;
  parentPhone:      string;
  dateOfBirth:      string;
  gender:           string;
  applyingForClass: string;
  className:        string | null;
  academicYearId:   number;
  academicYear:     string;
  status:           AdmissionStatus;
  appliedAt:        string;
  reviewedAt:       string | null;
}

export interface AdmissionDetail extends AdmissionListItem {
  previousSchool:     string | null;
  parentName:         string;
  remarks:            string | null;
  convertedAt:        string | null;
  convertedStudentId: number | null;
}

export interface AdmissionCreated {
  applicationId:  number;
  referenceNumber: string;
}

export interface AcademicYear {
  academicYearId: number;
  yearName:       string;
  isCurrent:      boolean;
}

export interface ClassOption {
  classId:    number;
  className:  string;
  gradeLevel: number;
}

export interface SectionOption {
  sectionId:   number;
  sectionName: string;
  capacity:    number;
}

// ── Form / Request Shapes ─────────────────────────────────────────────────────

export interface AdmissionSubmitFormData {
  applicantName:    string;
  dateOfBirth:      string;
  gender:           string;
  applyingForClass: string;
  academicYearId:   number;
  classId?:         number | null;
  parentName:       string;
  parentEmail:      string;
  parentPhone:      string;
  previousSchool?:  string;
}

export interface AdmissionStatusUpdateData {
  status:   AdmissionStatus;
  remarks?: string;
}

export interface AdmissionConvertData {
  classId:      number;
  sectionId:    number;
  tempPassword: string;
}

// ── Domain Types ──────────────────────────────────────────────────────────────

export type AdmissionStatus =
  | 'Pending'
  | 'Reviewed'
  | 'Accepted'
  | 'Rejected'
  | 'Enrolled';

export interface AdmissionListParams {
  page?:           number;
  pageSize?:       number;
  search?:         string;
  academicYearId?: number;
  classId?:        number;
  status?:         AdmissionStatus | '';
}
