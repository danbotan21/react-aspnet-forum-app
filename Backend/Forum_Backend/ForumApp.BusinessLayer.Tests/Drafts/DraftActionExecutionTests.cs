using ForumApp.BusinessLayer.Structure;
using ForumApp.BusinessLayer.Tests.TestSupport;
using ForumApp.Domain.Entities.Draft;
using ForumApp.Domain.Models.Draft;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Tests.Drafts;

public sealed class DraftActionExecutionTests
{
    [Fact]
    public async Task CreateDraftAsync_WhenCommunityIsProvided_PersistsDraftWithAuthorAndCommunityData()
    {
        using var db = new TestDatabase();
        var (owner, _, community) = await TestData.SeedCommunityAsync(db.Context);
        var sut = new DraftActionExecution(db.Context);

        var result = await sut.CreateDraftAsync(new CreateDraftRequestDto
        {
            Title = "Draft title",
            Body = "Draft body",
            LinkUrl = "https://example.com",
            CommunityId = community.Id
        }, owner.Id);

        var draft = await db.Context.Drafts.SingleAsync();
        Assert.Equal(owner.Id, draft.AuthorId);
        Assert.Equal("Draft title", draft.Title);
        Assert.Equal(community.Id, result.CommunityId);
        Assert.Equal(community.Slug, result.CommunitySlug);
        Assert.Equal(owner.UserName, result.AuthorUserName);
    }

    [Fact]
    public async Task UpdateDraftAsync_WhenRequesterIsAuthor_UpdatesDraftFields()
    {
        using var db = new TestDatabase();
        var (owner, _, community) = await TestData.SeedCommunityAsync(db.Context);
        var sut = new DraftActionExecution(db.Context);
        var created = await sut.CreateDraftAsync(new CreateDraftRequestDto
        {
            Title = "Initial title",
            Body = "Initial body"
        }, owner.Id);

        var result = await sut.UpdateDraftAsync(new UpdateDraftRequestDto
        {
            Title = "Updated title",
            Body = "Updated body",
            ImageUrl = "https://example.com/image.png",
            CommunityId = community.Id
        }, created.Id, owner.Id);

        Assert.NotNull(result);
        Assert.Equal("Updated title", result.Title);
        Assert.Equal("Updated body", result.Body);
        Assert.Equal("https://example.com/image.png", result.ImageUrl);
        Assert.Equal(community.Id, result.CommunityId);

        var draft = await db.Context.Drafts.SingleAsync();
        Assert.Equal("Updated title", draft.Title);
        Assert.True(draft.LastModifiedAt >= draft.CreatedAt);
    }

    [Fact]
    public async Task UpdateDraftAsync_WhenRequesterIsNotAuthor_ReturnsNullWithoutChangingDraft()
    {
        using var db = new TestDatabase();
        var author = TestData.User("author01");
        var otherUser = TestData.User("other001");
        db.Context.Users.AddRange(author, otherUser);
        await db.Context.SaveChangesAsync();

        var draft = new DraftData
        {
            AuthorId = author.Id,
            Title = "Original title",
            Body = "Original body",
            CreatedAt = DateTime.UtcNow,
            LastModifiedAt = DateTime.UtcNow
        };
        db.Context.Drafts.Add(draft);
        await db.Context.SaveChangesAsync();

        var sut = new DraftActionExecution(db.Context);

        var result = await sut.UpdateDraftAsync(new UpdateDraftRequestDto
        {
            Title = "Malicious update",
            Body = "Changed by other user"
        }, draft.Id, otherUser.Id);

        Assert.Null(result);
        Assert.Equal("Original title", (await db.Context.Drafts.SingleAsync()).Title);
    }

    [Fact]
    public async Task GetAllUserDraftsAsync_ReturnsOnlyRequestedAuthorsDraftsNewestFirst()
    {
        using var db = new TestDatabase();
        var author = TestData.User("author01");
        var otherUser = TestData.User("other001");
        db.Context.Users.AddRange(author, otherUser);
        await db.Context.SaveChangesAsync();

        var now = DateTime.UtcNow;
        db.Context.Drafts.AddRange(
            new DraftData
            {
                AuthorId = author.Id,
                Title = "Older draft",
                CreatedAt = now.AddMinutes(-20),
                LastModifiedAt = now.AddMinutes(-20)
            },
            new DraftData
            {
                AuthorId = author.Id,
                Title = "Newer draft",
                CreatedAt = now.AddMinutes(-10),
                LastModifiedAt = now.AddMinutes(-5)
            },
            new DraftData
            {
                AuthorId = otherUser.Id,
                Title = "Other user draft",
                CreatedAt = now,
                LastModifiedAt = now
            });
        await db.Context.SaveChangesAsync();

        var sut = new DraftActionExecution(db.Context);

        var result = await sut.GetAllUserDraftsAsync(author.Id);

        Assert.Collection(
            result,
            draft => Assert.Equal("Newer draft", draft.Title),
            draft => Assert.Equal("Older draft", draft.Title));
    }

    [Fact]
    public async Task DeleteDraftAsync_WhenRequesterIsAuthor_RemovesDraftAfterRejectingUnauthorizedRequester()
    {
        using var db = new TestDatabase();
        var author = TestData.User("author01");
        var otherUser = TestData.User("other001");
        db.Context.Users.AddRange(author, otherUser);
        await db.Context.SaveChangesAsync();

        var draft = new DraftData
        {
            AuthorId = author.Id,
            Title = "Draft to delete",
            CreatedAt = DateTime.UtcNow,
            LastModifiedAt = DateTime.UtcNow
        };
        db.Context.Drafts.Add(draft);
        await db.Context.SaveChangesAsync();

        var sut = new DraftActionExecution(db.Context);

        var unauthorized = await sut.DeleteDraftAsync(draft.Id, otherUser.Id);
        var authorized = await sut.DeleteDraftAsync(draft.Id, author.Id);

        Assert.False(unauthorized.IsSuccess);
        Assert.True(authorized.IsSuccess);
        Assert.Empty(await db.Context.Drafts.ToListAsync());
    }
}
