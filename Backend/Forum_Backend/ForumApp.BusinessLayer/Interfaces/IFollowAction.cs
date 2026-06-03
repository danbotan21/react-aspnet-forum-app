using ForumApp.Domain.Models.Follow;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Interfaces
{
    public interface IFollowAction
    {
        Task<ActionResponse> FollowAsync(int followerId, int targetUserId, CancellationToken ct = default);
        Task<ActionResponse> UnfollowAsync(int followerId, int targetUserId, CancellationToken ct = default);
        Task<FollowStatusDto> GetStatusAsync(int viewerId, int targetUserId, CancellationToken ct = default);
        Task<IReadOnlyList<FollowUserDto>> GetFollowersAsync(int targetUserId, int viewerId, CancellationToken ct = default);
        Task<IReadOnlyList<FollowUserDto>> GetFollowingAsync(int targetUserId, int viewerId, CancellationToken ct = default);
    }
}
