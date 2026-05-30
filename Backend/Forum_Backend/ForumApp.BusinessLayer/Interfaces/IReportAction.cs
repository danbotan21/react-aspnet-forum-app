using ForumApp.Domain.Models.Report;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Interfaces
{
    public interface IReportAction
    {
        Task<ActionResponse> CreateReportAsync(ReportCreateDto reportData, int reporterId, CancellationToken ct = default);
        Task<IReadOnlyList<ReportResponseDto>> GetAllReportsAsync(CancellationToken ct = default);
        Task<ActionResponse> DeleteReportAsync(int reportId, CancellationToken ct = default);

        Task<IReadOnlyList<CommunityReportResponseDto>> GetCommunityReportsAsync(int communityId, int requestingUserId, CancellationToken ct = default);
        Task<ActionResponse> DismissReportAsync(int reportId, int requestingUserId, bool isPrivileged = false, CancellationToken ct = default);
        Task<ActionResponse> RemoveReportedContentAsync(int reportId, int requestingUserId, bool isPrivileged = false, CancellationToken ct = default);
    }

}