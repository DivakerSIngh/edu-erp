# Scalability & Performance Strategy — Education ERP System

---

## 1. Stateless API Design

Every API server instance holds **zero session state**. All state lives in:
- **SQL Server** — persistent data
- **Redis** — token blacklists, OTP, rate limit counters, cached lookups

This enables **horizontal scaling**: spin up any number of API pods behind a load balancer without sticky sessions.

```
                ┌─────────────────────────────────┐
                │         Load Balancer           │
                │     (Nginx / Azure App GW)      │
                └──────────┬────────┬─────────────┘
                           │        │
              ┌────────────▼──┐  ┌──▼────────────┐
              │  API Pod 1    │  │  API Pod 2    │
              │  (stateless)  │  │  (stateless)  │
              └────────┬──────┘  └──────┬────────┘
                       │                │
          ┌────────────▼────────────────▼────────┐
          │           Shared Resources            │
          │   Redis Cluster + SQL Server          │
          └───────────────────────────────────────┘
```

---

## 2. Redis Caching Strategy

### Cache Layers

| Data Type | TTL | Key Pattern | Justification |
|---|---|---|---|
| Academic years list | 30 min | `cache:academic-years` | Rarely changes, read on every page |
| Class list | 30 min | `cache:classes:{ayId}` | Per academic year |
| Student profile | 5 min | `cache:student:{id}` | Frequently accessed |
| Fee structure | 1 hour | `cache:fee-structure:{ayId}` | Stable per year |
| User permissions | 10 min | `cache:perms:{userId}` | Avoid DB on every request |
| Token blacklist | Until original expiry | `blacklist:jti:{jti}` | Logout invalidation |
| OTP hash | 5 min | `otp:{email}` | Ephemeral auth data |
| Rate limit counters | Sliding window | `rl:{ip}:{path}` | Brute force protection |

### Cache-Aside Pattern

```csharp
// RedisCacheService.cs
public async Task<T?> GetOrSetAsync<T>(
    string key,
    Func<Task<T>> factory,
    TimeSpan expiry)
{
    var cached = await _db.StringGetAsync(key);
    if (cached.HasValue)
        return JsonSerializer.Deserialize<T>(cached!);

    var value = await factory();
    if (value != null)
        await _db.StringSetAsync(key, JsonSerializer.Serialize(value), expiry);

    return value;
}

// Cache invalidation on write
public async Task InvalidatePatternAsync(string pattern)
{
    var server = _redis.GetServer(_redis.GetEndPoints().First());
    var keys   = server.Keys(pattern: pattern).ToArray();
    if (keys.Length > 0)
        await _db.KeyDeleteAsync(keys);
}
```

---

## 3. Database Optimization

### Indexing Strategy

```sql
-- Foreign key indexes (SQL Server does NOT auto-create these)
CREATE INDEX IX_Students_ClassId        ON Students(ClassId)        WHERE IsDeleted = 0;
CREATE INDEX IX_Students_AcademicYearId ON Students(AcademicYearId) WHERE IsDeleted = 0;
CREATE INDEX IX_Attendance_StudentId    ON AttendanceRecords(StudentId, AttendanceDate);
CREATE INDEX IX_Attendance_ClassDate    ON AttendanceRecords(ClassId, SectionId, AttendanceDate);
CREATE INDEX IX_FeeInvoices_StudentId   ON FeeInvoices(StudentId, Status) WHERE IsDeleted = 0;
CREATE INDEX IX_ExamResults_StudentExam ON ExamResults(StudentId, ExaminationId);
CREATE INDEX IX_RefreshTokens_Token     ON RefreshTokens(TokenHash) INCLUDE (UserId, ExpiresAt, IsRevoked);

-- Composite covering indexes for common list queries
CREATE INDEX IX_Students_Search
    ON Students(IsDeleted, Status, AcademicYearId)
    INCLUDE (FirstName, LastName, EnrollmentNumber, ClassId);
```

### Read Replica Routing

```csharp
// DbConnectionFactory.cs
public IDbConnection CreateConnection(bool readOnly = false)
{
    var connStr = readOnly
        ? _config["Database:ReadReplicaConnectionString"]
        : _config["Database:PrimaryConnectionString"];

    return new SqlConnection(connStr);
}
```

Reports endpoints always pass `readOnly: true` — they hit the read replica, never the primary.

### Query Performance Rules

1. All reads go through SPs — execution plans are cached server-side
2. All list endpoints are **paginated** — `OFFSET / FETCH NEXT` in SPs
3. No `SELECT *` anywhere — only necessary columns
4. Temp tables used for complex aggregations in SPs (avoids re-scanning)
5. `SET NOCOUNT ON` in every SP to suppress row-count messages

---

## 4. Background Job Processing (Hangfire)

Long-running or async operations are never handled inline in HTTP requests:

| Job | Trigger | Frequency |
|---|---|---|
| Fee reminder emails | Scheduled | Daily 8 AM |
| Attendance SMS alerts | Event-driven (absence marked) | Real-time |
| Monthly attendance report generation | Scheduled | 1st of month |
| Expired refresh token cleanup | Scheduled | Nightly |
| OTP delivery | Event-driven | Real-time |
| Bulk Excel/PDF report export | On demand | User-initiated |

```csharp
// Program.cs — Hangfire registration
builder.Services.AddHangfire(config =>
    config.UseRedisStorage(_config["Redis:ConnectionString"]));
builder.Services.AddHangfireServer(options => options.WorkerCount = 4);

// Scheduled job registration (FeeReminderJob)
RecurringJob.AddOrUpdate<FeeReminderJob>(
    "fee-reminders",
    job => job.ExecuteAsync(),
    Cron.Daily(8));    // 8 AM UTC daily

// Fire-and-forget for notifications
BackgroundJob.Enqueue<NotificationDispatchJob>(
    job => job.SendAttendanceAlertAsync(studentId, date));
```

---

## 5. Connection Pooling

```json
// appsettings.Production.json
{
  "Database": {
    "PrimaryConnectionString": "Server=...;Min Pool Size=10;Max Pool Size=100;Connection Timeout=30;",
    "ReadReplicaConnectionString": "Server=...;Min Pool Size=5;Max Pool Size=50;"
  }
}
```

Dapper + `SqlConnection` respects ADO.NET connection pooling automatically when connections are opened and disposed via `using` blocks.

---

## 6. API Response Compression

```csharp
// Program.cs
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});
```

Typical JSON payloads compress 70-85% — beneficial for large report responses.

---

## 7. Frontend Performance

| Strategy | Implementation |
|---|---|
| **Code splitting** | `React.lazy()` per feature module |
| **Bundle analysis** | `vite-bundle-visualizer` in CI |
| **Image optimization** | WebP format, responsive sizes via CDN |
| **CDN** | Static assets served via Azure Front Door / CloudFront |
| **HTTP/2** | Nginx configured for HTTP/2 multiplexing |
| **Service Worker** | Offline-first for static assets (Workbox) |
| **List virtualization** | `react-virtual` for tables with 1000+ rows |
| **Debounced search** | 300ms debounce on search inputs before API call |
| **RTK Query caching** | API responses cached in Redux for 60s |

---

## 8. Load Balancing & High Availability

```nginx
# nginx.conf — Upstream API pool
upstream eduerp_api {
    least_conn;                                   # Least-connections algorithm
    server api-pod-1:5000 max_fails=3 fail_timeout=30s;
    server api-pod-2:5000 max_fails=3 fail_timeout=30s;
    keepalive 32;                                 # Connection reuse
}

server {
    listen 443 ssl http2;
    server_name api.eduerp.com;

    ssl_certificate     /etc/ssl/eduerp.crt;
    ssl_certificate_key /etc/ssl/eduerp.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    location /api/ {
        proxy_pass         http://eduerp_api;
        proxy_http_version 1.1;
        proxy_set_header   Connection "";
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto https;
    }

    # Gzip
    gzip on;
    gzip_types application/json text/plain;
}
```

### SQL Server High Availability

```
┌─────────────────────────────────────────────────────────┐
│               SQL Server Always On AG                    │
│                                                         │
│   Primary Replica              Secondary Replica         │
│   (Read/Write)    ──sync──▶    (Read-Only)              │
│   - All writes                 - Reports/Analytics       │
│   - Real-time                  - Async replication       │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Monitoring & Observability

| Tool | Purpose |
|---|---|
| **Serilog → Seq** | Structured log aggregation and search |
| **Application Insights** | APM, dependency tracking, live metrics |
| **Hangfire Dashboard** | Background job monitoring (auth-gated) |
| **Redis Insight** | Redis key inspection and memory profiling |
| **SQL Server DMVs** | Query plan analysis, blocking detection |
| **Health Check Endpoints** | `/health/live`, `/health/ready` for orchestrators |

```csharp
// Health checks registration
builder.Services.AddHealthChecks()
    .AddSqlServer(_config["Database:PrimaryConnectionString"], name: "sql-primary")
    .AddRedis(_config["Redis:ConnectionString"], name: "redis")
    .AddCheck<HangfireHealthCheck>("hangfire");

// Map health endpoints
app.MapHealthChecks("/health/live",  new HealthCheckOptions { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new HealthCheckOptions { ResponseWriter = WriteHealthJson });
```

---

## 10. Capacity Planning Guidelines

| Tier | Users | API Pods | DB | Redis |
|---|---|---|---|---|
| **Small** | < 1,000 | 1 pod | Single instance | 1 node |
| **Medium** | 1,000–10,000 | 2–4 pods | AG + 1 replica | 3-node cluster |
| **Large** | 10,000–100,000 | 4–12 pods | AG + 2 replicas + RO scaling | 6-node cluster |
| **Enterprise** | 100,000+ | 12+ pods + auto-scale | Distributed AG | Redis Enterprise |
