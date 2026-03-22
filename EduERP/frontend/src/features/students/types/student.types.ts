// ── Enums ─────────────────────────────────────────────────────────────────────

export type StudentStatus = 'Active' | 'Inactive' | 'Graduated';

// ── Response shapes ───────────────────────────────────────────────────────────

export interface ParentSummary {
  parentId:     number;
  fullName:     string;
  relationship: string;
  phoneNumber:  string;
  email:        string | null;
}

export interface StudentListItem {
  studentId:        number;
  enrollmentNumber: string;
  fullName:         string;
  className:        string;
  section:          string;
  gender:           string;
  status:           StudentStatus;
  email:            string | null;
  phone:            string | null;
  admissionDate:    string;
  academicYear?:    string;
  totalCount:       number;
}

export interface StudentDetail extends StudentListItem {
  userId:                 number;
  dateOfBirth:            string;
  bloodGroup:             string | null;
  address:                string | null;
  emergencyContactName:   string | null;
  emergencyContactPhone:  string | null;
  attendancePercentage:   number;
  academicYear:           string;
  classId:                number;
  sectionId:              number;
  academicYearId:         number;
  createdAt:              string;
  updatedAt:              string | null;
  parents:                ParentSummary[];
}

export interface StudentCreated {
  studentId:        number;
  enrollmentNumber: string;
}

// ── Request / Form shapes ─────────────────────────────────────────────────────

export interface StudentListParams {
  page?:          number;
  pageSize?:      number;
  search?:        string;
  classId?:       number;
  sectionId?:     number;
  academicYearId?: number;
  status?:        StudentStatus | '';
}

export interface StudentCreateFormData {
  firstName:    string;
  lastName:     string;
  dateOfBirth:  string;
  gender:       string;
  email?:       string;
  phone?:       string;
  address?:     string;
  bloodGroup?:  string;
  classId:      number;
  sectionId:    number;
  academicYearId: number;
  admissionDate:  string;
  emergencyContactName?:  string;
  emergencyContactPhone?: string;
}

export interface StudentUpdateFormData {
  firstName?:  string;
  lastName?:   string;
  email?:      string;
  phone?:      string;
  address?:    string;
  classId?:    number;
  sectionId?:  number;
  status?:     StudentStatus;
}
