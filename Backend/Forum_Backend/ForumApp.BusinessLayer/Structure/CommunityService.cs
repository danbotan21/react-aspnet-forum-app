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

    }
}
