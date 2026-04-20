-- ================================================
-- COMPLETE MOCK DATA FOR TESTING SWAGGER
-- Run this script in SQL Server Management Studio
-- ================================================

USE Forum_Database;
GO

PRINT '🚀 Starting Mock Data Seeding...';
GO

-- ============================================
-- 1. USERS (Create test users if they don't exist)
-- ============================================
PRINT '📝 Seeding Users...';

IF NOT EXISTS (SELECT 1 FROM Users WHERE ID = 1)
BEGIN
    SET IDENTITY_INSERT Users ON;
    
    INSERT INTO Users (ID, UserName, Email, PasswordHash, Role, ProfileVisibility, Theme, Language, Karma, CreatedAt)
    VALUES 
    (1, 'admin', 'admin@forum.com', 'hashed_password_123', 'Admin', 'Public', 'Light', 'en', 100, GETUTCDATE()),
    (2, 'john_doe', 'john@example.com', 'hashed_password_456', 'User', 'Public', 'Light', 'en', 50, GETUTCDATE()),
    (3, 'jane_smith', 'jane@example.com', 'hashed_password_789', 'User', 'Public', 'Dark', 'en', 75, GETUTCDATE()),
    (4, 'test_user', 'test@example.com', 'hashed_password_000', 'User', 'Private', 'Light', 'en', 10, GETUTCDATE());
    
    SET IDENTITY_INSERT Users OFF;
    PRINT '✅ Users created successfully';
END
ELSE
BEGIN
    PRINT '⚠️  Users already exist, skipping...';
END
GO

-- ============================================
-- 2. NOTIFICATIONS (Fresh mock data)
-- ============================================
PRINT '📝 Seeding Notifications...';

-- Clear existing notifications
DELETE FROM Notifications WHERE ID BETWEEN 1 AND 10;

-- Insert new notifications
SET IDENTITY_INSERT Notifications ON;

INSERT INTO Notifications (ID, Message, IsRead, CreatedAt, RecipientId, PostId, CommentId)
VALUES 
(1, 'Welcome to our forum! Start exploring communities.', 0, GETUTCDATE(), 1, NULL, NULL),
(2, 'Your account has been successfully created!', 0, DATEADD(MINUTE, -30, GETUTCDATE()), 2, NULL, NULL),
(3, 'Check out the new features we have added!', 1, DATEADD(HOUR, -2, GETUTCDATE()), 2, NULL, NULL),
(4, 'You have been invited to join a community', 0, DATEADD(HOUR, -1, GETUTCDATE()), 3, NULL, NULL),
(5, 'Welcome! Complete your profile to get started.', 1, DATEADD(DAY, -1, GETUTCDATE()), 4, NULL, NULL);

SET IDENTITY_INSERT Notifications OFF;
PRINT '✅ Notifications created successfully';
GO

-- ============================================
-- 3. REPORTS (Fresh mock data)
-- ============================================
PRINT '📝 Seeding Reports...';

-- Clear existing reports
DELETE FROM Reports WHERE ID BETWEEN 1 AND 10;

-- Insert new reports
SET IDENTITY_INSERT Reports ON;

INSERT INTO Reports (ID, Reason, CreatedAt, ReporterId, Type, ReportedItemId)
VALUES 
(1, 'This post contains spam and irrelevant content', GETUTCDATE(), 2, 0, 1),
(2, 'Offensive language in this comment', DATEADD(MINUTE, -15, GETUTCDATE()), 3, 1, 2),
(3, 'This user is harassing other members', DATEADD(HOUR, -1, GETUTCDATE()), 1, 2, 4),
(4, 'Inappropriate content in post', DATEADD(HOUR, -3, GETUTCDATE()), 4, 0, 2),
(5, 'Hate speech detected', DATEADD(DAY, -1, GETUTCDATE()), 2, 1, 3);

SET IDENTITY_INSERT Reports OFF;
PRINT '✅ Reports created successfully';
GO

-- ============================================
-- 4. CONTACTS (Fresh mock data)
-- ============================================
PRINT '📝 Seeding Contacts...';

-- Clear existing contacts
DELETE FROM Contacts WHERE ID BETWEEN 1 AND 10;

-- Insert new contacts
SET IDENTITY_INSERT Contacts ON;

INSERT INTO Contacts (ID, FullName, Email, Subject, Type, Message, CreatedAt)
VALUES 
(1, 'Alex Johnson', 'alex.johnson@example.com', 'Question about account creation', 1, 'Hi, I am having trouble creating an account. Can you help me with the registration process?', GETUTCDATE()),
(2, 'Maria Garcia', 'maria.garcia@example.com', 'Inquiry about community guidelines', 0, 'I would like to understand the community guidelines better. Where can I find detailed information?', DATEADD(HOUR, -2, GETUTCDATE())),
(3, 'David Chen', 'david.chen@example.com', 'Report a bug', 3, 'I found a bug in the notification system. Notifications are not showing up properly on mobile devices.', DATEADD(HOUR, -5, GETUTCDATE())),
(4, 'Sarah Williams', 'sarah.w@example.com', 'Moderation request', 2, 'I would like to request moderation privileges for the Tech Discussion community.', DATEADD(DAY, -1, GETUTCDATE())),
(5, 'Robert Brown', 'robert.brown@example.com', 'Terms of Service question', 4, 'I have a legal question about the Terms of Service. Can you clarify the data retention policy?', DATEADD(DAY, -2, GETUTCDATE()));

SET IDENTITY_INSERT Contacts OFF;
PRINT '✅ Contacts created successfully';
GO

-- ============================================
-- VERIFICATION
-- ============================================
PRINT '';
PRINT '============================================';
PRINT '✅ MOCK DATA SEEDING COMPLETED!';
PRINT '============================================';

DECLARE @UserCount INT, @NotifCount INT, @ReportCount INT, @ContactCount INT;

SELECT @UserCount = COUNT(*) FROM Users;
SELECT @NotifCount = COUNT(*) FROM Notifications;
SELECT @ReportCount = COUNT(*) FROM Reports;
SELECT @ContactCount = COUNT(*) FROM Contacts;

PRINT 'Users: ' + CAST(@UserCount AS VARCHAR(10));
PRINT 'Notifications: ' + CAST(@NotifCount AS VARCHAR(10));
PRINT 'Reports: ' + CAST(@ReportCount AS VARCHAR(10));
PRINT 'Contacts: ' + CAST(@ContactCount AS VARCHAR(10));
PRINT '============================================';
PRINT '';

-- Show summary
SELECT 'Users' AS TableName, COUNT(*) AS RecordCount FROM Users
UNION ALL
SELECT 'Notifications', COUNT(*) FROM Notifications
UNION ALL
SELECT 'Reports', COUNT(*) FROM Reports
UNION ALL
SELECT 'Contacts', COUNT(*) FROM Contacts;

PRINT '🎉 Ready for Swagger testing!';
GO
