using ForumApp.BusinessLayer.Core;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Models.Community;
using ForumApp.Domain.Models.ModLog;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Structure
{
    public class CommunityActionExecution : CommunityActions, ICommunityAction
    {
        public CommunityActionExecution(ForumDbContext context, INotificationAction notificationActions)
            : base(context, notificationActions) { }

        public Task<IReadOnlyList<CommunityResponseDto>> GetAllCommunitiesAsync(int? requestingUserId = null, CancellationToken ct = default)
            => GetAllCommunitiesExecution(requestingUserId, ct);

        public Task<IReadOnlyList<CommunityResponseDto>> GetAllCommunitiesByTypeAsync(string type, int? requestingUserId = null, CancellationToken ct = default)
            => GetAllCommunitiesByTypeExecution(type, requestingUserId, ct);

        public Task<IReadOnlyList<CommunityResponseDto>> GetCommunitiesByUserAsync(int userId, CancellationToken ct = default)
            => GetCommunitiesByUserExecution(userId, ct);

        public Task<IReadOnlyList<CommunityResponseDto>> SearchCommunitiesAsync(string searchTerm, int? requestingUserId = null, CancellationToken ct = default)
            => SearchCommunitiesExecution(searchTerm, requestingUserId, ct);

        public Task<CommunityResponseDto?> GetCommunityAsync(string slug, int? requestingUserId = null, CancellationToken ct = default)
            => GetCommunityExecution(slug, requestingUserId, ct);

        public Task<ServiceResult<CommunityResponseDto>> CreateCommunityAsync(CommunityCreateDto communityData, int authorId, CancellationToken ct = default)
            => CreateCommunityExecution(communityData, authorId, ct);

        public Task<ServiceResult<CommunityResponseDto>> UpdateCommunityAsync(int communityId, CommunityUpdateDto communityData, int requestingUserId, CancellationToken ct = default)
            => UpdateCommunityExecution(communityId, communityData, requestingUserId, ct);

        public Task<ActionResponse> DeleteCommunityAsync(int communityId, int requestingUserId, bool isPrivileged = false, CancellationToken ct = default)
            => DeleteCommunityExecution(communityId, requestingUserId, isPrivileged, ct);

        public Task<ActionResponse> JoinCommunityAsync(int communityId, int userId, CancellationToken ct = default)
            => JoinCommunityExecution(communityId, userId, ct);

        public Task<ActionResponse> LeaveCommunityAsync(int communityId, int userId, CancellationToken ct = default)
            => LeaveCommunityExecution(communityId, userId, ct);

        public Task<bool> IsMemberAsync(int communityId, int userId, CancellationToken ct = default)
            => IsMemberExecution(communityId, userId, ct);

        public Task<bool> IsOwnerAsync(int communityId, int userId, CancellationToken ct = default)
            => IsOwnerExecution(communityId, userId, ct);

        public Task<string?> GetUserRoleAsync(int communityId, int userId, CancellationToken ct = default)
            => GetUserRoleExecution(communityId, userId, ct);

        public Task<IReadOnlyList<CommunityMemberResponseDto>> GetMembersAsync(int communityId, CancellationToken ct = default)
            => GetMembersExecution(communityId, ct);

        public Task<IReadOnlyList<CommunityMemberResponseDto>> GetBannedMembersAsync(int communityId, CancellationToken ct = default)
            => GetBannedMembersExecution(communityId, ct);

        public Task<ActionResponse> PromoteToModeratorAsync(int communityId, int targetUserId, int requestingUserId, CancellationToken ct = default)
            => PromoteToModeratorExecution(communityId, targetUserId, requestingUserId, ct);

        public Task<ActionResponse> DemoteFromModeratorAsync(int communityId, int targetUserId, int requestingUserId, CancellationToken ct = default)
            => DemoteFromModeratorExecution(communityId, targetUserId, requestingUserId, ct);

        public Task<ActionResponse> KickMemberAsync(int communityId, int targetUserId, int requestingUserId, CancellationToken ct = default)
            => KickMemberExecution(communityId, targetUserId, requestingUserId, ct);

        public Task<ActionResponse> BanMemberAsync(int communityId, int targetUserId, int requestingUserId, string reason, CancellationToken ct = default)
            => BanMemberExecution(communityId, targetUserId, requestingUserId, reason, ct);

        public Task<ActionResponse> UnbanMemberAsync(int communityId, int targetUserId, int requestingUserId, CancellationToken ct = default)
            => UnbanMemberExecution(communityId, targetUserId, requestingUserId, ct);

        public Task<CommunityStatsDto> GetCommunityStatsAsync(int communityId, CancellationToken ct = default)
            => GetCommunityStatsExecution(communityId, ct);

        public Task<IReadOnlyList<ModLogEntryDto>> GetModLogAsync(int communityId, int requestingUserId, string? actionType = null, CancellationToken ct = default)
            => GetModLogExecution(communityId, requestingUserId, actionType, ct);

        public Task<ActionResponse> TransferOwnershipAsync(int communityId, int newOwnerId, int requestingUserId, CancellationToken ct = default)
            => TransferOwnershipExecution(communityId, newOwnerId, requestingUserId, ct);

        public Task<IReadOnlyList<CommunityWithRoleDto>> GetUserCommunitiesWithRolesAsync(int userId, CancellationToken ct = default)
            => GetUserCommunitiesWithRolesExecution(userId, ct);

        public Task<(bool IsBanned, string? BanReason)> GetUserBanStatusAsync(int communityId, int userId, CancellationToken ct = default)
            => GetUserBanStatusExecution(communityId, userId, ct);
    }
}
