using ForumApp.BusinessLayer.Structure;
using ForumApp.BusinessLayer.Tests.TestSupport;
using ForumApp.Domain.Entities.Report;
using ForumApp.Domain.Models.Report;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Tests.Reports;

public sealed class ReportActionExecutionTests
{
    [Fact]
    public async Task CreateReportAsync_WhenPostReportIsValid_PersistsPendingReportWithCommunityId()
    {
        using var db = new TestDatabase();
        var (_, reporter, community, post) = await TestData.SeedPostAsync(db.Context);
        var sut = new ReportActionExecution(db.Context, new FakeNotificationAction());

        var result = await sut.CreateReportAsync(new ReportCreateDto
        {
            Type = ReportType.Post,
            ReportedItemId = post.Id,
            Reason = "spam content"
        }, reporter.Id);

        Assert.True(result.IsSuccess);

        var report = await db.Context.Reports.SingleAsync();
        Assert.Equal(reporter.Id, report.ReporterId);
        Assert.Equal(ReportType.Post, report.Type);
        Assert.Equal(post.Id, report.ReportedItemId);
        Assert.Equal(community.Id, report.CommunityId);
        Assert.Equal("pending", report.Status);
    }

    [Fact]
    public async Task CreateReportAsync_WhenSameReporterReportsSameItemTwice_DoesNotCreateDuplicate()
    {
        using var db = new TestDatabase();
        var (_, reporter, _, post) = await TestData.SeedPostAsync(db.Context);
        var sut = new ReportActionExecution(db.Context, new FakeNotificationAction());

        await sut.CreateReportAsync(new ReportCreateDto
        {
            Type = ReportType.Post,
            ReportedItemId = post.Id,
            Reason = "spam content"
        }, reporter.Id);

        var duplicate = await sut.CreateReportAsync(new ReportCreateDto
        {
            Type = ReportType.Post,
            ReportedItemId = post.Id,
            Reason = "same spam"
        }, reporter.Id);

        Assert.False(duplicate.IsSuccess);
        Assert.Single(await db.Context.Reports.ToListAsync());
    }

    [Fact]
    public async Task CreateReportAsync_WhenReporterIsBannedFromCommunity_FailsWithoutCreatingReport()
    {
        using var db = new TestDatabase();
        var (_, reporter, _, post) = await TestData.SeedPostAsync(db.Context);
        var membership = await db.Context.CommunityMembers.SingleAsync(m => m.UserId == reporter.Id);
        membership.IsBanned = true;
        await db.Context.SaveChangesAsync();

        var sut = new ReportActionExecution(db.Context, new FakeNotificationAction());

        var result = await sut.CreateReportAsync(new ReportCreateDto
        {
            Type = ReportType.Post,
            ReportedItemId = post.Id,
            Reason = "spam content"
        }, reporter.Id);

        Assert.False(result.IsSuccess);
        Assert.Empty(await db.Context.Reports.ToListAsync());
    }

    [Fact]
    public async Task DismissReportAsync_WhenRequesterIsCommunityOwner_MarksReportDismissedAndWritesModLog()
    {
        using var db = new TestDatabase();
        var (owner, reporter, community, post) = await TestData.SeedPostAsync(db.Context);
        var report = new ReportData
        {
            ReporterId = reporter.Id,
            Type = ReportType.Post,
            ReportedItemId = post.Id,
            Reason = "off topic",
            CommunityId = community.Id,
            Status = "pending",
            CreatedAt = DateTime.UtcNow
        };
        db.Context.Reports.Add(report);
        await db.Context.SaveChangesAsync();

        var sut = new ReportActionExecution(db.Context, new FakeNotificationAction());

        var result = await sut.DismissReportAsync(report.Id, owner.Id);

        Assert.True(result.IsSuccess);

        var reloadedReport = await db.Context.Reports.SingleAsync();
        Assert.Equal("dismissed", reloadedReport.Status);
        Assert.Equal(owner.Id, reloadedReport.ActionedByUserId);
        Assert.NotNull(reloadedReport.ActionedAt);
        Assert.Equal("dismiss", (await db.Context.ModLogs.SingleAsync()).ActionType);
    }
}
