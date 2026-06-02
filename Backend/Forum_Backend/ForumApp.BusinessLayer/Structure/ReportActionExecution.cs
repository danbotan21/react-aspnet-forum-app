using ForumApp.BusinessLayer.Core;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Models.Report;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Structure
{
    public class ReportActionExecution : ReportActions, IReportAction
    {
        public ReportActionExecution(ForumDbContext context, INotificationAction notifications)
            : base(context, notifications) { }

        public Task<ActionResponse> CreateReportAsync(ReportCreateDto reportData, int reporterId, CancellationToken ct = default)
            => CreateReportExecution(reportData, reporterId, ct);

        public Task<IReadOnlyList<ReportResponseDto>> GetAllReportsAsync(CancellationToken ct = default)
            => GetAllReportsExecution(ct);

        public Task<ActionResponse> DeleteReportAsync(int reportId, CancellationToken ct = default)
            => DeleteReportExecution(reportId, ct);

        public Task<IReadOnlyList<CommunityReportResponseDto>> GetCommunityReportsAsync(int communityId, int requestingUserId, CancellationToken ct = default)
            => GetCommunityReportsExecution(communityId, requestingUserId, ct);

        public Task<ActionResponse> DismissReportAsync(int reportId, int requestingUserId, bool isPrivileged = false, CancellationToken ct = default)
            => DismissReportExecution(reportId, requestingUserId, isPrivileged, ct);

        public Task<ActionResponse> RemoveReportedContentAsync(int reportId, int requestingUserId, bool isPrivileged = false, CancellationToken ct = default)
            => RemoveReportedContentExecution(reportId, requestingUserId, isPrivileged, ct);
    }
}
