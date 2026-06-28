using ForumApp.BusinessLayer.Structure;
using ForumApp.BusinessLayer.Tests.TestSupport;
using ForumApp.Domain.Models.SavedItem;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Tests.SavedItems;

public sealed class SavedItemActionExecutionTests
{
    [Fact]
    public async Task SaveItemAsync_WhenRequestDoesNotHaveExactlyOneTarget_FailsWithoutCreatingSavedItem()
    {
        using var db = new TestDatabase();
        var (author, _, _, post) = await TestData.SeedPostAsync(db.Context);
        var comment = TestData.Comment(author.Id, post.Id, "Comment that can be saved");
        db.Context.Comments.Add(comment);
        await db.Context.SaveChangesAsync();

        var sut = new SavedItemActionExecution(db.Context);

        var noTarget = await sut.SaveItemAsync(new CreateSavedItemRequestDto(), author.Id);
        var twoTargets = await sut.SaveItemAsync(new CreateSavedItemRequestDto
        {
            PostId = post.Id,
            CommentId = comment.Id
        }, author.Id);

        Assert.False(noTarget.IsSuccess);
        Assert.False(twoTargets.IsSuccess);
        Assert.Empty(await db.Context.SavedItems.ToListAsync());
    }

    [Fact]
    public async Task SaveItemAsync_WhenPostIsAlreadySaved_ReturnsExistingItemWithoutDuplicate()
    {
        using var db = new TestDatabase();
        var (author, _, _, post) = await TestData.SeedPostAsync(db.Context);
        var sut = new SavedItemActionExecution(db.Context);

        var first = await sut.SaveItemAsync(new CreateSavedItemRequestDto
        {
            PostId = post.Id
        }, author.Id);

        var duplicate = await sut.SaveItemAsync(new CreateSavedItemRequestDto
        {
            PostId = post.Id
        }, author.Id);

        Assert.True(first.IsSuccess);
        Assert.True(duplicate.IsSuccess);
        Assert.Equal(first.Data!.Id, duplicate.Data!.Id);
        Assert.Equal(post.Title, duplicate.Data.PostTitle);
        Assert.Single(await db.Context.SavedItems.ToListAsync());
    }

    [Fact]
    public async Task GetUserSavedCommentAsync_WhenCommentWasSaved_ReturnsCommentData()
    {
        using var db = new TestDatabase();
        var (_, saver, _, post) = await TestData.SeedPostAsync(db.Context);
        var comment = TestData.Comment(post.AuthorId, post.Id, "Important comment body");
        db.Context.Comments.Add(comment);
        await db.Context.SaveChangesAsync();

        var sut = new SavedItemActionExecution(db.Context);

        var saved = await sut.SaveItemAsync(new CreateSavedItemRequestDto
        {
            CommentId = comment.Id
        }, saver.Id);

        var result = await sut.GetUserSavedCommentAsync(comment.Id, saver.Id);

        Assert.True(saved.IsSuccess);
        Assert.NotNull(result);
        Assert.Equal(comment.Id, result.CommentId);
        Assert.Equal("Important comment body", result.CommentBody);
        Assert.Null(await sut.GetUserSavedPostAsync(post.Id, saver.Id));
    }

    [Fact]
    public async Task GetSavedItemByIdAsync_WhenRequesterIsNotOwner_ReturnsNull()
    {
        using var db = new TestDatabase();
        var (author, otherUser, _, post) = await TestData.SeedPostAsync(db.Context);
        var sut = new SavedItemActionExecution(db.Context);

        var saved = await sut.SaveItemAsync(new CreateSavedItemRequestDto
        {
            PostId = post.Id
        }, author.Id);

        var result = await sut.GetSavedItemByIdAsync(saved.Data!.Id, otherUser.Id);

        Assert.Null(result);
    }

    [Fact]
    public async Task RemoveSavedItemAsync_WhenRequesterIsOwner_RemovesItemAfterRejectingUnauthorizedRequester()
    {
        using var db = new TestDatabase();
        var (author, otherUser, _, post) = await TestData.SeedPostAsync(db.Context);
        var sut = new SavedItemActionExecution(db.Context);

        var saved = await sut.SaveItemAsync(new CreateSavedItemRequestDto
        {
            PostId = post.Id
        }, author.Id);

        var unauthorized = await sut.RemoveSavedItemAsync(saved.Data!.Id, otherUser.Id);
        var authorized = await sut.RemoveSavedItemAsync(saved.Data.Id, author.Id);

        Assert.False(unauthorized.IsSuccess);
        Assert.True(authorized.IsSuccess);
        Assert.Empty(await db.Context.SavedItems.ToListAsync());
    }
}
