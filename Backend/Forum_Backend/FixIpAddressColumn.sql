-- Quick fix: Make ipAddress column nullable in Contacts table
USE Forum_Database;
GO

-- Check if column exists and make it nullable
IF EXISTS (SELECT 1 FROM sys.columns 
           WHERE object_id = OBJECT_ID('dbo.Contacts') 
           AND name = 'ipAddress')
BEGIN
    ALTER TABLE Contacts
    ALTER COLUMN ipAddress NVARCHAR(MAX) NULL;
    
    PRINT '✅ Column ipAddress is now NULLABLE';
END
ELSE
BEGIN
    PRINT '⚠️ Column ipAddress does not exist';
END
GO
