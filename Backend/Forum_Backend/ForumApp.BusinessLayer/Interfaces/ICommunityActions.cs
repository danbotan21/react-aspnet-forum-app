using ForumApp.Domain.Models.Community;
using ForumApp.Domain.Models.Responses;


namespace ForumApp.BusinessLayer.Interfaces
{

    public interface ICommunityActions
    {
        Task<CommunityResponseDto?> CreateCommunityAsync(CommunityCreateDto communityData, int authorId, CancellationToken ct = default);
        Task<IReadOnlyList<CommunityResponseDto>> GetAllCommunitiesAsync(CancellationToken ct = default);
        Task<IReadOnlyList<CommunityResponseDto>> GetAllCommunitiesByTypeAsync(string type, CancellationToken ct = default);
        Task<IReadOnlyList<CommunityResponseDto>> GetCommunitiesByUserAsync(int userId, CancellationToken ct = default);
        Task<IReadOnlyList<CommunityResponseDto>> SearchCommunitiesAsync(string searchTerm, CancellationToken ct = default);
        Task<CommunityResponseDto?> GetCommunityAsync(string slug, int? requestingUserId = null, CancellationToken ct = default);
        Task<CommunityResponseDto?> UpdateCommunityAsync(int communityId, CommunityUpdateDto communityData, int requestingUserId, CancellationToken ct = default);
        Task<ActionResponse> DeleteCommunityAsync(int communityId, int requestingUserId, CancellationToken ct = default);
        Task<ActionResponse> JoinCommunityAsync(int communityId, int userId, CancellationToken ct = default);
        Task<ActionResponse> LeaveCommunityAsync(int communityId, int userId, CancellationToken ct = default);
        Task<bool> IsMemberAsync(int communityId, int userId, CancellationToken ct = default);
        Task<bool> IsOwnerAsync(int communityId, int userId, CancellationToken ct = default);

        // Mod panel operations
        Task<string?> GetUserRoleAsync(int communityId, int userId, CancellationToken ct = default);
        Task<IReadOnlyList<CommunityMemberResponseDto>> GetMembersAsync(int communityId, CancellationToken ct = default);
        Task<IReadOnlyList<CommunityMemberResponseDto>> GetBannedMembersAsync(int communityId, CancellationToken ct = default);
        Task<ActionResponse> PromoteToModeratorAsync(int communityId, int targetUserId, int requestingUserId, CancellationToken ct = default);
        Task<ActionResponse> DemoteFromModeratorAsync(int communityId, int targetUserId, int requestingUserId, CancellationToken ct = default);
        Task<ActionResponse> KickMemberAsync(int communityId, int targetUserId, int requestingUserId, CancellationToken ct = default);
        Task<ActionResponse> BanMemberAsync(int communityId, int targetUserId, int requestingUserId, string reason, CancellationToken ct = default);
        Task<ActionResponse> UnbanMemberAsync(int communityId, int targetUserId, int requestingUserId, CancellationToken ct = default);
        Task<CommunityStatsDto> GetCommunityStatsAsync(int communityId, CancellationToken ct = default);
        Task<ActionResponse> TransferOwnershipAsync(int communityId, int newOwnerId, int requestingUserId, CancellationToken ct = default);
    }

}