using ForumApp.Domain.Models.Admin;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Interfaces
{
    // Application-wide administration. All operations assume the caller has already been
    // authorized as a global "Admin" (enforced at the controller level).
    public interface IAdminAction
    {
        Task<AdminStatsDto> GetStatsAsync(CancellationToken ct = default);

        // Users
        Task<IReadOnlyList<AdminUserDto>> GetUsersAsync(string? search = null, CancellationToken ct = default);
        Task<ActionResponse> BanUserAsync(int targetUserId, string reason, int adminUserId, CancellationToken ct = default);
        Task<ActionResponse> UnbanUserAsync(int targetUserId, int adminUserId, CancellationToken ct = default);
        Task<ActionResponse> ChangeUserRoleAsync(int targetUserId, string role, int adminUserId, CancellationToken ct = default);

        // Communities
        Task<IReadOnlyList<AdminCommunityDto>> GetCommunitiesAsync(CancellationToken ct = default);

        // Reports (across all communities)
        Task<IReadOnlyList<AdminReportDto>> GetReportsAsync(string? status = null, CancellationToken ct = default);

        // Content browser (any post / comment, anywhere)
        Task<AdminPagedResult<AdminPostDto>> GetPostsAsync(string? search = null, int page = 1, int pageSize = 20, CancellationToken ct = default);
        Task<AdminPagedResult<AdminCommentDto>> GetCommentsAsync(string? search = null, int page = 1, int pageSize = 20, CancellationToken ct = default);

        // Contact messages
        Task<ActionResponse> ReplyToMessageAsync(int messageId, string reply, int adminUserId, CancellationToken ct = default);

        // Audit log
        Task<IReadOnlyList<AdminLogDto>> GetLogsAsync(int limit = 100, CancellationToken ct = default);
        Task LogActionAsync(int actorId, string actionType, string? targetType, int? targetId, string? targetLabel, string? details, CancellationToken ct = default);
    }
}
