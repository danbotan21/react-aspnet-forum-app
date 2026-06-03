using ForumApp.BusinessLayer.Core;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Models.Follow;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Structure
{
    public class FollowActionExecution : FollowActions, IFollowAction
    {
        public FollowActionExecution(ForumDbContext context, INotificationAction notifications)
            : base(context, notifications) { }

        public Task<ActionResponse> FollowAsync(int followerId, int targetUserId, CancellationToken ct = default)
            => FollowExecution(followerId, targetUserId, ct);

        public Task<ActionResponse> UnfollowAsync(int followerId, int targetUserId, CancellationToken ct = default)
            => UnfollowExecution(followerId, targetUserId, ct);

        public Task<FollowStatusDto> GetStatusAsync(int viewerId, int targetUserId, CancellationToken ct = default)
            => GetStatusExecution(viewerId, targetUserId, ct);

        public Task<IReadOnlyList<FollowUserDto>> GetFollowersAsync(int targetUserId, int viewerId, CancellationToken ct = default)
            => GetFollowersExecution(targetUserId, viewerId, ct);

        public Task<IReadOnlyList<FollowUserDto>> GetFollowingAsync(int targetUserId, int viewerId, CancellationToken ct = default)
            => GetFollowingExecution(targetUserId, viewerId, ct);
    }
}
