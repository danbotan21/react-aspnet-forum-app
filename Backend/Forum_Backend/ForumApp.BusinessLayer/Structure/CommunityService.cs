using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Entities.Community;
using ForumApp.Domain.Entities.CommunityMember;
using ForumApp.Domain.Models.Community;
using ForumApp.Domain.Models.Responses;
using Microsoft.EntityFrameworkCore;
using ForumApp.Domain.Entities.Post;

namespace ForumApp.BusinessLayer.Structure
{
    public class CommunityService : ICommunityActions
    {
        private readonly ForumDbContext _context;

        public CommunityService(ForumDbContext context)
        {
            _context = context;
        }

        private async Task<int?> GetOwnerUserIdAsync(int communityId, CancellationToken ct = default)
        {
            return await _context.CommunityMembers
                .Where(m => m.CommunityId == communityId && m.Role == "owner" && !m.IsBanned)
                .Select(m => (int?)m.UserId)
                .FirstOrDefaultAsync(ct);
        }

        private async Task<bool> IsModeratorOrOwnerAsync(int communityId, int userId, CancellationToken ct = default)
        {
            return await _context.CommunityMembers
                .AnyAsync(m => m.CommunityId == communityId && m.UserId == userId
                               && (m.Role == "owner" || m.Role == "moderator") && !m.IsBanned, ct);
        }

        // Mapare privata: entitate → DTO
        private static CommunityResponseDto MapToDto(CommunityData community) => new CommunityResponseDto
        {
            Id = community.Id,
            Title = community.Title,
            Slug = community.Slug,
            Description = community.Description,
            BannerUrl = community.BannerUrl,
            AvatarUrl = community.AvatarUrl,
            MembersCount = community.MembersCount,
            Category = community.Category,
            Type = community.Type,
            CreatedAt = community.CreatedAt
        };

        // GET toate comunitatile
        public async Task<IReadOnlyList<CommunityResponseDto>> GetAllCommunitiesAsync(CancellationToken ct = default)
        {
            var communities = await _context.Communities
                .OrderByDescending(c => c.MembersCount)
                .ToListAsync(ct);

            return communities.Select(MapToDto).ToList().AsReadOnly();
        }



        public async Task<IReadOnlyList<CommunityResponseDto>> GetAllCommunitiesByTypeAsync(string type, CancellationToken ct = default)
        {
            var communities = await _context.Communities
                .Where(c => c.Type.ToLower() == type.ToLower())
                .OrderByDescending(c => c.MembersCount)
                .ToListAsync(ct);

            return communities.Select(MapToDto).ToList().AsReadOnly();
        }


        public async Task<IReadOnlyList<CommunityResponseDto>> GetCommunitiesByUserAsync(int userId, CancellationToken ct = default)
        {

            var communities = await _context.CommunityMembers
            .Where(m => m.UserId == userId)
                .Select(m => m.Community)
                .OrderBy(c => c.Title)
                .ToListAsync(ct);

            return communities.Select(MapToDto).ToList().AsReadOnly();


        }

        public async Task<IReadOnlyList<CommunityResponseDto>> SearchCommunitiesAsync(string searchTerm, CancellationToken ct = default)
        {
            var term = searchTerm.ToLower();

            var communities = await _context.Communities
                .Where(c => c.Title.ToLower().Contains(term) || c.Slug.ToLower().Contains(term))
                .OrderByDescending(c => c.MembersCount)
                .ToListAsync(ct);

            return communities.Select(MapToDto).ToList().AsReadOnly();
        }



        public async Task<CommunityResponseDto?> GetCommunityAsync(string slug, CancellationToken ct = default)
        {
            var community = await _context.Communities
                .FirstOrDefaultAsync(c => c.Slug == slug, ct);

            if (community == null) return null;

            return MapToDto(community);
        }


        public async Task<CommunityResponseDto?> CreateCommunityAsync(CommunityCreateDto communityData, int authorId, CancellationToken ct = default)
        {
            var slugExists = await _context.Communities
                .AnyAsync(c => c.Slug == communityData.Slug, ct);

            if (slugExists) return null;

            var community = new CommunityData
            {
                Title = communityData.Title,
                Slug = communityData.Slug,
                Description = communityData.Description,
                Category = communityData.Category,
                Type = communityData.Type,
                MembersCount = 1,
                CreatedAt = DateTime.UtcNow
            };

            _context.Communities.Add(community);

            try
            {
                await _context.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                return null;
            }

            var membership = new CommunityMemberData
            {
                UserId = authorId,
                CommunityId = community.Id,
                JoinedAt = DateTime.UtcNow,
                Role = "owner"
            };

            _context.CommunityMembers.Add(membership);

            try
            {
                await _context.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                // Comunitatea a fost creata, membership-ul nu — returnam totusi DTO-ul
            }

            return MapToDto(community);
        }



        public async Task<CommunityResponseDto?> UpdateCommunityAsync(int communityId, CommunityUpdateDto communityData, int requestingUserId, CancellationToken ct = default)
        {
            var community = await _context.Communities
                .FirstOrDefaultAsync(c => c.Id == communityId, ct);

            if (community == null) return null;

            var ownerUserId = await GetOwnerUserIdAsync(communityId, ct);
            if (ownerUserId == null || ownerUserId != requestingUserId) return null;

            if (communityData.Title != null) community.Title = communityData.Title;
            if (communityData.Description != null) community.Description = communityData.Description;
            if (communityData.BannerUrl != null) community.BannerUrl = communityData.BannerUrl;
            if (communityData.AvatarUrl != null) community.AvatarUrl = communityData.AvatarUrl;
            if (communityData.Category != null) community.Category = communityData.Category;
            if (communityData.Type != null) community.Type = communityData.Type;

            try
            {
                await _context.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                return null;
            }

            return MapToDto(community);
        }



        public async Task<ActionResponse> DeleteCommunityAsync(int communityId, int requestingUserId, CancellationToken ct = default)
        {
            var community = await _context.Communities
                .FirstOrDefaultAsync(c => c.Id == communityId, ct);

            if (community == null)
                return new ActionResponse { IsSuccess = false, Message = "Community not found." };

            var ownerUserId = await GetOwnerUserIdAsync(communityId, ct);
            if (ownerUserId == null || ownerUserId != requestingUserId)
                return new ActionResponse { IsSuccess = false, Message = "Only the community owner can delete this community." };

            _context.Communities.Remove(community);

            try
            {
                await _context.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                return new ActionResponse { IsSuccess = false, Message = "Failed to delete community." };
            }

            return new ActionResponse { IsSuccess = true, Message = "Community deleted successfully." };
        }


        public async Task<ActionResponse> JoinCommunityAsync(int communityId, int userId, CancellationToken ct = default)
        {
            var community = await _context.Communities
                .FirstOrDefaultAsync(c => c.Id == communityId, ct);

            if (community == null)
                return new ActionResponse { IsSuccess = false, Message = "Community not found." };

            var alreadyMember = await _context.CommunityMembers
                .AnyAsync(m => m.CommunityId == communityId && m.UserId == userId, ct);

            if (alreadyMember)
                return new ActionResponse { IsSuccess = false, Message = "You are already a member of this community." };

            var membership = new CommunityMemberData
            {
                UserId = userId,
                CommunityId = communityId,
                JoinedAt = DateTime.UtcNow,
                Role = "member"
            };

            _context.CommunityMembers.Add(membership);
            community.MembersCount++;

            try
            {
                await _context.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                return new ActionResponse { IsSuccess = false, Message = "Failed to join community." };
            }

            return new ActionResponse { IsSuccess = true, Message = "Successfully joined community." };
        }


        public async Task<ActionResponse> LeaveCommunityAsync(int communityId, int userId, CancellationToken ct = default)
        {
            var membership = await _context.CommunityMembers
                .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.UserId == userId && !m.IsBanned, ct);

            if (membership == null)
                return new ActionResponse { IsSuccess = false, Message = "You are not a member of this community." };

            var community = await _context.Communities
                .FirstOrDefaultAsync(c => c.Id == communityId, ct);

            var isOwnerLeaving = membership.Role == "owner";

            if (isOwnerLeaving)
            {
                // Promote a moderator or the oldest member as new owner before leaving
                var successor = await _context.CommunityMembers
                    .Where(m => m.CommunityId == communityId && m.UserId != userId && !m.IsBanned)
                    .OrderBy(m => m.Role == "moderator" ? 0 : 1)
                    .ThenBy(m => m.JoinedAt)
                    .FirstOrDefaultAsync(ct);

                if (successor != null)
                    successor.Role = "owner";
            }

            _context.CommunityMembers.Remove(membership);

            if (community != null && community.MembersCount > 0)
                community.MembersCount--;

            try
            {
                await _context.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                return new ActionResponse { IsSuccess = false, Message = "Failed to leave community." };
            }

            return new ActionResponse
            {
                IsSuccess = true,
                Message = isOwnerLeaving
                    ? "Successfully left community. Ownership transferred to next senior member."
                    : "Successfully left community."
            };
        }

        public async Task<bool> IsMemberAsync(int communityId, int userId, CancellationToken ct = default)
        {
            return await _context.CommunityMembers
                .AnyAsync(m => m.CommunityId == communityId && m.UserId == userId, ct);
        }

        public async Task<bool> IsOwnerAsync(int communityId, int userId, CancellationToken ct = default)
        {
            return await _context.CommunityMembers
                .AnyAsync(m => m.CommunityId == communityId && m.UserId == userId && m.Role == "owner" && !m.IsBanned, ct);
        }

        public async Task<string?> GetUserRoleAsync(int communityId, int userId, CancellationToken ct = default)
        {
            var member = await _context.CommunityMembers
                .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.UserId == userId && !m.IsBanned, ct);

            return member?.Role;
        }

        public async Task<IReadOnlyList<CommunityMemberResponseDto>> GetMembersAsync(int communityId, CancellationToken ct = default)
        {
            var members = await _context.CommunityMembers
                .Where(m => m.CommunityId == communityId && !m.IsBanned)
                .Include(m => m.User)
                .OrderBy(m => m.Role == "owner" ? 0 : m.Role == "moderator" ? 1 : 2)
                .ThenBy(m => m.User.UserName)
                .Select(m => new CommunityMemberResponseDto
                {
                    UserId = m.UserId,
                    UserName = m.User.UserName,
                    AvatarUrl = m.User.AvatarUrl,
                    Role = m.Role,
                    Karma = m.User.Karma,
                    JoinedAt = m.JoinedAt
                })
                .ToListAsync(ct);

            return members.AsReadOnly();
        }

        public async Task<IReadOnlyList<CommunityMemberResponseDto>> GetBannedMembersAsync(int communityId, CancellationToken ct = default)
        {
            var banned = await _context.CommunityMembers
                .Where(m => m.CommunityId == communityId && m.IsBanned)
                .Include(m => m.User)
                .OrderByDescending(m => m.BannedAt)
                .ToListAsync(ct);

            var bannedByIds = banned
                .Where(m => m.BannedByUserId.HasValue)
                .Select(m => m.BannedByUserId!.Value)
                .Distinct()
                .ToList();

            var bannedByUsers = await _context.Users
                .Where(u => bannedByIds.Contains(u.ID))
                .ToDictionaryAsync(u => u.ID, u => u.UserName, ct);

            return banned.Select(m => new CommunityMemberResponseDto
            {
                UserId = m.UserId,
                UserName = m.User.UserName,
                AvatarUrl = m.User.AvatarUrl,
                Role = m.Role,
                Karma = m.User.Karma,
                JoinedAt = m.JoinedAt,
                BanReason = m.BanReason,
                BannedAt = m.BannedAt,
                BannedByUserName = m.BannedByUserId.HasValue && bannedByUsers.TryGetValue(m.BannedByUserId.Value, out var name) ? name : null
            }).ToList().AsReadOnly();
        }

        public async Task<ActionResponse> PromoteToModeratorAsync(int communityId, int targetUserId, int requestingUserId, CancellationToken ct = default)
        {
            var isOwner = await IsOwnerAsync(communityId, requestingUserId, ct);
            if (!isOwner)
                return new ActionResponse { IsSuccess = false, Message = "Only the community owner can promote moderators." };

            var target = await _context.CommunityMembers
                .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.UserId == targetUserId && !m.IsBanned, ct);

            if (target == null)
                return new ActionResponse { IsSuccess = false, Message = "Member not found in this community." };

            if (target.Role != "member")
                return new ActionResponse { IsSuccess = false, Message = "User is already a moderator or owner." };

            target.Role = "moderator";

            try { await _context.SaveChangesAsync(ct); }
            catch (DbUpdateException) { return new ActionResponse { IsSuccess = false, Message = "Failed to promote member." }; }

            return new ActionResponse { IsSuccess = true, Message = "Member promoted to moderator." };
        }

        public async Task<ActionResponse> DemoteFromModeratorAsync(int communityId, int targetUserId, int requestingUserId, CancellationToken ct = default)
        {
            var isOwner = await IsOwnerAsync(communityId, requestingUserId, ct);
            if (!isOwner)
                return new ActionResponse { IsSuccess = false, Message = "Only the community owner can demote moderators." };

            var target = await _context.CommunityMembers
                .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.UserId == targetUserId, ct);

            if (target == null || target.Role != "moderator")
                return new ActionResponse { IsSuccess = false, Message = "User is not a moderator in this community." };

            target.Role = "member";

            try { await _context.SaveChangesAsync(ct); }
            catch (DbUpdateException) { return new ActionResponse { IsSuccess = false, Message = "Failed to demote moderator." }; }

            return new ActionResponse { IsSuccess = true, Message = "Moderator demoted to member." };
        }

        public async Task<ActionResponse> KickMemberAsync(int communityId, int targetUserId, int requestingUserId, CancellationToken ct = default)
        {
            var canAct = await IsModeratorOrOwnerAsync(communityId, requestingUserId, ct);
            if (!canAct)
                return new ActionResponse { IsSuccess = false, Message = "You must be a moderator or owner to kick members." };

            var target = await _context.CommunityMembers
                .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.UserId == targetUserId && !m.IsBanned, ct);

            if (target == null)
                return new ActionResponse { IsSuccess = false, Message = "Member not found in this community." };

            if (target.Role == "owner")
                return new ActionResponse { IsSuccess = false, Message = "Cannot kick the community owner." };

            var requestingMember = await _context.CommunityMembers
                .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.UserId == requestingUserId, ct);

            if (requestingMember?.Role == "moderator" && target.Role == "moderator")
                return new ActionResponse { IsSuccess = false, Message = "Moderators cannot kick other moderators." };

            var community = await _context.Communities.FirstOrDefaultAsync(c => c.Id == communityId, ct);
            _context.CommunityMembers.Remove(target);
            if (community != null && community.MembersCount > 0) community.MembersCount--;

            try { await _context.SaveChangesAsync(ct); }
            catch (DbUpdateException) { return new ActionResponse { IsSuccess = false, Message = "Failed to kick member." }; }

            return new ActionResponse { IsSuccess = true, Message = "Member kicked from community." };
        }

        public async Task<ActionResponse> BanMemberAsync(int communityId, int targetUserId, int requestingUserId, string reason, CancellationToken ct = default)
        {
            var canAct = await IsModeratorOrOwnerAsync(communityId, requestingUserId, ct);
            if (!canAct)
                return new ActionResponse { IsSuccess = false, Message = "You must be a moderator or owner to ban members." };

            var target = await _context.CommunityMembers
                .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.UserId == targetUserId, ct);

            if (target == null)
            {
                // Userul nu e in comunitate — il adaugam ca ban direct
                target = new CommunityMemberData
                {
                    UserId = targetUserId,
                    CommunityId = communityId,
                    JoinedAt = DateTime.UtcNow,
                    Role = "member"
                };
                _context.CommunityMembers.Add(target);
            }
            else
            {
                if (target.IsBanned)
                    return new ActionResponse { IsSuccess = false, Message = "User is already banned." };

                if (target.Role == "owner")
                    return new ActionResponse { IsSuccess = false, Message = "Cannot ban the community owner." };

                var requestingMember = await _context.CommunityMembers
                    .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.UserId == requestingUserId, ct);

                if (requestingMember?.Role == "moderator" && target.Role == "moderator")
                    return new ActionResponse { IsSuccess = false, Message = "Moderators cannot ban other moderators." };

                var community = await _context.Communities.FirstOrDefaultAsync(c => c.Id == communityId, ct);
                if (community != null && community.MembersCount > 0) community.MembersCount--;
            }

            target.IsBanned = true;
            target.BanReason = reason;
            target.BannedAt = DateTime.UtcNow;
            target.BannedByUserId = requestingUserId;

            try { await _context.SaveChangesAsync(ct); }
            catch (DbUpdateException) { return new ActionResponse { IsSuccess = false, Message = "Failed to ban member." }; }

            return new ActionResponse { IsSuccess = true, Message = "Member banned from community." };
        }

        public async Task<ActionResponse> UnbanMemberAsync(int communityId, int targetUserId, int requestingUserId, CancellationToken ct = default)
        {
            var canAct = await IsModeratorOrOwnerAsync(communityId, requestingUserId, ct);
            if (!canAct)
                return new ActionResponse { IsSuccess = false, Message = "You must be a moderator or owner to unban members." };

            var target = await _context.CommunityMembers
                .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.UserId == targetUserId && m.IsBanned, ct);

            if (target == null)
                return new ActionResponse { IsSuccess = false, Message = "No active ban found for this user." };

            target.IsBanned = false;
            target.BanReason = null;
            target.BannedAt = null;
            target.BannedByUserId = null;
            target.Role = "member";

            var community = await _context.Communities.FirstOrDefaultAsync(c => c.Id == communityId, ct);
            if (community != null) community.MembersCount++;

            try { await _context.SaveChangesAsync(ct); }
            catch (DbUpdateException) { return new ActionResponse { IsSuccess = false, Message = "Failed to unban member." }; }

            return new ActionResponse { IsSuccess = true, Message = "Member unbanned." };
        }

        public async Task<CommunityStatsDto> GetCommunityStatsAsync(int communityId, CancellationToken ct = default)
        {
            var membersCount = await _context.CommunityMembers
                .CountAsync(m => m.CommunityId == communityId && !m.IsBanned, ct);

            var moderatorsCount = await _context.CommunityMembers
                .CountAsync(m => m.CommunityId == communityId && m.Role == "moderator" && !m.IsBanned, ct);

            var postsCount = await _context.Posts
                .CountAsync(p => p.CommunityId == communityId, ct);

            var bannedCount = await _context.CommunityMembers
                .CountAsync(m => m.CommunityId == communityId && m.IsBanned, ct);

            return new CommunityStatsDto
            {
                MembersCount = membersCount,
                ModeratorsCount = moderatorsCount,
                PostsCount = postsCount,
                BannedCount = bannedCount
            };
        }

        public async Task<ActionResponse> TransferOwnershipAsync(int communityId, int newOwnerId, int requestingUserId, CancellationToken ct = default)
        {
            var isOwner = await IsOwnerAsync(communityId, requestingUserId, ct);
            if (!isOwner)
                return new ActionResponse { IsSuccess = false, Message = "Only the current owner can transfer ownership." };

            var currentOwner = await _context.CommunityMembers
                .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.UserId == requestingUserId && m.Role == "owner", ct);

            var newOwner = await _context.CommunityMembers
                .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.UserId == newOwnerId && !m.IsBanned, ct);

            if (newOwner == null)
                return new ActionResponse { IsSuccess = false, Message = "Target user is not a member of this community." };

            if (currentOwner != null) currentOwner.Role = "member";
            newOwner.Role = "owner";

            try { await _context.SaveChangesAsync(ct); }
            catch (DbUpdateException) { return new ActionResponse { IsSuccess = false, Message = "Failed to transfer ownership." }; }

            return new ActionResponse { IsSuccess = true, Message = "Ownership transferred successfully." };
        }



    }
}
