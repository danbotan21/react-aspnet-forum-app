using ForumApp.BusinessLayer.Core;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Models.Admin;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Structure
{
    public class AdminActionExecution : AdminActions, IAdminAction
    {
        public AdminActionExecution(ForumDbContext context, INotificationAction notifications)
            : base(context, notifications) { }

        public Task<AdminStatsDto> GetStatsAsync(CancellationToken ct = default)
            => GetStatsExecution(ct);

        public Task<IReadOnlyList<AdminUserDto>> GetUsersAsync(string? search = null, CancellationToken ct = default)
            => GetUsersExecution(search, ct);

        public Task<ActionResponse> BanUserAsync(int targetUserId, string reason, int adminUserId, CancellationToken ct = default)
            => BanUserExecution(targetUserId, reason, adminUserId, ct);

        public Task<ActionResponse> UnbanUserAsync(int targetUserId, int adminUserId, CancellationToken ct = default)
            => UnbanUserExecution(targetUserId, adminUserId, ct);

        public Task<ActionResponse> ChangeUserRoleAsync(int targetUserId, string role, int adminUserId, CancellationToken ct = default)
            => ChangeUserRoleExecution(targetUserId, role, adminUserId, ct);

        public Task<IReadOnlyList<AdminCommunityDto>> GetCommunitiesAsync(CancellationToken ct = default)
            => GetCommunitiesExecution(ct);

        public Task<IReadOnlyList<AdminReportDto>> GetReportsAsync(string? status = null, CancellationToken ct = default)
            => GetReportsExecution(status, ct);

        public Task<AdminPagedResult<AdminPostDto>> GetPostsAsync(string? search = null, int page = 1, int pageSize = 20, CancellationToken ct = default)
            => GetPostsExecution(search, page, pageSize, ct);

        public Task<AdminPagedResult<AdminCommentDto>> GetCommentsAsync(string? search = null, int page = 1, int pageSize = 20, CancellationToken ct = default)
            => GetCommentsExecution(search, page, pageSize, ct);

        public Task<ActionResponse> ReplyToMessageAsync(int messageId, string reply, int adminUserId, CancellationToken ct = default)
            => ReplyToMessageExecution(messageId, reply, adminUserId, ct);

        public Task<IReadOnlyList<AdminLogDto>> GetLogsAsync(int limit = 100, CancellationToken ct = default)
            => GetLogsExecution(limit, ct);

        public Task<ActionResponse> ClearLogsAsync(CancellationToken ct = default)
            => ClearLogsExecution(ct);

        public Task LogActionAsync(int actorId, string actionType, string? targetType, int? targetId, string? targetLabel, string? details, CancellationToken ct = default)
            => LogActionExecution(actorId, actionType, targetType, targetId, targetLabel, details, ct);
    }
}
