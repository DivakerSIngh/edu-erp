# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and project files first to exploit Docker layer cache
COPY EduERP.sln ./
COPY src/EduERP.Domain/EduERP.Domain.csproj           src/EduERP.Domain/
COPY src/EduERP.Application/EduERP.Application.csproj  src/EduERP.Application/
COPY src/EduERP.Infrastructure/EduERP.Infrastructure.csproj src/EduERP.Infrastructure/
COPY src/EduERP.API/EduERP.API.csproj                  src/EduERP.API/

# Restore NuGet packages (cached unless .csproj changes)
RUN dotnet restore EduERP.sln

# Copy remaining source code
COPY src/ src/

# Publish release build
RUN dotnet publish src/EduERP.API/EduERP.API.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Security: run as non-root
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

COPY --from=build /app/publish .

EXPOSE 8080

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "EduERP.API.dll"]
