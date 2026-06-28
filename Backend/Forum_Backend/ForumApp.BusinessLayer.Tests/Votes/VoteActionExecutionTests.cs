using ForumApp.BusinessLayer.Structure;
using ForumApp.BusinessLayer.Tests.TestSupport;
using ForumApp.Domain.Entities.Vote;
using ForumApp.Domain.Models.Vote;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Tests.Votes;

public sealed class VoteActionExecutionTests
{
    [Fact]
    public async Task VoteAsync_WhenTargetIsInvalid_FailsWithoutCreatingVote()
    {
        using var db = new TestDatabase();
        var user = TestData.User("voter01");
        db.Context.Users.Add(user);
        await db.Context.SaveChangesAsync();

        var sut = new VoteActionExecution(db.Context, new FakeNotificationAction());

        var result = await sut.VoteAsync(new CreateVoteRequestDto
        {
            Type = VoteType.UpVote
        }, user.Id);

        Assert.False(result.IsSuccess);
        Assert.Empty(await db.Context.Votes.ToListAsync());
    }

    [Fact]
    public async Task VoteAsync_WhenUpvotingPost_CreatesVoteAndUpdatesPostScoreAndAuthorKarma()
    {
        using var db = new TestDatabase();
        var (author, voter, _, post) = await TestData.SeedPostAsync(db.Context);
        var notifications = new FakeNotificationAction();
        var sut = new VoteActionExecution(db.Context, notifications);

        var result = await sut.VoteAsync(new CreateVoteRequestDto
        {
            Type = VoteType.UpVote,
            PostId = post.Id
        }, voter.Id);

        Assert.True(result.IsSuccess);
        Assert.Equal(VoteType.UpVote, result.Data?.Type);
        Assert.Equal(1, (await db.Context.Posts.SingleAsync(p => p.Id == post.Id)).Votes);
        Assert.Equal(1, (await db.Context.Users.SingleAsync(u => u.Id == author.Id)).Karma);
        Assert.Single(await db.Context.Votes.ToListAsync());
        Assert.Single(notifications.Sent);
    }

    [Fact]
    public async Task VoteAsync_WhenExistingVoteChangesFromUpToDown_AppliesTwoPointDelta()
    {
        using var db = new TestDatabase();
        var (author, voter, _, post) = await TestData.SeedPostAsync(db.Context);
        var sut = new VoteActionExecution(db.Context, new FakeNotificationAction());

        await sut.VoteAsync(new CreateVoteRequestDto
        {
            Type = VoteType.UpVote,
            PostId = post.Id
        }, voter.Id);

        var result = await sut.VoteAsync(new CreateVoteRequestDto
        {
            Type = VoteType.DownVote,
            PostId = post.Id
        }, voter.Id);

        Assert.True(result.IsSuccess);
        Assert.Equal(VoteType.DownVote, result.Data?.Type);
        Assert.Equal(-1, (await db.Context.Posts.SingleAsync(p => p.Id == post.Id)).Votes);
        Assert.Equal(-1, (await db.Context.Users.SingleAsync(u => u.Id == author.Id)).Karma);
        Assert.Single(await db.Context.Votes.ToListAsync());
    }

    [Fact]
    public async Task RemoveVoteAsync_WhenOwnerRemovesVote_ReversesScoreAndDeletesVote()
    {
        using var db = new TestDatabase();
        var (_, voter, _, post) = await TestData.SeedPostAsync(db.Context);
        var sut = new VoteActionExecution(db.Context, new FakeNotificationAction());
        var voteResult = await sut.VoteAsync(new CreateVoteRequestDto
        {
            Type = VoteType.UpVote,
            PostId = post.Id
        }, voter.Id);

        var result = await sut.RemoveVoteAsync(voteResult.Data!.Id, voter.Id);

        Assert.True(result.IsSuccess);
        Assert.Equal(0, (await db.Context.Posts.SingleAsync(p => p.Id == post.Id)).Votes);
        Assert.Empty(await db.Context.Votes.ToListAsync());
    }
}
