# API Design — Education ERP System

> **Base URL:** `https://api.eduerp.com/api/v1`  
> **Auth:** JWT via HttpOnly Cookie (`access_token`)  
> **Docs:** Available at `/swagger` (dev/staging only)

---

## Response Envelope

All responses follow a unified envelope structure:

```json
{
  "success": true | false,
  "data": { ... } | null,
  "message": "Human-readable status message",
  "errors": null | [ { "field": "FieldName", "message": "Validation message" } ],
  "pagination": null | {
    "page": 1,
    "pageSize": 20,
    "totalCount": 250,
    "totalPages": 13
  },
  "traceId": "uuid-correlates-to-server-log"
}
```

### HTTP Status Code Conventions

| Code | Meaning |
|---|---|
| `200 OK` | Successful GET / PUT / PATCH |
| `201 Created` | Successful POST that creates a resource |
| `204 No Content` | Successful DELETE |
| `400 Bad Request` | Validation failure |
| `401 Unauthorized` | Missing / expired / tampered token |
| `403 Forbidden` | Authenticated but insufficient role |
| `404 Not Found` | Resource does not exist (or is soft-deleted) |
| `409 Conflict` | Duplicate resource (e.g., duplicate email) |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Unhandled exception (logged server-side) |

---

## Authentication Endpoints

### POST `/auth/login`
Email + Password login.

**Request:**
```json
{
  "email": "teacher@school.edu",
  "password": "SecureP@ss123",
  "rememberMe": false
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "userId": 42,
    "fullName": "Jane Smith",
    "email": "teacher@school.edu",
    "role": "Teacher",
    "permissions": ["attendance.write", "results.write", "students.read"]
  },
  "message": "Login successful"
}
```
Access token and refresh token are set as HttpOnly cookies:
```
Set-Cookie: access_token=<JWT>; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=600
Set-Cookie: refresh_token=<token>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh; Max-Age=604800
```

---

### POST `/auth/otp/send`
Request OTP sent to registered email.

**Request:**
```json
{ "email": "parent@email.com" }
```

**Response `200 OK`:**
```json
{
  "success": true,
  "data": { "expiresInSeconds": 300 },
  "message": "OTP sent to your email"
}
```

---

### POST `/auth/otp/verify`
Verify OTP and issue tokens.

**Request:**
```json
{
  "email": "parent@email.com",
  "otp": "847293"
}
```

**Response `200 OK`:** Same as `/auth/login` with cookies set.

**Error `400`:**
```json
{
  "success": false,
  "errors": [{ "field": "Otp", "message": "Invalid or expired OTP" }]
}
```

---

### POST `/auth/refresh`
Rotate access token using refresh token cookie.

No request body needed — refresh token is read from cookie automatically.

**Response `200 OK`:** New `access_token` cookie set.

**Error `401`:** Refresh token invalid, expired, or IP/device mismatch.

---

### POST `/auth/logout`
Revoke all tokens and clear cookies.

**Response `204 No Content`** — Cookies cleared, refresh token revoked in DB.

---

### GET `/auth/me`
Returns the currently authenticated user's profile.

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "userId": 42,
    "fullName": "Jane Smith",
    "email": "teacher@school.edu",
    "role": "Teacher",
    "phone": "+1-555-0100",
    "profileImageUrl": "https://cdn.eduerp.com/photos/42.jpg",
    "lastLoginAt": "2026-03-20T09:15:00Z"
  }
}
```

---

## Student Management Endpoints

### GET `/students`
Paginated list with filtering and search.

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `page` | int | Page number (default: 1) |
| `pageSize` | int | Items per page (default: 20, max: 100) |
| `search` | string | Name / enrollment number search |
| `classId` | int? | Filter by class |
| `status` | string? | `Active`, `Inactive`, `Graduated` |
| `academicYearId` | int? | Filter by academic year |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "studentId": 101,
      "enrollmentNumber": "STU-2024-0101",
      "fullName": "Ahmed Khan",
      "className": "Grade 10-A",
      "section": "A",
      "dateOfBirth": "2010-05-15",
      "gender": "Male",
      "status": "Active",
      "parentName": "Tariq Khan",
      "parentPhone": "+1-555-0200"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "totalCount": 540, "totalPages": 27 }
}
```

---

### POST `/students`
Create a new student.

**Request:**
```json
{
  "firstName": "Ahmed",
  "lastName": "Khan",
  "dateOfBirth": "2010-05-15",
  "gender": "Male",
  "email": "ahmed.khan@student.edu",
  "phone": "+1-555-0300",
  "address": "123 Maple Street, Springfield",
  "classId": 5,
  "sectionId": 2,
  "academicYearId": 3,
  "admissionDate": "2024-01-10",
  "emergencyContactName": "Tariq Khan",
  "emergencyContactPhone": "+1-555-0200"
}
```

**Response `201 Created`:**
```json
{
  "success": true,
  "data": { "studentId": 101, "enrollmentNumber": "STU-2024-0101" },
  "message": "Student created successfully"
}
```

---

### GET `/students/{id}`
Full student profile.

**Response `200 OK`:** Complete student object with class, fees summary, attendance percentage.

---

### PUT `/students/{id}`
Full update of student profile.

**Response `200 OK`:** Updated student object.

---

### DELETE `/students/{id}`
Soft delete (sets `IsDeleted = 1`).

**Response `204 No Content`**

---

## Admission Endpoints

### GET `/admission/applications`
List admission applications with filters.

**Query Params:** `page`, `pageSize`, `status` (`Pending`, `Reviewed`, `Accepted`, `Rejected`), `academicYearId`

---

### POST `/admission/applications`
Submit a new admission application (public endpoint — no auth required).

**Request:**
```json
{
  "applicantName": "Sara Ali",
  "dateOfBirth": "2011-03-20",
  "gender": "Female",
  "applyingForClass": "Grade 5",
  "academicYearId": 3,
  "parentName": "Imran Ali",
  "parentEmail": "imran.ali@email.com",
  "parentPhone": "+1-555-0400",
  "previousSchool": "Greenwood Elementary",
  "documents": ["transcript.pdf", "birthcert.pdf"]
}
```

**Response `201 Created`:** Application reference number returned.

---

### PATCH `/admission/applications/{id}/status`
Update application status (Admin only).

**Request:**
```json
{
  "status": "Accepted",
  "remarks": "All documents verified, seat allocated in Grade 5-B"
}
```

---

## Attendance Endpoints

### POST `/attendance/mark`
Bulk attendance entry for a class session.

**Request:**
```json
{
  "classId": 5,
  "sectionId": 2,
  "date": "2026-03-20",
  "period": 1,
  "records": [
    { "studentId": 101, "status": "Present" },
    { "studentId": 102, "status": "Absent" },
    { "studentId": 103, "status": "Late", "remarks": "Arrived 10 mins late" }
  ]
}
```

**Response `200 OK`:** Summary of marked records.

---

### GET `/attendance/class/{classId}`
Monthly attendance report for a class.

**Query Params:** `month` (1-12), `year`, `sectionId`

---

### GET `/attendance/student/{studentId}`
Individual student attendance summary.

**Query Params:** `academicYearId`, `from`, `to`

**Response** includes `presentDays`, `absentDays`, `lateDays`, `attendancePercentage`.

---

## Examination Endpoints

### GET `/examinations`
List scheduled examinations.

**Query Params:** `academicYearId`, `classId`, `type` (`MidTerm`, `Final`, `Unit`)

---

### POST `/examinations`
Create new examination (Admin only).

---

### POST `/examinations/{id}/results`
Bulk entry of exam results (Teacher/Admin).

**Request:**
```json
{
  "subjectId": 10,
  "results": [
    { "studentId": 101, "marksObtained": 87, "maxMarks": 100, "grade": "A", "remarks": "" },
    { "studentId": 102, "marksObtained": 55, "maxMarks": 100, "grade": "C", "remarks": "Needs improvement" }
  ]
}
```

---

### GET `/examinations/{id}/results`
Get results for an examination. Students see only their own results. Teachers see class results.

---

## Fees Endpoints

### GET `/fees/structures`
List fee structures for an academic year.

---

### POST `/fees/structures`
Create fee structure (Admin only).

---

### GET `/fees/invoices`
List fee invoices.

**Query Params:** `studentId`, `status` (`Pending`, `Paid`, `Overdue`, `PartiallyPaid`), `academicYearId`

---

### POST `/fees/payments`
Record a payment.

**Request:**
```json
{
  "invoiceId": 500,
  "amountPaid": 5000.00,
  "paymentMethod": "BankTransfer",
  "transactionReference": "TXN-2026-0001",
  "paymentDate": "2026-03-20"
}
```

---

### GET `/fees/student/{studentId}/ledger`
Full fee ledger for a student (invoices + payments).

---

## Communication Endpoints

### POST `/communication/announcements`
Broadcast announcement (Admin/Teacher).

**Request:**
```json
{
  "title": "School Closed - Public Holiday",
  "body": "School will remain closed on March 23rd...",
  "targetRoles": ["Student", "Parent", "Teacher"],
  "publishAt": "2026-03-20T08:00:00Z",
  "expiresAt": "2026-03-23T23:59:00Z"
}
```

---

### GET `/communication/announcements`
List active announcements for the authenticated user's role.

---

### POST `/communication/messages`
Send a direct message.

---

## Reports Endpoints

### GET `/reports/attendance`
Attendance analytics by class/date range. Admin/Teacher only.

**Query Params:** `academicYearId`, `classId`, `from`, `to`, `format` (`json`, `csv`, `pdf`)

---

### GET `/reports/fees`
Fee collection summary. Admin only.

**Query Params:** `academicYearId`, `month`, `status`

---

### GET `/reports/academic`
Academic performance report. Admin/Teacher.

**Query Params:** `examinationId`, `classId`, `subjectId`

---

## Swagger / OpenAPI Documentation

### Configuration

```csharp
// Swagger enabled in Development and Staging only
// Bearer auth support added for testing
// XML comments auto-included from Controllers
// Response schemas documented via [ProducesResponseType]
```

Accessible at: `https://api.eduerp.com/swagger` (blocked in Production via environment check)

### Standard Controller Annotations

```csharp
/// <summary>Retrieves a paginated list of students</summary>
/// <param name="request">Pagination and filter parameters</param>
/// <returns>Paginated student list</returns>
[ProducesResponseType(typeof(ApiResponseDto<IEnumerable<StudentResponseDto>>), 200)]
[ProducesResponseType(typeof(ApiResponseDto<object>), 401)]
[ProducesResponseType(typeof(ApiResponseDto<object>), 403)]
```
