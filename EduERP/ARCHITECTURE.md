# Education ERP System — Enterprise Architecture Design

> **Version:** 1.0.0 | **Stack:** React 18 + .NET 9 + SQL Server 2022  
> **Pattern:** Clean Architecture (Onion) | **Auth:** JWT + HttpOnly Cookies + RBAC

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Pattern](#3-architecture-pattern)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Database Architecture](#6-database-architecture)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [API Design Strategy](#8-api-design-strategy)
9. [Security Architecture](#9-security-architecture)
10. [Scalability & Performance](#10-scalability--performance)

---

## 1. System Overview

The Education ERP is an enterprise-grade multi-tenant platform managing the full lifecycle of an educational institution — from student admission through graduation. The system is designed for:

- **High availability** (99.9% SLA target)
- **Role-segregated access** (Admin, Teacher, Student, Parent)
- **Zero-trust security** (every token bound to IP + device)
- **Horizontal scalability** (stateless API, Redis-backed sessions)

### Core Modules

| Module | Responsibility |
|---|---|
| **Admission** | Application intake, workflow, enrollment decisions |
| **Student Management** | Profile, enrollment, class assignment, academic history |
| **Attendance** | Daily/session-level tracking, reports, notifications |
| **Examination** | Scheduling, mark entry, result publishing, grade cards |
| **Fees** | Fee structure, invoicing, payment tracking, reminders |
| **Communication** | Announcements, notices, messaging, parent portal |
| **Reports** | Cross-module analytics, dashboards, exports |

---

## 2. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React 18 + TypeScript | Component model, hooks, strong typing |
| **State** | Redux Toolkit + RTK Query | Predictable state, cache, optimistic updates |
| **HTTP Client** | Axios | Interceptors, retry, CSRF injection |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first, accessible components |
| **Backend** | .NET 9 / ASP.NET Core | Performance, DI, minimal API support |
| **Data Access** | Dapper | Thin SP executor, no ORM magic |
| **Database** | SQL Server 2022 | ACID, row-level security, JSON support |
| **Cache** | Redis 7 | Token blacklist, rate limiting, session cache |
| **Auth** | JWT + HttpOnly Cookies | Stateless auth, CSRF-safe cookie storage |
| **OTP Delivery** | SendGrid / SMTP | Email-based OTP with TOTP fallback |
| **Logging** | Serilog → Seq / Azure Monitor | Structured, queryable, centralized |
| **Background Jobs** | Hangfire + Redis | Scheduled tasks, async notifications |
| **API Docs** | Swagger / OpenAPI 3.0 | Versioned, auto-generated, bearer auth |
| **Containerization** | Docker + Docker Compose | Reproducible environments |
| **Reverse Proxy** | Nginx / Azure App Gateway | SSL termination, load balancing |

---

## 3. Architecture Pattern

### Clean Architecture — Dependency Rule

```
┌────────────────────────────────────────────────────────┐
│                  API / Presentation Layer               │
│       Controllers · Middleware · Filters · Swagger      │
│                   [EduERP.API]                          │
├────────────────────────────────────────────────────────┤
│                   Application Layer                     │
│       Services · DTOs · Validators · Mappings           │
│                [EduERP.Application]                     │
├────────────────────────────────────────────────────────┤
│                    Domain Layer                         │
│       Entities · Enums · Domain Events · Exceptions     │
│                  [EduERP.Domain]                        │
├────────────────────────────────────────────────────────┤
│                Infrastructure Layer                     │
│     Repositories · JWT · Cache · Email · Jobs           │
│               [EduERP.Infrastructure]                   │
└────────────────────────────────────────────────────────┘
         ↑ All dependencies point INWARD only ↑
```

**Key Rule:** Domain has zero external dependencies. Infrastructure implements interfaces defined in Domain/Application.

---

## 4. Frontend Architecture

### Folder Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── app/
│   │   ├── App.tsx                        # Root: providers, router
│   │   ├── store.ts                       # Redux store + middleware
│   │   └── rootReducer.ts                 # Combined slice reducers
│   │
│   ├── assets/
│   │   ├── images/
│   │   └── styles/
│   │       ├── globals.css
│   │       └── variables.css
│   │
│   ├── components/                        # Pure, reusable UI components
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.test.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   ├── Table/
│   │   │   │   ├── DataTable.tsx          # Generic paginated table
│   │   │   │   └── TableFilters.tsx
│   │   │   ├── Pagination/
│   │   │   ├── Loader/
│   │   │   └── Toast/
│   │   ├── layout/
│   │   │   ├── Header/
│   │   │   │   └── Header.tsx
│   │   │   ├── Sidebar/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── NavItem.tsx
│   │   │   ├── PublicLayout.tsx           # Unauthenticated pages
│   │   │   └── PrivateLayout.tsx          # Authenticated shell
│   │   └── guards/
│   │       ├── AuthGuard.tsx              # Redirect if not authed
│   │       └── RoleGuard.tsx              # Redirect if wrong role
│   │
│   ├── features/                          # Feature-sliced modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── OtpForm.tsx
│   │   │   │   └── ForgotPasswordForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuthForm.ts
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── OtpLoginPage.tsx
│   │   │   ├── services/
│   │   │   │   └── authService.ts
│   │   │   ├── store/
│   │   │   │   └── authSlice.ts
│   │   │   ├── types/
│   │   │   │   └── auth.types.ts
│   │   │   └── index.ts
│   │   ├── admission/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   │   ├── AdmissionListPage.tsx
│   │   │   │   ├── AdmissionFormPage.tsx
│   │   │   │   └── AdmissionDetailPage.tsx
│   │   │   ├── services/
│   │   │   │   └── admissionService.ts
│   │   │   ├── store/
│   │   │   │   └── admissionSlice.ts
│   │   │   └── types/
│   │   ├── students/
│   │   ├── attendance/
│   │   ├── examination/
│   │   ├── fees/
│   │   ├── communication/
│   │   └── reports/
│   │
│   ├── hooks/                             # Cross-feature custom hooks
│   │   ├── useAuth.ts                     # Auth state & actions
│   │   ├── usePermission.ts               # Role-based permission check
│   │   ├── usePagination.ts
│   │   ├── useDebounce.ts
│   │   └── useLocalizedDate.ts
│   │
│   ├── services/
│   │   └── api/
│   │       ├── axiosInstance.ts           # Base client + interceptors
│   │       └── apiErrorHandler.ts         # Centralized error mapping
│   │
│   ├── router/
│   │   ├── index.tsx                      # <BrowserRouter> + routes
│   │   ├── routeConstants.ts              # Path constants
│   │   └── lazyImports.ts                 # React.lazy() imports
│   │
│   ├── store/
│   │   └── uiSlice.ts                     # Global UI state (sidebar, theme)
│   │
│   ├── types/
│   │   ├── api.types.ts                   # ApiResponse<T>, PaginatedResponse<T>
│   │   ├── common.types.ts
│   │   └── roles.types.ts                 # Role enum
│   │
│   ├── config/
│   │   └── env.ts                         # Type-safe env vars
│   │
│   └── main.tsx
│
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| Feature-sliced modules | Each module owns its store, services, types — no cross-feature coupling |
| Tokens in HttpOnly cookies | Never accessible from JS — eliminates XSS-based token theft |
| Axios `withCredentials: true` | Cookies sent automatically on every request |
| Redux Toolkit | Immutable state, DevTools, built-in thunk support |
| `AuthGuard` + `RoleGuard` | Declarative route protection, separate auth from authorization |
| `React.lazy` + `Suspense` | Code splitting per feature — reduces initial bundle by 60-80% |

---

## 5. Backend Architecture

### Folder Structure

```
backend/
├── EduERP.sln
├── src/
│   │
│   ├── EduERP.API/                              # Presentation Layer
│   │   ├── Controllers/
│   │   │   └── v1/
│   │   │       ├── AuthController.cs
│   │   │       ├── AdmissionController.cs
│   │   │       ├── StudentController.cs
│   │   │       ├── AttendanceController.cs
│   │   │       ├── ExaminationController.cs
│   │   │       ├── FeesController.cs
│   │   │       ├── CommunicationController.cs
│   │   │       └── ReportsController.cs
│   │   ├── Middleware/
│   │   │   ├── ExceptionHandlingMiddleware.cs
│   │   │   ├── RequestLoggingMiddleware.cs
│   │   │   └── SecurityHeadersMiddleware.cs
│   │   ├── Filters/
│   │   │   └── ValidationFilter.cs
│   │   ├── Extensions/
│   │   │   ├── ServiceCollectionExtensions.cs
│   │   │   ├── SwaggerExtensions.cs
│   │   │   ├── AuthenticationExtensions.cs
│   │   │   └── CorsExtensions.cs
│   │   ├── Program.cs
│   │   ├── appsettings.json
│   │   └── appsettings.Production.json
│   │
│   ├── EduERP.Application/                      # Application Layer
│   │   ├── Interfaces/
│   │   │   ├── IAuthService.cs
│   │   │   ├── IStudentService.cs
│   │   │   ├── IAdmissionService.cs
│   │   │   ├── IAttendanceService.cs
│   │   │   ├── IExaminationService.cs
│   │   │   ├── IFeesService.cs
│   │   │   ├── ICommunicationService.cs
│   │   │   └── IReportService.cs
│   │   ├── Services/
│   │   │   ├── AuthService.cs
│   │   │   ├── StudentService.cs
│   │   │   ├── AdmissionService.cs
│   │   │   ├── AttendanceService.cs
│   │   │   ├── ExaminationService.cs
│   │   │   ├── FeesService.cs
│   │   │   ├── CommunicationService.cs
│   │   │   └── ReportService.cs
│   │   ├── DTOs/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginRequestDto.cs
│   │   │   │   ├── OtpRequestDto.cs
│   │   │   │   ├── OtpVerifyDto.cs
│   │   │   │   └── TokenResponseDto.cs
│   │   │   ├── Student/
│   │   │   │   ├── StudentCreateDto.cs
│   │   │   │   ├── StudentUpdateDto.cs
│   │   │   │   └── StudentResponseDto.cs
│   │   │   ├── Admission/
│   │   │   ├── Attendance/
│   │   │   ├── Examination/
│   │   │   ├── Fees/
│   │   │   └── Common/
│   │   │       ├── PagedRequestDto.cs
│   │   │       ├── PagedResponseDto.cs
│   │   │       └── ApiResponseDto.cs
│   │   ├── Validators/                          # FluentValidation
│   │   │   ├── Auth/
│   │   │   └── Student/
│   │   └── Mappings/
│   │       └── AutoMapperProfile.cs
│   │
│   ├── EduERP.Domain/                           # Domain Layer (no deps)
│   │   ├── Entities/
│   │   │   ├── BaseEntity.cs
│   │   │   ├── User.cs
│   │   │   ├── Student.cs
│   │   │   ├── Teacher.cs
│   │   │   ├── Parent.cs
│   │   │   ├── AdmissionApplication.cs
│   │   │   ├── AttendanceRecord.cs
│   │   │   ├── ExamResult.cs
│   │   │   ├── FeeInvoice.cs
│   │   │   └── RefreshToken.cs
│   │   ├── Enums/
│   │   │   ├── UserRole.cs
│   │   │   ├── AdmissionStatus.cs
│   │   │   ├── AttendanceStatus.cs
│   │   │   └── FeeStatus.cs
│   │   └── Exceptions/
│   │       ├── DomainException.cs
│   │       ├── NotFoundException.cs
│   │       ├── UnauthorizedException.cs
│   │       └── ConflictException.cs
│   │
│   └── EduERP.Infrastructure/                   # Infrastructure Layer
│       ├── Data/
│       │   ├── Repositories/
│       │   │   ├── BaseRepository.cs
│       │   │   ├── AuthRepository.cs
│       │   │   ├── StudentRepository.cs
│       │   │   ├── AdmissionRepository.cs
│       │   │   ├── AttendanceRepository.cs
│       │   │   ├── ExaminationRepository.cs
│       │   │   └── FeesRepository.cs
│       │   ├── Interfaces/
│       │   │   ├── IBaseRepository.cs
│       │   │   ├── IAuthRepository.cs
│       │   │   └── IStudentRepository.cs
│       │   └── DbConnectionFactory.cs
│       ├── Security/
│       │   ├── JwtTokenService.cs
│       │   ├── CookieService.cs
│       │   ├── OtpService.cs
│       │   └── PasswordHasher.cs
│       ├── Caching/
│       │   ├── IRedisCacheService.cs
│       │   └── RedisCacheService.cs
│       ├── Email/
│       │   ├── IEmailService.cs
│       │   └── SmtpEmailService.cs
│       ├── BackgroundJobs/
│       │   ├── TokenCleanupJob.cs
│       │   └── NotificationDispatchJob.cs
│       └── DependencyInjection.cs
│
└── tests/
    ├── EduERP.API.Tests/
    ├── EduERP.Application.Tests/
    └── EduERP.Infrastructure.Tests/
```

---

## 6. Database Architecture

### Entity Relationship Overview

```
Users ──────────── RefreshTokens
  │
  ├── Students ───── Enrollments ──── Classes
  │       │                              │
  │       ├── AttendanceRecords ─────────┘
  │       ├── ExamResults ──── Examinations ── Subjects
  │       ├── FeeInvoices ──── FeeStructures
  │       └── AdmissionApplications
  │
  ├── Teachers ──── ClassAssignments
  │
  ├── Parents ───── StudentParentMap
  │
  └── AuditLogs
```

### Audit Fields Convention

Every table includes:

```sql
CreatedAt   DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
CreatedBy   INT          NOT NULL,
UpdatedAt   DATETIME2(7) NULL,
UpdatedBy   INT          NULL,
IsDeleted   BIT          NOT NULL DEFAULT 0,
DeletedAt   DATETIME2(7) NULL,
DeletedBy   INT          NULL
```

**Soft delete** is enforced everywhere. Hard deletes are prohibited in application code.

---

## 7. Authentication & Authorization

### Token Strategy

| Token | Storage | Expiry | Bound To |
|---|---|---|---|
| Access Token | HttpOnly, Secure, SameSite=Strict Cookie | 10 minutes | IP + User-Agent hash |
| Refresh Token | HttpOnly, Secure, SameSite=Strict Cookie | 7 days | IP + User-Agent hash + DB record |

### Token Binding Security

Each token payload includes:

```json
{
  "sub": "userId",
  "role": "Teacher",
  "ip_hash": "sha256(clientIP + secret_salt)",
  "ua_hash": "sha256(userAgent + secret_salt)",
  "jti": "unique-token-id",
  "iat": 1710000000,
  "exp": 1710000600
}
```

On every protected request, the API:
1. Validates JWT signature
2. Checks token is not in Redis blacklist (logout/revocation)
3. Recomputes `ip_hash` and `ua_hash` from request and compares
4. If either hash mismatches → `401 Unauthorized` (stolen token rejected)

### RBAC Permission Matrix

| Endpoint Group | Admin | Teacher | Student | Parent |
|---|:---:|:---:|:---:|:---:|
| User Management | ✅ | ❌ | ❌ | ❌ |
| Student CRUD | ✅ | 🔍 Read | 🔍 Self | 🔍 Child |
| Attendance Entry | ✅ | ✅ | ❌ | ❌ |
| Attendance View | ✅ | ✅ Class | ✅ Self | ✅ Child |
| Exam Results Entry | ✅ | ✅ | ❌ | ❌ |
| Exam Results View | ✅ | ✅ | ✅ Self | ✅ Child |
| Fee Structure CRUD | ✅ | ❌ | ❌ | ❌ |
| Fee Payment View | ✅ | ❌ | ✅ Self | ✅ Child |
| Reports Full | ✅ | 🔍 Limited | ❌ | ❌ |
| Announcements Create | ✅ | ✅ | ❌ | ❌ |

### Authentication Flow Diagram

```
╔═══════════════════════════════════════════════════════╗
║              Email + Password Login Flow              ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  Client           API Server           Redis    DB   ║
║    │                   │                  │      │   ║
║    │──POST /auth/login─▶│                 │      │   ║
║    │  {email,password}  │──usp_Auth_      │      │   ║
║    │                    │  ValidateUser──────────▶│   ║
║    │                    │◀─ UserRecord ──────────│   ║
║    │                    │                  │      │   ║
║    │                    │ · Hash IP+UA     │      │   ║
║    │                    │ · Sign JWT       │      │   ║
║    │                    │ · Sign Refresh   │      │   ║
║    │                    │──Store RT────────────────▶│  ║
║    │◀─Set-Cookie AT+RT─│                  │      │   ║
║    │   (HttpOnly)        │                  │      │   ║
║                                                       ║
╠═══════════════════════════════════════════════════════╣
║              Refresh Token Flow                       ║
╠═══════════════════════════════════════════════════════╣
║    │                   │                  │      │   ║
║    │─POST /auth/refresh▶│ (RT cookie sent) │      │   ║
║    │                    │ · Verify RT sig  │      │   ║
║    │                    │ · Lookup in DB ──────────▶│  ║
║    │                    │ · Validate IP+UA │      │   ║
║    │                    │ · Rotate RT     │      │   ║
║    │◀─New AT cookie────│                  │      │   ║
║                                                       ║
╠═══════════════════════════════════════════════════════╣
║              OTP Login Flow                           ║
╠═══════════════════════════════════════════════════════╣
║    │                   │                  │      │   ║
║    │─POST /auth/otp/   ▶│                 │      │   ║
║    │  send {email}      │ · Generate OTP  │      │   ║
║    │                    │ · Hash OTP      │      │   ║
║    │                    │──SET otp:email──▶│ 5min │   ║
║    │                    │──Send email     │      │   ║
║    │◀─200 OK───────────│                  │      │   ║
║    │                    │                  │      │   ║
║    │─POST /auth/otp/    │                  │      │   ║
║    │  verify {otp}      │─GET otp:email──▶│      │   ║
║    │                    │ · Compare hash  │      │   ║
║    │                    │─DEL otp:email──▶│      │   ║
║    │◀─Set-Cookie AT+RT─│                  │      │   ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

---

## 8. API Design Strategy

### Versioning

All endpoints are prefixed with `/api/v1/`. When breaking changes are required, `/api/v2/` is introduced without removing v1 until a deprecation window closes.

### Response Envelope

```json
{
  "success": true,
  "data": { ... },
  "message": "Students retrieved successfully",
  "errors": null,
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 250,
    "totalPages": 13
  },
  "traceId": "abc-123-xyz"
}
```

### Error Response

```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "errors": [
    { "field": "Email", "message": "Email is required" },
    { "field": "Password", "message": "Minimum 8 characters" }
  ],
  "traceId": "abc-123-xyz"
}
```

### Key Endpoint Groups

```
POST   /api/v1/auth/login                → Email+Password login
POST   /api/v1/auth/otp/send             → Send OTP to email
POST   /api/v1/auth/otp/verify           → Verify OTP, issue tokens
POST   /api/v1/auth/refresh              → Rotate access token
POST   /api/v1/auth/logout               → Revoke tokens, clear cookies
GET    /api/v1/auth/me                   → Current user profile

GET    /api/v1/students                  → Paginated student list
POST   /api/v1/students                  → Create student
GET    /api/v1/students/{id}             → Student detail
PUT    /api/v1/students/{id}             → Update student
DELETE /api/v1/students/{id}             → Soft delete

GET    /api/v1/admission/applications    → List applications
POST   /api/v1/admission/applications    → Submit application
PATCH  /api/v1/admission/applications/{id}/status → Update status

POST   /api/v1/attendance/mark           → Mark attendance (bulk)
GET    /api/v1/attendance/class/{classId}→ Class attendance report
GET    /api/v1/attendance/student/{id}   → Student attendance summary

GET    /api/v1/examinations              → List exams
POST   /api/v1/examinations/{id}/results → Submit results (bulk)
GET    /api/v1/examinations/{id}/results → Get results

GET    /api/v1/fees/invoices             → Fee invoices
POST   /api/v1/fees/payments             → Record payment
GET    /api/v1/fees/student/{id}/ledger  → Student fee ledger

POST   /api/v1/communication/announce    → Create announcement
GET    /api/v1/communication/notices     → List notices
POST   /api/v1/communication/messages    → Send message

GET    /api/v1/reports/attendance        → Attendance analytics
GET    /api/v1/reports/fees              → Fee collection report
GET    /api/v1/reports/academic          → Academic performance
```

---

## 9. Security Architecture

See full detail in [docs/SECURITY.md](docs/SECURITY.md)

### Summary

| Threat | Mitigation |
|---|---|
| **XSS** | HttpOnly cookies (tokens unreachable by JS), CSP headers, DOMPurify for user content |
| **CSRF** | SameSite=Strict cookies + `X-CSRF-Token` double-submit for state-changing requests |
| **SQL Injection** | Stored procedures only, parameterized inputs, no dynamic SQL |
| **Token Theft** | IP+UA binding on every token — stolen tokens auto-rejected |
| **Brute Force** | Rate limiting (Redis sliding window) per IP and per account |
| **Session Fixation** | New token IDs (`jti`) on every login and refresh |
| **Privilege Escalation** | Role claims in JWT, re-validated server-side on every request |
| **Sensitive Data** | Passwords hashed with Argon2id, PII fields at-rest encrypted |

---

## 10. Scalability & Performance

See full detail in [docs/SCALABILITY.md](docs/SCALABILITY.md)

### Summary

| Strategy | Implementation |
|---|---|
| **Stateless API** | No in-process session state — API pods are freely scalable |
| **Redis Caching** | Reference data (academic years, class lists) cached 30 min |
| **Read Replicas** | Reports/analytics run against SQL read replica |
| **Background Jobs** | Hangfire for notifications, report generation, cleanup |
| **Connection Pooling** | SqlConnection pool size tuned per environment |
| **Pagination** | All list endpoints paginated (max 100 per page) |
| **Indexing** | Covering indexes on all FK and frequent filter columns |
| **CDN** | Static assets served via CDN (Azure Front Door / CloudFront) |
