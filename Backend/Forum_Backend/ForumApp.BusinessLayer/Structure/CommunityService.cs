using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Entities.Community;
using ForumApp.Domain.Entities.CommunityMember;
using ForumApp.Domain.Models.Community;
using ForumApp.Domain.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Structure
{
    public class CommunityService : ICommunityActions
    {
        private readonly ForumDbContext _context;

        public CommunityService(ForumDbContext context)
        {
            _context = context;
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
                JoinedAt = DateTime.UtcNow
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

            var isMember = await _context.CommunityMembers
                .AnyAsync(m => m.CommunityId == communityId && m.UserId == requestingUserId, ct);

            if (!isMember) return null;

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

            var isMember = await _context.CommunityMembers
                .AnyAsync(m => m.CommunityId == communityId && m.UserId == requestingUserId, ct);

            if (!isMember)
                return new ActionResponse { IsSuccess = false, Message = "You do not have permission to delete this community." };

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
                JoinedAt = DateTime.UtcNow
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
                .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.UserId == userId, ct);

            if (membership == null)
                return new ActionResponse { IsSuccess = false, Message = "You are not a member of this community." };

            var community = await _context.Communities
                .FirstOrDefaultAsync(c => c.Id == communityId, ct);

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

            return new ActionResponse { IsSuccess = true, Message = "Successfully left community." };
        }

        public async Task<bool> IsMemberAsync(int communityId, int userId, CancellationToken ct = default)
        {
            return await _context.CommunityMembers
                .AnyAsync(m => m.CommunityId == communityId && m.UserId == userId, ct);
        }







    }
}
