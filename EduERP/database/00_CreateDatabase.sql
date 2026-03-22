-- ============================================================
-- Create EduERP Database
-- Run this FIRST before any other scripts.
-- Target: (localdb)\MSSQLLocalDB  (Windows Authentication)
-- ============================================================

USE master;
GO

IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = 'EduERP')
BEGIN
    CREATE DATABASE EduERP;
    PRINT 'Database EduERP created.';
END
ELSE
BEGIN
    PRINT 'Database EduERP already exists — skipping creation.';
END
GO
