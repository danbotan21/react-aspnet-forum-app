using ForumApp.BusinessLayer.Structure;
using ForumApp.BusinessLayer.Tests.TestSupport;
using ForumApp.Domain.Models.User;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Tests.Users;

public sealed class UserActionExecutionTests
{
    [Fact]
    public async Task RegisterAsync_WhenEmailAndUsernameAreAvailable_CreatesPendingRegistrationAndSendsConfirmationEmail()
    {
        using var db = new TestDatabase();
        var email = new FakeEmailAction();
        var sut = new UserActionExecution(db.Context, new FakeTokenAction(), TestConfiguration.Create(), email);

        var result = await sut.RegisterAsync(new UserRegisterDto
        {
            UserName = "newuser",
            Email = "newuser@example.com",
            Password = "Password123!"
        });

        Assert.True(result.IsSuccess);
        Assert.Empty(await db.Context.Users.ToListAsync());

        var pending = await db.Context.PendingRegistrations.SingleAsync();
        Assert.Equal("newuser", pending.UserName);
        Assert.Equal("newuser@example.com", pending.Email);
        Assert.True(BCrypt.Net.BCrypt.Verify("Password123!", pending.PasswordHash));
        Assert.Single(email.ConfirmationEmails);
    }

    [Fact]
    public async Task LoginAsync_WhenPasswordIsValid_SendsLoginCodeButDoesNotIssueTokenYet()
    {
        using var db = new TestDatabase();
        var user = TestData.User("login01", "Password123!");
        db.Context.Users.Add(user);
        await db.Context.SaveChangesAsync();

        var email = new FakeEmailAction();
        var sut = new UserActionExecution(db.Context, new FakeTokenAction(), TestConfiguration.Create(), email);

        var result = await sut.LoginAsync(new UserLoginDto
        {
            Email = user.Email,
            Password = "Password123!"
        });

        Assert.NotNull(result);
        Assert.True(result.RequiresEmailCode);
        Assert.True(string.IsNullOrEmpty(result.Token));
        Assert.Single(email.LoginCodes);

        var reloadedUser = await db.Context.Users.SingleAsync();
        Assert.NotNull(reloadedUser.LoginCodeHash);
        Assert.NotNull(reloadedUser.LoginCodeExpiry);
    }

    [Fact]
    public async Task VerifyLoginCodeAsync_WhenCodeMatches_IssuesTokensAndConsumesCode()
    {
        using var db = new TestDatabase();
        var user = TestData.User("verify01", "Password123!");
        db.Context.Users.Add(user);
        await db.Context.SaveChangesAsync();

        var email = new FakeEmailAction();
        var sut = new UserActionExecution(db.Context, new FakeTokenAction(), TestConfiguration.Create(), email);
        await sut.LoginAsync(new UserLoginDto { Email = user.Email, Password = "Password123!" });
        var code = email.LoginCodes.Single().Code;

        var result = await sut.VerifyLoginCodeAsync(user.Email, code);

        Assert.NotNull(result);
        Assert.Equal($"access-token-{user.Id}-{user.UserName}-{user.Role}", result.Token);
        Assert.Equal("refresh-token-1", result.RefreshToken);

        var reloadedUser = await db.Context.Users.SingleAsync();
        Assert.Null(reloadedUser.LoginCodeHash);
        Assert.Null(reloadedUser.LoginCodeExpiry);
        Assert.NotNull(reloadedUser.RefreshToken);
    }

    [Fact]
    public async Task LoginAsync_WhenUserIsBanned_ThrowsAndDoesNotSendCode()
    {
        using var db = new TestDatabase();
        var user = TestData.User("banned01", "Password123!");
        user.IsBanned = true;
        user.BanReason = "policy";
        db.Context.Users.Add(user);
        await db.Context.SaveChangesAsync();

        var email = new FakeEmailAction();
        var sut = new UserActionExecution(db.Context, new FakeTokenAction(), TestConfiguration.Create(), email);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sut.LoginAsync(new UserLoginDto { Email = user.Email, Password = "Password123!" }));

        Assert.Contains("banned", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Empty(email.LoginCodes);
    }
}
