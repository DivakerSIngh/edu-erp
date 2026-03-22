#!/bin/bash
set -e

# ── Start SQL Server in the background ───────────────────────────────────────
/opt/mssql/bin/sqlservr &
MSSQL_PID=$!

# ── Wait until SQL Server is ready to accept connections ─────────────────────
SQLCMD="/opt/mssql-tools18/bin/sqlcmd"
MAX_WAIT=120   # seconds
ELAPSED=0

echo "[init] Waiting for SQL Server to start..."
until $SQLCMD -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -Q "SELECT 1" -C -l 1 &>/dev/null; do
    sleep 2
    ELAPSED=$((ELAPSED + 2))
    if [ $ELAPSED -ge $MAX_WAIT ]; then
        echo "[init] ERROR: SQL Server did not become ready within ${MAX_WAIT}s." >&2
        exit 1
    fi
done
echo "[init] SQL Server is ready."

# ── Run each script in order ─────────────────────────────────────────────────
run_sql() {
    local FILE="$1"
    local DB="${2:-master}"
    echo "[init] Running $(basename "$FILE")..."
    $SQLCMD -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -d "$DB" -i "$FILE" -C -b \
        || { echo "[init] ERROR in $FILE" >&2; exit 1; }
}

# Create database first (runs against master)
run_sql /docker-db-init/00_CreateDatabase.sql   master

# Schema + stored procedures run against EduERP
run_sql /docker-db-init/01_Schema.sql                              EduERP
run_sql /docker-db-init/02_StoredProcedures/01_Auth_SPs.sql        EduERP
run_sql /docker-db-init/02_StoredProcedures/02_Student_SPs.sql     EduERP
run_sql /docker-db-init/02_StoredProcedures/03_Attendance_SPs.sql  EduERP
run_sql /docker-db-init/02_StoredProcedures/04_Examination_SPs.sql EduERP
run_sql /docker-db-init/02_StoredProcedures/05_Fees_SPs.sql        EduERP
run_sql /docker-db-init/02_StoredProcedures/06_Admission_SPs.sql   EduERP

echo "[init] All database scripts executed successfully."

# ── Hand off to foreground SQL Server process ─────────────────────────────────
wait $MSSQL_PID
