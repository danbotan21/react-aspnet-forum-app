using ForumApp.BusinessLayer.Structure;
using ForumApp.BusinessLayer.Tests.TestSupport;
using ForumApp.Domain.Entities.Contact;
using ForumApp.Domain.Models.Contact;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Tests.Contacts;

public sealed class ContactActionExecutionTests
{
    [Fact]
    public async Task SubmitContactFormAsync_WhenPayloadIsValid_PersistsMessage()
    {
        using var db = new TestDatabase();
        var sut = new ContactActionExecution(db.Context);

        var result = await sut.SubmitContactFormAsync(new ContactFormDto
        {
            FullName = "Member One",
            Email = "member@example.com",
            Subject = "Need help",
            Type = ContactType.GeneralInquiry,
            Message = "I need help with my account."
        });

        Assert.True(result.IsSuccess);

        var contact = await db.Context.Contacts.SingleAsync();
        Assert.Equal("Member One", contact.FullName);
        Assert.Equal("member@example.com", contact.Email);
        Assert.Equal(ContactType.GeneralInquiry, contact.Type);
    }

    [Fact]
    public async Task SubmitContactFormAsync_WhenPayloadIsInvalid_FailsWithoutPersistingMessage()
    {
        using var db = new TestDatabase();
        var sut = new ContactActionExecution(db.Context);

        var result = await sut.SubmitContactFormAsync(new ContactFormDto
        {
            FullName = "A",
            Email = "invalid-email",
            Subject = "Help",
            Type = ContactType.GeneralInquiry,
            Message = "Too short"
        });

        Assert.False(result.IsSuccess);
        Assert.Empty(await db.Context.Contacts.ToListAsync());
    }

    [Fact]
    public async Task SubmitContactFormAsync_WhenEmailHitHourlyLimit_FailsWithoutAddingFourthMessage()
    {
        using var db = new TestDatabase();
        const string email = "member@example.com";
        db.Context.Contacts.AddRange(
            ExistingContact(email, DateTime.UtcNow.AddMinutes(-50)),
            ExistingContact(email, DateTime.UtcNow.AddMinutes(-30)),
            ExistingContact(email, DateTime.UtcNow.AddMinutes(-10)));
        await db.Context.SaveChangesAsync();

        var sut = new ContactActionExecution(db.Context);

        var result = await sut.SubmitContactFormAsync(new ContactFormDto
        {
            FullName = "Member One",
            Email = email,
            Subject = "Need help again",
            Type = ContactType.ReportAnIssue,
            Message = "This is the fourth message this hour."
        });

        Assert.False(result.IsSuccess);
        Assert.Equal(3, await db.Context.Contacts.CountAsync());
    }

    [Fact]
    public async Task GetAllMessagesAsync_ReturnsMessagesNewestFirstWithReplyData()
    {
        using var db = new TestDatabase();
        var oldMessage = ExistingContact("old@example.com", DateTime.UtcNow.AddHours(-2));
        var newMessage = ExistingContact("new@example.com", DateTime.UtcNow);
        newMessage.AdminReply = "We replied.";
        newMessage.RepliedAt = DateTime.UtcNow;
        db.Context.Contacts.AddRange(oldMessage, newMessage);
        await db.Context.SaveChangesAsync();

        var sut = new ContactActionExecution(db.Context);

        var result = await sut.GetAllMessagesAsync();

        Assert.Collection(
            result,
            message =>
            {
                Assert.Equal("new@example.com", message.Email);
                Assert.Equal("We replied.", message.AdminReply);
                Assert.NotNull(message.RepliedAt);
            },
            message => Assert.Equal("old@example.com", message.Email));
    }

    [Fact]
    public async Task DeleteMessageAsync_WhenMessageExists_RemovesMessage()
    {
        using var db = new TestDatabase();
        var contact = ExistingContact("delete@example.com", DateTime.UtcNow);
        db.Context.Contacts.Add(contact);
        await db.Context.SaveChangesAsync();

        var sut = new ContactActionExecution(db.Context);

        var result = await sut.DeleteMessageAsync(contact.Id);
        var missing = await sut.DeleteMessageAsync(contact.Id);

        Assert.True(result.IsSuccess);
        Assert.False(missing.IsSuccess);
        Assert.Empty(await db.Context.Contacts.ToListAsync());
    }

    private static ContactData ExistingContact(string email, DateTime createdAt) => new()
    {
        FullName = "Member One",
        Email = email,
        Subject = "Need help",
        Type = ContactType.GeneralInquiry,
        Message = "This message is long enough.",
        CreatedAt = createdAt
    };
}
