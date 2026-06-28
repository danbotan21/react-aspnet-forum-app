using ForumApp.BusinessLayer.Structure;
using ForumApp.BusinessLayer.Tests.TestSupport;
using ForumApp.Domain.Entities.Follow;
using ForumApp.Domain.Entities.Notification;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Tests.Follows;

public sealed class FollowActionExecutionTests
{
    [Fact]
    public async Task FollowAsync_WhenFollowerTargetsSelf_FailsWithoutCreatingFollow()
    {
        using var db = new TestDatabase();
        var user = TestData.User("viewer01");
        db.Context.Users.Add(user);
        await db.Context.SaveChangesAsync();

        var notifications = new FakeNotificationAction();
        var sut = new FollowActionExecution(db.Context, notifications);

        var result = await sut.FollowAsync(user.Id, user.Id);

        Assert.False(result.IsSuccess);
        Assert.Empty(await db.Context.Follows.ToListAsync());
        Assert.Empty(notifications.Sent);
    }

    [Fact]
    public async Task FollowAsync_WhenTargetExists_CreatesFollowAndSendsNotification()
    {
        using var db = new TestDatabase();
        var follower = TestData.User("follower01");
        var target = TestData.User("target01");
        db.Context.Users.AddRange(follower, target);
        await db.Context.SaveChangesAsync();

        var notifications = new FakeNotificationAction();
        var sut = new FollowActionExecution(db.Context, notifications);

        var result = await sut.FollowAsync(follower.Id, target.Id);

        Assert.True(result.IsSuccess);

        var follow = await db.Context.Follows.SingleAsync();
        Assert.Equal(follower.Id, follow.FollowerId);
        Assert.Equal(target.Id, follow.FollowingId);

        var notification = Assert.Single(notifications.Sent);
        Assert.Equal(target.Id, notification.RecipientId);
        Assert.Equal(NotificationType.NewFollower, notification.Type);
        Assert.Equal(follower.Id, notification.ActorId);
    }

    [Fact]
    public async Task FollowAsync_WhenAlreadyFollowing_DoesNotCreateDuplicateOrSecondNotification()
    {
        using var db = new TestDatabase();
        var follower = TestData.User("follower01");
        var target = TestData.User("target01");
        db.Context.Users.AddRange(follower, target);
        await db.Context.SaveChangesAsync();

        var notifications = new FakeNotificationAction();
        var sut = new FollowActionExecution(db.Context, notifications);

        var first = await sut.FollowAsync(follower.Id, target.Id);
        var duplicate = await sut.FollowAsync(follower.Id, target.Id);

        Assert.True(first.IsSuccess);
        Assert.True(duplicate.IsSuccess);
        Assert.Single(await db.Context.Follows.ToListAsync());
        Assert.Single(notifications.Sent);
    }

    [Fact]
    public async Task UnfollowAsync_WhenRelationExists_RemovesFollow()
    {
        using var db = new TestDatabase();
        var follower = TestData.User("follower01");
        var target = TestData.User("target01");
        db.Context.Users.AddRange(follower, target);
        await db.Context.SaveChangesAsync();

        db.Context.Follows.Add(new FollowData
        {
            FollowerId = follower.Id,
            FollowingId = target.Id,
            CreatedAt = DateTime.UtcNow
        });
        await db.Context.SaveChangesAsync();

        var sut = new FollowActionExecution(db.Context, new FakeNotificationAction());

        var result = await sut.UnfollowAsync(follower.Id, target.Id);

        Assert.True(result.IsSuccess);
        Assert.Empty(await db.Context.Follows.ToListAsync());
    }

    [Fact]
    public async Task GetStatusAsync_WhenUsersFollowEachOther_ReturnsRelationshipFlagsAndCounts()
    {
        using var db = new TestDatabase();
        var viewer = TestData.User("viewer01");
        var target = TestData.User("target01");
        var thirdUser = TestData.User("third001");
        db.Context.Users.AddRange(viewer, target, thirdUser);
        await db.Context.SaveChangesAsync();

        db.Context.Follows.AddRange(
            new FollowData
            {
                FollowerId = viewer.Id,
                FollowingId = target.Id,
                CreatedAt = DateTime.UtcNow
            },
            new FollowData
            {
                FollowerId = target.Id,
                FollowingId = viewer.Id,
                CreatedAt = DateTime.UtcNow
            },
            new FollowData
            {
                FollowerId = thirdUser.Id,
                FollowingId = target.Id,
                CreatedAt = DateTime.UtcNow
            },
            new FollowData
            {
                FollowerId = target.Id,
                FollowingId = thirdUser.Id,
                CreatedAt = DateTime.UtcNow
            });
        await db.Context.SaveChangesAsync();

        var sut = new FollowActionExecution(db.Context, new FakeNotificationAction());

        var result = await sut.GetStatusAsync(viewer.Id, target.Id);

        Assert.True(result.IsFollowing);
        Assert.True(result.FollowsMe);
        Assert.Equal(2, result.FollowersCount);
        Assert.Equal(2, result.FollowingCount);
    }

    [Fact]
    public async Task GetFollowersAsync_ReturnsFollowersNewestFirstWithViewerFollowState()
    {
        using var db = new TestDatabase();
        var viewer = TestData.User("viewer01");
        var target = TestData.User("target01");
        var olderFollower = TestData.User("olduser1");
        var newerFollower = TestData.User("newuser1");
        newerFollower.PremiumUntil = DateTime.UtcNow.AddDays(10);
        db.Context.Users.AddRange(viewer, target, olderFollower, newerFollower);
        await db.Context.SaveChangesAsync();

        var now = DateTime.UtcNow;
        db.Context.Follows.AddRange(
            new FollowData
            {
                FollowerId = olderFollower.Id,
                FollowingId = target.Id,
                CreatedAt = now.AddMinutes(-10)
            },
            new FollowData
            {
                FollowerId = newerFollower.Id,
                FollowingId = target.Id,
                CreatedAt = now
            },
            new FollowData
            {
                FollowerId = viewer.Id,
                FollowingId = olderFollower.Id,
                CreatedAt = now
            });
        await db.Context.SaveChangesAsync();

        var sut = new FollowActionExecution(db.Context, new FakeNotificationAction());

        var result = await sut.GetFollowersAsync(target.Id, viewer.Id);

        Assert.Collection(
            result,
            user =>
            {
                Assert.Equal(newerFollower.Id, user.Id);
                Assert.True(user.IsPremium);
                Assert.False(user.IsFollowedByMe);
            },
            user =>
            {
                Assert.Equal(olderFollower.Id, user.Id);
                Assert.True(user.IsFollowedByMe);
            });
    }
}
