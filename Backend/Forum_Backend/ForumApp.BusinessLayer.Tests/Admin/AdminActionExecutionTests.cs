using ForumApp.BusinessLayer.Structure;
using ForumApp.BusinessLayer.Tests.TestSupport;
using ForumApp.Domain.Entities.Contact;
using ForumApp.Domain.Entities.Notification;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Tests.Admin;

public sealed class AdminActionExecutionTests
{
    [Fact]
    public async Task BanUserAsync_WhenTargetIsValid_BansUserClearsSessionAndWritesAdminLog()
    {
        using var db = new TestDatabase();
        var admin = TestData.User("admin01", role: "Admin");
        var target = TestData.User("target1");
        target.RefreshToken = "active-refresh-token";
        target.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        db.Context.Users.AddRange(admin, target);
        await db.Context.SaveChangesAsync();

        var sut = new AdminActionExecution(db.Context, new FakeNotificationAction());

        var result = await sut.BanUserAsync(target.Id, "policy violation", admin.Id);

        Assert.True(result.IsSuccess);

        var reloadedTarget = await db.Context.Users.SingleAsync(u => u.Id == target.Id);
        Assert.True(reloadedTarget.IsBanned);
        Assert.Equal("policy violation", reloadedTarget.BanReason);
        Assert.Null(reloadedTarget.RefreshToken);
        Assert.Null(reloadedTarget.RefreshTokenExpiry);
        Assert.Equal("ban", (await db.Context.AdminLogs.SingleAsync()).ActionType);
    }

    [Fact]
    public async Task ChangeUserRoleAsync_WhenRequesterIsNotSupremeAdmin_CannotGrantAdminRole()
    {
        using var db = new TestDatabase();
        var supremeAdmin = TestData.User("admin01", role: "Admin");
        var regularAdmin = TestData.User("admin02", role: "Admin");
        var target = TestData.User("target1");
        db.Context.Users.AddRange(supremeAdmin, regularAdmin, target);
        await db.Context.SaveChangesAsync();

        var sut = new AdminActionExecution(db.Context, new FakeNotificationAction());

        var result = await sut.ChangeUserRoleAsync(target.Id, "Admin", regularAdmin.Id);

        Assert.False(result.IsSuccess);
        Assert.Equal("User", (await db.Context.Users.SingleAsync(u => u.Id == target.Id)).Role);
        Assert.Empty(await db.Context.AdminLogs.ToListAsync());
    }

    [Fact]
    public async Task ChangeUserRoleAsync_WhenRequesterIsSupremeAdmin_CanGrantAdminRole()
    {
        using var db = new TestDatabase();
        var supremeAdmin = TestData.User("admin01", role: "Admin");
        var target = TestData.User("target1");
        db.Context.Users.AddRange(supremeAdmin, target);
        await db.Context.SaveChangesAsync();

        var sut = new AdminActionExecution(db.Context, new FakeNotificationAction());

        var result = await sut.ChangeUserRoleAsync(target.Id, "Admin", supremeAdmin.Id);

        Assert.True(result.IsSuccess);
        Assert.Equal("Admin", (await db.Context.Users.SingleAsync(u => u.Id == target.Id)).Role);
        Assert.Equal("role", (await db.Context.AdminLogs.SingleAsync()).ActionType);
    }

    [Fact]
    public async Task ReplyToMessageAsync_WhenSenderHasAccount_StoresReplyLogsActionAndSendsNotification()
    {
        using var db = new TestDatabase();
        var admin = TestData.User("admin01", role: "Admin");
        var sender = TestData.User("sender1");
        var contact = new ContactData
        {
            FullName = "Sender One",
            Email = sender.Email,
            Subject = "Help",
            Type = ContactType.GeneralInquiry,
            Message = "Please help",
            CreatedAt = DateTime.UtcNow
        };
        db.Context.Users.AddRange(admin, sender);
        db.Context.Contacts.Add(contact);
        await db.Context.SaveChangesAsync();

        var notifications = new FakeNotificationAction();
        var sut = new AdminActionExecution(db.Context, notifications);

        var result = await sut.ReplyToMessageAsync(contact.Id, "We fixed it", admin.Id);

        Assert.True(result.IsSuccess);

        var reloadedContact = await db.Context.Contacts.SingleAsync();
        Assert.Equal("We fixed it", reloadedContact.AdminReply);
        Assert.Equal(admin.Id, reloadedContact.RepliedByUserId);
        Assert.NotNull(reloadedContact.RepliedAt);
        Assert.Equal("reply_message", (await db.Context.AdminLogs.SingleAsync()).ActionType);

        var notification = Assert.Single(notifications.Sent);
        Assert.Equal(sender.Id, notification.RecipientId);
        Assert.Equal(NotificationType.ContactReply, notification.Type);
    }
}
