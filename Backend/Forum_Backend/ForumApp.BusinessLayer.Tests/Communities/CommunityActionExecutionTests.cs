using ForumApp.BusinessLayer.Structure;
using ForumApp.BusinessLayer.Tests.TestSupport;
using ForumApp.Domain.Models.Community;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Tests.Communities;

public sealed class CommunityActionExecutionTests
{
    [Fact]
    public async Task CreateCommunityAsync_CreatesCommunityAndOwnerMembership()
    {
        using var db = new TestDatabase();
        var owner = TestData.User("owner01");
        db.Context.Users.Add(owner);
        await db.Context.SaveChangesAsync();

        var sut = new CommunityActionExecution(db.Context, new FakeNotificationAction());

        var result = await sut.CreateCommunityAsync(new CommunityCreateDto
        {
            Title = "Dotnet",
            Slug = "dotnet",
            Description = "A .NET community",
            Category = "tech",
            Type = "public"
        }, owner.Id);

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Data);

        var community = await db.Context.Communities.SingleAsync();
        Assert.Equal(1, community.MembersCount);

        var membership = await db.Context.CommunityMembers.SingleAsync();
        Assert.Equal(owner.Id, membership.UserId);
        Assert.Equal(community.Id, membership.CommunityId);
        Assert.Equal("owner", membership.Role);
    }

    [Fact]
    public async Task JoinCommunityAsync_WhenCommunityIsPrivate_DoesNotCreateMembership()
    {
        using var db = new TestDatabase();
        var user = TestData.User("member01");
        var community = TestData.Community("privatehub", "private");
        db.Context.Users.Add(user);
        db.Context.Communities.Add(community);
        await db.Context.SaveChangesAsync();

        var sut = new CommunityActionExecution(db.Context, new FakeNotificationAction());

        var result = await sut.JoinCommunityAsync(community.Id, user.Id);

        Assert.False(result.IsSuccess);
        Assert.Empty(await db.Context.CommunityMembers.ToListAsync());
    }

    [Fact]
    public async Task PromoteToModeratorAsync_WhenRequesterIsOwner_ChangesRoleAndWritesModLog()
    {
        using var db = new TestDatabase();
        var (owner, member, community) = await TestData.SeedCommunityAsync(db.Context);
        var sut = new CommunityActionExecution(db.Context, new FakeNotificationAction());

        var result = await sut.PromoteToModeratorAsync(community.Id, member.Id, owner.Id);

        Assert.True(result.IsSuccess);
        var membership = await db.Context.CommunityMembers.SingleAsync(m => m.UserId == member.Id);
        Assert.Equal("moderator", membership.Role);
        Assert.Equal("promote", (await db.Context.ModLogs.SingleAsync()).ActionType);
    }

    [Fact]
    public async Task TransferOwnershipAsync_ReplacesCurrentOwnerWithNewOwner()
    {
        using var db = new TestDatabase();
        var (owner, member, community) = await TestData.SeedCommunityAsync(db.Context);
        var sut = new CommunityActionExecution(db.Context, new FakeNotificationAction());

        var result = await sut.TransferOwnershipAsync(community.Id, member.Id, owner.Id);

        Assert.True(result.IsSuccess);
        Assert.Equal("member", (await db.Context.CommunityMembers.SingleAsync(m => m.UserId == owner.Id)).Role);
        Assert.Equal("owner", (await db.Context.CommunityMembers.SingleAsync(m => m.UserId == member.Id)).Role);
    }
}
