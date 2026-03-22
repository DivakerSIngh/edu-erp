FROM mcr.microsoft.com/mssql/server:2022-latest

USER root

# Install bash (it's available by default, but ensure it for Alpine-based variants)
RUN apt-get update -y && apt-get install -y --no-install-recommends bash && rm -rf /var/lib/apt/lists/*

# Create init directory and copy all scripts
RUN mkdir -p /docker-db-init/02_StoredProcedures

COPY 00_CreateDatabase.sql          /docker-db-init/
COPY 01_Schema.sql                   /docker-db-init/
COPY 02_StoredProcedures/01_Auth_SPs.sql        /docker-db-init/02_StoredProcedures/
COPY 02_StoredProcedures/02_Student_SPs.sql     /docker-db-init/02_StoredProcedures/
COPY 02_StoredProcedures/03_Attendance_SPs.sql  /docker-db-init/02_StoredProcedures/
COPY 02_StoredProcedures/04_Examination_SPs.sql /docker-db-init/02_StoredProcedures/
COPY 02_StoredProcedures/05_Fees_SPs.sql        /docker-db-init/02_StoredProcedures/
COPY 02_StoredProcedures/06_Admission_SPs.sql   /docker-db-init/02_StoredProcedures/
COPY entrypoint.sh /docker-db-init/entrypoint.sh

RUN chmod +x /docker-db-init/entrypoint.sh

USER mssql

ENTRYPOINT ["/bin/bash", "/docker-db-init/entrypoint.sh"]
