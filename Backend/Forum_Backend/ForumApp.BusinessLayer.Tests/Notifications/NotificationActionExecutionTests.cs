using ForumApp.BusinessLayer.Structure;
using ForumApp.BusinessLayer.Tests.TestSupport;
using ForumApp.Domain.Entities.Notification;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Tests.Notifications;

public sealed class NotificationActionExecutionTests
{
    [Fact]
    public async Task CreateAndSendAsync_PersistsUnreadNotificationAndSendsHubPayload()
    {
        using var db = new TestDatabase();
        var recipient = TestData.User("target1");
        var actor = TestData.User("actor01");
        db.Context.Users.AddRange(recipient, actor);
        await db.Context.SaveChangesAsync();

        var hub = new FakeHubNotifierAction();
        var sut = new NotificationActionExecution(db.Context, hub);

        await sut.CreateAndSendAsync(
            recipient.Id,
            NotificationType.NewFollower,
            "actor01 followed you",
            actor.Id);

        var notification = await db.Context.Notifications.SingleAsync();
        Assert.Equal(recipient.Id, notification.RecipientId);
        Assert.Equal(actor.Id, notification.ActorId);
        Assert.Equal(NotificationType.NewFollower, notification.Type);
        Assert.False(notification.IsRead);

        var call = Assert.Single(hub.Sent);
        Assert.Equal(recipient.Id, call.UserId);
        Assert.Equal("ReceiveNotification", call.Method);
    }

    [Fact]
    public async Task GetUserNotificationsAsync_ReturnsOnlyRequestedUsersNotificationsWithActorData()
    {
        using var db = new TestDatabase();
        var recipient = TestData.User("target1");
        var otherRecipient = TestData.User("target2");
        var actor = TestData.User("actor01");
        db.Context.Users.AddRange(recipient, otherRecipient, actor);
        await db.Context.SaveChangesAsync();

        db.Context.Notifications.AddRange(
            new NotificationData
            {
                RecipientId = recipient.Id,
                ActorId = actor.Id,
                Type = NotificationType.NewFollower,
                Message = "actor01 followed you",
                CreatedAt = DateTime.UtcNow
            },
            new NotificationData
            {
                RecipientId = otherRecipient.Id,
                Type = NotificationType.Unknown,
                Message = "other notification",
                CreatedAt = DateTime.UtcNow
            });
        await db.Context.SaveChangesAsync();

        var sut = new NotificationActionExecution(db.Context, new FakeHubNotifierAction());

        var result = await sut.GetUserNotificationsAsync(recipient.Id);

        var notification = Assert.Single(result);
        Assert.Equal("NewFollower", notification.Type);
        Assert.Equal(actor.Id, notification.ActorId);
        Assert.Equal(actor.UserName, notification.ActorUsername);
    }

    [Fact]
    public async Task MarkAsReadAsync_WhenNotificationBelongsToUser_MarksItRead()
    {
        using var db = new TestDatabase();
        var recipient = TestData.User("target1");
        db.Context.Users.Add(recipient);
        await db.Context.SaveChangesAsync();

        db.Context.Notifications.Add(new NotificationData
        {
            RecipientId = recipient.Id,
            Type = NotificationType.Unknown,
            Message = "read me",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });
        await db.Context.SaveChangesAsync();

        var notificationId = (await db.Context.Notifications.SingleAsync()).Id;
        var sut = new NotificationActionExecution(db.Context, new FakeHubNotifierAction());

        var result = await sut.MarkAsReadAsync(notificationId, recipient.Id);

        Assert.True(result.IsSuccess);
        Assert.True((await db.Context.Notifications.SingleAsync()).IsRead);
    }

    [Fact]
    public async Task MarkAllAsReadAsync_AffectsOnlyRequestedUser()
    {
        using var db = new TestDatabase();
        var recipient = TestData.User("target1");
        var otherRecipient = TestData.User("target2");
        db.Context.Users.AddRange(recipient, otherRecipient);
        await db.Context.SaveChangesAsync();

        db.Context.Notifications.AddRange(
            new NotificationData
            {
                RecipientId = recipient.Id,
                Type = NotificationType.Unknown,
                Message = "first",
                CreatedAt = DateTime.UtcNow
            },
            new NotificationData
            {
                RecipientId = recipient.Id,
                Type = NotificationType.Unknown,
                Message = "second",
                CreatedAt = DateTime.UtcNow
            },
            new NotificationData
            {
                RecipientId = otherRecipient.Id,
                Type = NotificationType.Unknown,
                Message = "other",
                CreatedAt = DateTime.UtcNow
            });
        await db.Context.SaveChangesAsync();

        var sut = new NotificationActionExecution(db.Context, new FakeHubNotifierAction());

        var result = await sut.MarkAllAsReadAsync(recipient.Id);

        Assert.True(result.IsSuccess);
        Assert.Equal(0, await sut.GetUnreadCountAsync(recipient.Id));
        Assert.Equal(1, await sut.GetUnreadCountAsync(otherRecipient.Id));
    }
}
