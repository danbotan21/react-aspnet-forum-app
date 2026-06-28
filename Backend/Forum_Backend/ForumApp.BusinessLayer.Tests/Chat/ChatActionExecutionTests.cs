using ForumApp.BusinessLayer.Structure;
using ForumApp.BusinessLayer.Tests.TestSupport;
using ForumApp.Domain.Models.Chat;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Tests.Chat;

public sealed class ChatActionExecutionTests
{
    [Fact]
    public async Task GetOrCreateConversationAsync_WhenUsersAreValid_CreatesSingleNormalizedConversation()
    {
        using var db = new TestDatabase();
        var alice = TestData.User("alice01");
        var bob = TestData.User("bob001");
        db.Context.Users.AddRange(alice, bob);
        await db.Context.SaveChangesAsync();

        var sut = new ChatActionExecution(db.Context, new FakeHubNotifierAction());

        var first = await sut.GetOrCreateConversationAsync(bob.Id, alice.Id);
        var second = await sut.GetOrCreateConversationAsync(alice.Id, bob.Id);

        Assert.Equal(first.Id, second.Id);
        var conversation = await db.Context.Conversations.SingleAsync();
        Assert.Equal(Math.Min(alice.Id, bob.Id), conversation.User1Id);
        Assert.Equal(Math.Max(alice.Id, bob.Id), conversation.User2Id);
    }

    [Fact]
    public async Task SendMessageAsync_WhenRecipientIsProvided_CreatesMessageAndNotifiesRecipient()
    {
        using var db = new TestDatabase();
        var alice = TestData.User("alice01");
        var bob = TestData.User("bob001");
        db.Context.Users.AddRange(alice, bob);
        await db.Context.SaveChangesAsync();

        var hub = new FakeHubNotifierAction();
        var sut = new ChatActionExecution(db.Context, hub);

        var result = await sut.SendMessageAsync(alice.Id, new SendMessageDto
        {
            RecipientId = bob.Id,
            Body = "  hello Bob  "
        });

        Assert.Equal("hello Bob", result.Body);
        Assert.Single(await db.Context.Conversations.ToListAsync());
        Assert.Single(await db.Context.Messages.ToListAsync());

        var call = Assert.Single(hub.Sent);
        Assert.Equal(bob.Id, call.UserId);
        Assert.Equal("ReceiveMessage", call.Method);
    }

    [Fact]
    public async Task MarkConversationReadAsync_WhenUnreadMessagesExist_SetsReadAtAndNotifiesSender()
    {
        using var db = new TestDatabase();
        var alice = TestData.User("alice01");
        var bob = TestData.User("bob001");
        db.Context.Users.AddRange(alice, bob);
        await db.Context.SaveChangesAsync();

        var hub = new FakeHubNotifierAction();
        var sut = new ChatActionExecution(db.Context, hub);
        var message = await sut.SendMessageAsync(alice.Id, new SendMessageDto
        {
            RecipientId = bob.Id,
            Body = "unread"
        });

        var result = await sut.MarkConversationReadAsync(bob.Id, message.ConversationId);

        Assert.True(result.IsSuccess);
        db.Context.ChangeTracker.Clear();
        Assert.NotNull((await db.Context.Messages.SingleAsync()).ReadAt);
        Assert.Contains(hub.Sent, c => c.UserId == alice.Id && c.Method == "MessagesRead");
    }

    [Fact]
    public async Task EditMessageAsync_WhenRequesterIsNotSender_ThrowsAndLeavesMessageUnchanged()
    {
        using var db = new TestDatabase();
        var alice = TestData.User("alice01");
        var bob = TestData.User("bob001");
        db.Context.Users.AddRange(alice, bob);
        await db.Context.SaveChangesAsync();

        var sut = new ChatActionExecution(db.Context, new FakeHubNotifierAction());
        var message = await sut.SendMessageAsync(alice.Id, new SendMessageDto
        {
            RecipientId = bob.Id,
            Body = "original"
        });

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sut.EditMessageAsync(bob.Id, message.Id, "edited"));

        var reloadedMessage = await db.Context.Messages.SingleAsync(m => m.Id == message.Id);
        Assert.Equal("original", reloadedMessage.Body);
        Assert.Null(reloadedMessage.EditedAt);
    }
}
