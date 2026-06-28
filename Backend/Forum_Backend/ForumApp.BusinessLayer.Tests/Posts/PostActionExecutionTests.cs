using ForumApp.BusinessLayer.Structure;
using ForumApp.BusinessLayer.Tests.TestSupport;
using ForumApp.Domain.Models.Post;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Tests.Posts;

public sealed class PostActionExecutionTests
{
    [Fact]
    public async Task CreatePostAsync_WhenAuthorIsNotMember_FailsWithoutCreatingPost()
    {
        using var db = new TestDatabase();
        var author = TestData.User("author01");
        var community = TestData.Community("publichub", "public");
        db.Context.Users.Add(author);
        db.Context.Communities.Add(community);
        await db.Context.SaveChangesAsync();

        var sut = new PostActionExecution(db.Context, new FakeNotificationAction());

        var result = await sut.CreatePostAsync(new PostCreateDto
        {
            Title = "Hello",
            Body = "Body",
            Type = "text",
            CommunityId = community.Id
        }, author.Id);

        Assert.False(result.IsSuccess);
        Assert.Empty(await db.Context.Posts.ToListAsync());
    }

    [Fact]
    public async Task CreatePostAsync_WhenCommunityIsRestricted_AllowsOwnerButRejectsRegularMember()
    {
        using var db = new TestDatabase();
        var (owner, member, community) = await TestData.SeedCommunityAsync(db.Context, type: "restricted");
        var sut = new PostActionExecution(db.Context, new FakeNotificationAction());

        var ownerResult = await sut.CreatePostAsync(new PostCreateDto
        {
            Title = "Owner post",
            Body = "Body",
            Type = "text",
            CommunityId = community.Id
        }, owner.Id);

        var memberResult = await sut.CreatePostAsync(new PostCreateDto
        {
            Title = "Member post",
            Body = "Body",
            Type = "text",
            CommunityId = community.Id
        }, member.Id);

        Assert.True(ownerResult.IsSuccess);
        Assert.False(memberResult.IsSuccess);
        Assert.Single(await db.Context.Posts.ToListAsync());
    }

    [Fact]
    public async Task GetPostByIdAsync_WhenPostIsInPrivateCommunity_HidesItFromNonMembers()
    {
        using var db = new TestDatabase();
        var (author, member, community, post) = await TestData.SeedPostAsync(db.Context, communityType: "private");
        var outsider = TestData.User("outsider");
        db.Context.Users.Add(outsider);
        await db.Context.SaveChangesAsync();

        var sut = new PostActionExecution(db.Context, new FakeNotificationAction());

        Assert.Null(await sut.GetPostByIdAsync(post.Id));
        Assert.Null(await sut.GetPostByIdAsync(post.Id, outsider.Id));
        Assert.NotNull(await sut.GetPostByIdAsync(post.Id, member.Id));
        Assert.NotNull(await sut.GetPostByIdAsync(post.Id, author.Id));
        Assert.Equal("private", community.Type);
    }

    [Fact]
    public async Task PinPostAsync_WhenThreePostsAreAlreadyPinned_FailsForFourthPost()
    {
        using var db = new TestDatabase();
        var (owner, _, community) = await TestData.SeedCommunityAsync(db.Context);

        var pinnedOne = TestData.Post(owner.Id, community.Id, "Pinned 1");
        var pinnedTwo = TestData.Post(owner.Id, community.Id, "Pinned 2");
        var pinnedThree = TestData.Post(owner.Id, community.Id, "Pinned 3");
        var fourth = TestData.Post(owner.Id, community.Id, "Fourth");
        pinnedOne.IsPinned = true;
        pinnedTwo.IsPinned = true;
        pinnedThree.IsPinned = true;

        db.Context.Posts.AddRange(pinnedOne, pinnedTwo, pinnedThree, fourth);
        await db.Context.SaveChangesAsync();

        var sut = new PostActionExecution(db.Context, new FakeNotificationAction());

        var result = await sut.PinPostAsync(fourth.Id, community.Id, owner.Id);

        Assert.False(result.IsSuccess);
        Assert.False((await db.Context.Posts.SingleAsync(p => p.Id == fourth.Id)).IsPinned);
    }
}
