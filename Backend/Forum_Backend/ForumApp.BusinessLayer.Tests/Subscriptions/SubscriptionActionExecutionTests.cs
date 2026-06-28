using ForumApp.BusinessLayer.Structure;
using ForumApp.BusinessLayer.Tests.TestSupport;
using ForumApp.Domain.Models.Subscription;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Tests.Subscriptions;

public sealed class SubscriptionActionExecutionTests
{
    [Fact]
    public async Task GetStatusAsync_WhenUserIsNotPremium_ReturnsFreeStatusWithPlanDetails()
    {
        using var db = new TestDatabase();
        var user = TestData.User("member01");
        db.Context.Users.Add(user);
        await db.Context.SaveChangesAsync();

        var sut = new SubscriptionActionExecution(db.Context);

        var result = await sut.GetStatusAsync(user.Id);

        Assert.False(result.IsPremium);
        Assert.Null(result.PremiumUntil);
        Assert.Equal("Premium", result.Plan);
        Assert.Equal(4.99m, result.Price);
        Assert.Equal("USD", result.Currency);
    }

    [Fact]
    public async Task GetStatusAsync_WhenPremiumUntilIsInFuture_ReturnsPremiumStatus()
    {
        using var db = new TestDatabase();
        var user = TestData.User("member01");
        user.PremiumUntil = DateTime.UtcNow.AddDays(7);
        db.Context.Users.Add(user);
        await db.Context.SaveChangesAsync();

        var sut = new SubscriptionActionExecution(db.Context);

        var result = await sut.GetStatusAsync(user.Id);

        Assert.True(result.IsPremium);
        Assert.NotNull(result.PremiumUntil);
    }

    [Fact]
    public async Task PurchasePremiumAsync_WhenCardIsInvalid_FailsWithoutChangingPremiumStatus()
    {
        using var db = new TestDatabase();
        var user = TestData.User("member01");
        db.Context.Users.Add(user);
        await db.Context.SaveChangesAsync();

        var sut = new SubscriptionActionExecution(db.Context);

        var result = await sut.PurchasePremiumAsync(user.Id, new PurchasePremiumDto
        {
            CardNumber = "123",
            NameOnCard = "Member One",
            Expiry = "12/99",
            Cvc = "123"
        });

        Assert.False(result.IsSuccess);
        Assert.Null((await db.Context.Users.SingleAsync(u => u.Id == user.Id)).PremiumUntil);
    }

    [Fact]
    public async Task PurchasePremiumAsync_WhenPaymentIsValid_ActivatesPremiumForNewUser()
    {
        using var db = new TestDatabase();
        var user = TestData.User("member01");
        db.Context.Users.Add(user);
        await db.Context.SaveChangesAsync();

        var beforePurchase = DateTime.UtcNow;
        var sut = new SubscriptionActionExecution(db.Context);

        var result = await sut.PurchasePremiumAsync(user.Id, ValidPayment());

        var reloadedUser = await db.Context.Users.SingleAsync(u => u.Id == user.Id);
        Assert.True(result.IsSuccess);
        Assert.NotNull(reloadedUser.PremiumUntil);
        Assert.True(reloadedUser.PremiumUntil > beforePurchase.AddDays(27));
        Assert.True(reloadedUser.PremiumUntil < beforePurchase.AddMonths(1).AddMinutes(1));
    }

    [Fact]
    public async Task PurchasePremiumAsync_WhenUserIsAlreadyPremium_ExtendsFromExistingExpiry()
    {
        using var db = new TestDatabase();
        var existingExpiry = DateTime.UtcNow.AddDays(10);
        var user = TestData.User("member01");
        user.PremiumUntil = existingExpiry;
        db.Context.Users.Add(user);
        await db.Context.SaveChangesAsync();

        var sut = new SubscriptionActionExecution(db.Context);

        var result = await sut.PurchasePremiumAsync(user.Id, ValidPayment());

        var reloadedUser = await db.Context.Users.SingleAsync(u => u.Id == user.Id);
        Assert.True(result.IsSuccess);
        Assert.NotNull(reloadedUser.PremiumUntil);
        Assert.True(reloadedUser.PremiumUntil > existingExpiry.AddDays(27));
    }

    private static PurchasePremiumDto ValidPayment() => new()
    {
        CardNumber = "4242424242424242",
        NameOnCard = "Member One",
        Expiry = "12/99",
        Cvc = "123"
    };
}
