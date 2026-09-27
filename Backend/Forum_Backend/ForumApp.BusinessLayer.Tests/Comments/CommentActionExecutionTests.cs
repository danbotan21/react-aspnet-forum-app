using ForumApp.BusinessLayer.Structure;
using ForumApp.BusinessLayer.Tests.TestSupport;
using ForumApp.Domain.Models.Comment;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Tests.Comments;

public sealed class CommentActionExecutionTests
{
    [Fact]
    public async Task CreateCommentAsync_WhenUserIsMember_AddsCommentAndIncrementsPostCommentCount()
    {
        using var db = new TestDatabase();
        var (_, member, _, post) = await TestData.SeedPostAsync(db.Context);
        var notifications = new FakeNotificationAction();
        var sut = new CommentActionExecution(db.Context, notifications);

        var result = await sut.CreateCommentAsync(new CommentCreateDto
        {
            PostId = post.Id,
            Body = "A useful comment"
        }, member.Id);

        Assert.True(result.IsSuccess);
        Assert.Single(await db.Context.Comments.ToListAsync());
        Assert.Equal(1, (await db.Context.Posts.SingleAsync(p => p.Id == post.Id)).CommentsCount);
        Assert.Single(notifications.Sent);
    }

    [Fact]
    public async Task CreateCommentAsync_WhenUserIsBannedFromCommunity_FailsWithoutChangingCommentCount()
    {
        using var db = new TestDatabase();
        var (_, member, community, post) = await TestData.SeedPostAsync(db.Context);
        var membership = await db.Context.CommunityMembers.SingleAsync(m => m.UserId == member.Id);
        membership.IsBanned = true;
        await db.Context.SaveChangesAsync();

        var sut = new CommentActionExecution(db.Context, new FakeNotificationAction());

        var result = await sut.CreateCommentAsync(new CommentCreateDto
        {
            PostId = post.Id,
            Body = "Blocked comment"
        }, member.Id);

        Assert.False(result.IsSuccess);
        Assert.Equal(community.Id, post.CommunityId);
        Assert.Empty(await db.Context.Comments.ToListAsync());
        Assert.Equal(0, (await db.Context.Posts.SingleAsync(p => p.Id == post.Id)).CommentsCount);
    }

    [Fact]
    public async Task DeleteCommentAsync_WhenRequesterIsNotAuthorOrModerator_Fails()
    {
        using var db = new TestDatabase();
        var (author, _, _, post) = await TestData.SeedPostAsync(db.Context);
        var outsider = TestData.User("outsider");
        db.Context.Users.Add(outsider);
        await db.Context.SaveChangesAsync();

        var comment = TestData.Comment(author.Id, post.Id);
        post.CommentsCount = 1;
        db.Context.Comments.Add(comment);
        await db.Context.SaveChangesAsync();

        var sut = new CommentActionExecution(db.Context, new FakeNotificationAction());

        var result = await sut.DeleteCommentAsync(comment.Id, outsider.Id);

        Assert.False(result.IsSuccess);
        Assert.NotNull(await db.Context.Comments.FindAsync(comment.Id));
    }

    [Fact]
    public async Task DeleteCommentAsync_WhenRequesterIsAuthor_RemovesCommentAndDecrementsPostCommentCount()
    {
        using var db = new TestDatabase();
        var (author, _, _, post) = await TestData.SeedPostAsync(db.Context);
        var comment = TestData.Comment(author.Id, post.Id);
        post.CommentsCount = 1;
        db.Context.Comments.Add(comment);
        await db.Context.SaveChangesAsync();

        var sut = new CommentActionExecution(db.Context, new FakeNotificationAction());

        var result = await sut.DeleteCommentAsync(comment.Id, author.Id);

        Assert.True(result.IsSuccess);
        Assert.Empty(await db.Context.Comments.ToListAsync());
        Assert.Equal(0, (await db.Context.Posts.SingleAsync(p => p.Id == post.Id)).CommentsCount);
    }
}


