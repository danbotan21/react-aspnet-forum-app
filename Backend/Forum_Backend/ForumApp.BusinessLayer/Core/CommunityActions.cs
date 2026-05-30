using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Entities.Community;
using ForumApp.Domain.Entities.CommunityMember;
using ForumApp.Domain.Entities.ModLog;
using ForumApp.Domain.Entities.Notification;
using ForumApp.Domain.Models.Community;
using ForumApp.Domain.Models.ModLog;
using ForumApp.Domain.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Core
{
    public class CommunityActions
    {
        protected readonly ForumDbContext _context;
        protected readonly INotificationAction _notificationActions;

        public CommunityActions(ForumDbContext context, INotificationAction notificationActions)
        {
            _context = context;
            _notificationActions = notificationActions;
        }

        private async Task<int?> GetOwnerUserIdAsync(int communityId, CancellationToken ct = default)
        {
            return await _context.CommunityMembers
                .Where(m => m.CommunityId == communityId && m.Role == "owner" && !m.IsBanned)
                .Select(m => (int?)m.UserId)
                .FirstOrDefaultAsync(ct);
        }

        // True if the user is a global application admin. Such users get owner-level
        // power in EVERY community's mod tools (absolute control across the app).
        private Task<bool> IsGlobalAdminAsync(int userId, CancellationToken ct = default)
            => _context.Users.AnyAsync(u => u.ID == userId && u.Role == "Admin", ct);

        private async Task<bool> IsModeratorOrOwnerAsync(int communityId, int userId, CancellationToken ct = default)
        {
            var isCommunityStaff = await _context.CommunityMembers
                .AnyAsync(m => m.CommunityId == communityId && m.UserId == userId
                               && (m.Role == "owner" || m.Role == "moderator") && !m.IsBanned, ct);
            return isCommunityStaff || await IsGlobalAdminAsync(userId, ct);
        }

        private void AddModLog(int communityId, string actionType, int actorId, int? targetUserId = null, int? targetPostId = null, string? details = null)
        {
            _context.ModLogs.Add(new ModLogEntryData
            {
                CommunityId = communityId,
                ActionType = actionType,
                ActorId = actorId,
                TargetUserId = targetUserId,
                TargetPostId = targetPostId,
                Details = details,
                CreatedAt = DateTime.UtcNow
            });
        }

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
            Rules = community.Rules,
            CreatedAt = community.CreatedAt
        };

        internal async Task<IReadOnlyList<CommunityResponseDto>> GetAllCommunitiesExecution(CancellationToken ct = default)
        {
            var communities = await _context.Communities
                .Where(c => c.Type.ToLower() != "private")
                .OrderByDescending(c => c.MembersCount)
                .ToListAsync(ct);

            return communities.Select(MapToDto).ToList().AsReadOnly();
        }

        internal async Task<IReadOnlyList<CommunityResponseDto>> GetAllCommunitiesByTypeExecution(string type, CancellationToken ct = default)
        {
            if (type.ToLower() == "private")
                return Array.Empty<CommunityResponseDto>();

            var communities = await _context.Communities
                .Where(c => c.Type.ToLower() == type.ToLower())
                .OrderByDescending(c => c.MembersCount)
                .ToListAsync(ct);

            return communities.Select(MapToDto).ToList().AsReadOnly();
        }

        internal async Task<IReadOnlyList<CommunityResponseDto>> GetCommunitiesByUserExecution(int userId, CancellationToken ct = default)
        {
            var communities = await _context.CommunityMembers
                .Where(m => m.UserId == userId)
                .Select(m => m.Community)
                .OrderBy(c => c.Title)
                .ToListAsync(ct);

            return communities.Select(MapToDto).ToList().AsReadOnly();
        }

        internal async Task<IReadOnlyList<CommunityResponseDto>> SearchCommunitiesExecution(string searchTerm, CancellationToken ct = default)
        {
            var term = searchTerm.ToLower();

            var communities = await _context.Communities
                .Where(c => c.Type.ToLower() != "private"
                         && (c.Title.ToLower().Contains(term) || c.Slug.ToLower().Contains(term)))
                .OrderByDescending(c => c.MembersCount)
                .ToListAsync(ct);

            return communities.Select(MapToDto).ToList().AsReadOnly();
        }

        internal async Task<CommunityResponseDto?> GetCommunityExecution(string slug, int? requestingUserId = null, CancellationToken ct = default)
        {
            var community = await _context.Communities
                .FirstOrDefaultAsync(c => c.Slug == slug, ct);

            if (community == null) return null;

            if (community.Type.ToLower() == "private")
            {
                if (requestingUserId == null) return null;

                var isMember = await _context.CommunityMembers
                    .AnyAsync(m => m.CommunityId == community.Id
                                && m.UserId == requestingUserId.Value
                                && !m.IsBanned, ct);

                if (!isMember) return null;
            }

            var dto = MapToDto(community);
            dto.MembersCount = await _context.CommunityMembers
                .CountAsync(m => m.CommunityId == community.Id && !m.IsBanned, ct);
            return dto;
        }

        internal async Task<CommunityResponseDto?> CreateCommunityExecution(CommunityCreateDto communityData, int authorId, CancellationToken ct = default)
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
            catch (DbUpdateException) { }

            return MapToDto(community);
        }

        internal async Task<CommunityResponseDto?> UpdateCommunityExecution(int communityId, CommunityUpdateDto communityData, int requestingUserId, CancellationToken ct = default)
        {
            var community = await _context.Communities
                .FirstOrDefaultAsync(c => c.Id == communityId, ct);

            if (community == null) return null;

            var ownerUserId = await GetOwnerUserIdAsync(communityId, ct);
            if ((ownerUserId == null || ownerUserId != requestingUserId) && !await IsGlobalAdminAsync(requestingUserId, ct))
                return null;

            if (communityData.Title != null) community.Title = communityData.Title;
            if (communityData.Description != null) community.Description = communityData.Description;
            community.BannerUrl = communityData.BannerUrl;
            community.AvatarUrl = communityData.AvatarUrl;
            if (communityData.Category != null) community.Category = communityData.Category;
            if (communityData.Type != null) community.Type = communityData.Type;
            community.Rules = communityData.Rules;

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

        internal async Task<ActionResponse> DeleteCommunityExecution(int communityId, int requestingUserId, bool isPrivileged = false, CancellationToken ct = default)
        {
            var community = await _context.Communities
                .FirstOrDefaultAsync(c => c.Id == communityId, ct);

            if (community == null)
                return new ActionResponse { IsSuccess = false, Message = "Community not found." };

            if (!isPrivileged)
            {
                var ownerUserId = await GetOwnerUserIdAsync(communityId, ct);
                if (ownerUserId == null || ownerUserId != requestingUserId)
                    return new ActionResponse { IsSuccess = false, Message = "Only the community owner can delete this community." };
            }

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

        internal async Task<ActionResponse> JoinCommunityExecution(int communityId, int userId, CancellationToken ct = default)
        {
            var community = await _context.Communities
                .FirstOrDefaultAsync(c => c.Id == communityId, ct);

            if (community == null)
                return new ActionResponse { IsSuccess = false, Message = "Community not found." };

            if (community.Type.ToLower() == "private")
                return new ActionResponse { IsSuccess = false, Message = "This is a private community. You can only be added by the owner or a moderator." };

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

        internal async Task<ActionResponse> LeaveCommunityExecution(int communityId, int userId, CancellationToken ct = default)
        {
            var membership = await _context.CommunityMembers
                .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.UserId == userId, ct);

            if (membership == null)
                return new ActionResponse { IsSuccess = false, Message = "You are not a member of this community." };

            var community = await _context.Communities
                .FirstOrDefaultAsync(c => c.Id == communityId, ct);

            var isOwnerLeaving = membership.Role == "owner";

            if (isOwnerLeaving)
            {
                var successor = await _context.CommunityMembers
                    .Where(m => m.CommunityId == communityId && m.UserId != userId && !m.IsBanned)
                    .OrderBy(m => m.Role == "moderator" ? 0 : 1)
                    .ThenBy(m => m.JoinedAt)
                    .FirstOrDefaultAsync(ct);

                if (successor != null)
                    successor.Role = "owner";
            }

            _context.CommunityMembers.Remove(membership);

            if (community != null && community.MembersCount > 0 && !membership.IsBanned)
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

        internal async Task<bool> IsMemberExecution(int communityId, int userId, CancellationToken ct = default)
        {
            return await _context.CommunityMembers
                .AnyAsync(m => m.CommunityId == communityId && m.UserId == userId, ct);
        }

        internal async Task<bool> IsOwnerExecution(int communityId, int userId, CancellationToken ct = default)
        {
            return await _context.CommunityMembers
                .AnyAsync(m => m.CommunityId == communityId && m.UserId == userId && m.Role == "owner" && !m.IsBanned, ct);
        }

        internal async Task<string?> GetUserRoleExecution(int communityId, int userId, CancellationToken ct = default)
        {
            var member = await _context.CommunityMembers
                .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.UserId == userId && !m.IsBanned, ct);

            // Global admins are treated as owners of every community so the mod panel
            // opens with full controls, even if they aren't members.
            if ((member == null || member.Role == "member") && await IsGlobalAdminAsync(userId, ct))
                return "owner";

            return member?.Role;
        }

        internal async Task<IReadOnlyList<CommunityMemberResponseDto>> GetMembersExecution(int communityId, CancellationToken ct = default)
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

        internal async Task<IReadOnlyList<CommunityMemberResponseDto>> GetBannedMembersExecution(int communityId, CancellationToken ct = default)
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

        internal async Task<ActionResponse> PromoteToModeratorExecution(int communityId, int targetUserId, int requestingUserId, CancellationToken ct = default)
        {
            var isOwner = await IsOwnerExecution(communityId, requestingUserId, ct) || await IsGlobalAdminAsync(requestingUserId, ct);
            if (!isOwner)
                return new ActionResponse { IsSuccess = false, Message = "Only the community owner can promote moderators." };

            var target = await _context.CommunityMembers
                .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.UserId == targetUserId && !m.IsBanned, ct);

            if (target == null)
                return new ActionResponse { IsSuccess = false, Message = "Member not found in this community." };

            if (target.Role != "member")
                return new ActionResponse { IsSuccess = false, Message = "User is already a moderator or owner." };

            target.Role = "moderator";
            AddModLog(communityId, "promote", requestingUserId, targetUserId);

            try { await _context.SaveChangesAsync(ct); }
            catch (DbUpdateException) { return new ActionResponse { IsSuccess = false, Message = "Failed to promote member." }; }

            return new ActionResponse { IsSuccess = true, Message = "Member promoted to moderator." };
        }

        internal async Task<ActionResponse> DemoteFromModeratorExecution(int communityId, int targetUserId, int requestingUserId, CancellationToken ct = default)
        {
            var isOwner = await IsOwnerExecution(communityId, requestingUserId, ct) || await IsGlobalAdminAsync(requestingUserId, ct);
            if (!isOwner)
                return new ActionResponse { IsSuccess = false, Message = "Only the community owner can demote moderators." };

            var target = await _context.CommunityMembers
                .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.UserId == targetUserId, ct);

            if (target == null || target.Role != "moderator")
                return new ActionResponse { IsSuccess = false, Message = "User is not a moderator in this community." };

            target.Role = "member";
            AddModLog(communityId, "demote", requestingUserId, targetUserId);

            try { await _context.SaveChangesAsync(ct); }
            catch (DbUpdateException) { return new ActionResponse { IsSuccess = false, Message = "Failed to demote moderator." }; }

            return new ActionResponse { IsSuccess = true, Message = "Moderator demoted to member." };
        }

        internal async Task<ActionResponse> KickMemberExecution(int communityId, int targetUserId, int requestingUserId, CancellationToken ct = default)
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
            AddModLog(communityId, "kick", requestingUserId, targetUserId);

            try { await _context.SaveChangesAsync(ct); }
            catch (DbUpdateException) { return new ActionResponse { IsSuccess = false, Message = "Failed to kick member." }; }

            return new ActionResponse { IsSuccess = true, Message = "Member kicked from community." };
        }

        internal async Task<ActionResponse> BanMemberExecution(int communityId, int targetUserId, int requestingUserId, string reason, CancellationToken ct = default)
        {
            var canAct = await IsModeratorOrOwnerAsync(communityId, requestingUserId, ct);
            if (!canAct)
                return new ActionResponse { IsSuccess = false, Message = "You must be a moderator or owner to ban members." };

            var target = await _context.CommunityMembers
                .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.UserId == targetUserId, ct);

            if (target == null)
            {
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
            AddModLog(communityId, "ban", requestingUserId, targetUserId, null, reason);

            try { await _context.SaveChangesAsync(ct); }
            catch (DbUpdateException) { return new ActionResponse { IsSuccess = false, Message = "Failed to ban member." }; }

            try
            {
                var communitySlug = (await _context.Communities
                    .Where(c => c.Id == communityId)
                    .Select(c => c.Slug)
                    .FirstOrDefaultAsync(ct)) ?? string.Empty;

                var banMessage = string.IsNullOrWhiteSpace(reason)
                    ? $"You have been banned from c/{communitySlug}."
                    : $"You have been banned from c/{communitySlug}. Reason: {reason}";

                await _notificationActions.CreateAndSendAsync(
                    targetUserId,
                    NotificationType.Banned,
                    banMessage,
                    requestingUserId,
                    null,
                    null,
                    communitySlug,
                    null,
                    ct);
            }
            catch { }

            return new ActionResponse { IsSuccess = true, Message = "Member banned from community." };
        }

        internal async Task<ActionResponse> UnbanMemberExecution(int communityId, int targetUserId, int requestingUserId, CancellationToken ct = default)
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

            var community2 = await _context.Communities.FirstOrDefaultAsync(c => c.Id == communityId, ct);
            if (community2 != null) community2.MembersCount++;
            AddModLog(communityId, "unban", requestingUserId, targetUserId);

            try { await _context.SaveChangesAsync(ct); }
            catch (DbUpdateException) { return new ActionResponse { IsSuccess = false, Message = "Failed to unban member." }; }

            return new ActionResponse { IsSuccess = true, Message = "Member unbanned." };
        }

        internal async Task<CommunityStatsDto> GetCommunityStatsExecution(int communityId, CancellationToken ct = default)
        {
            var membersCount = await _context.CommunityMembers.CountAsync(m => m.CommunityId == communityId && !m.IsBanned, ct);
            var moderatorsCount = await _context.CommunityMembers.CountAsync(m => m.CommunityId == communityId && m.Role == "moderator" && !m.IsBanned, ct);
            var postsCount = await _context.Posts.CountAsync(p => p.CommunityId == communityId, ct);
            var bannedCount = await _context.CommunityMembers.CountAsync(m => m.CommunityId == communityId && m.IsBanned, ct);

            return new CommunityStatsDto
            {
                MembersCount = membersCount,
                ModeratorsCount = moderatorsCount,
                PostsCount = postsCount,
                BannedCount = bannedCount
            };
        }

        internal async Task<IReadOnlyList<ModLogEntryDto>> GetModLogExecution(int communityId, int requestingUserId, string? actionType = null, CancellationToken ct = default)
        {
            var canAct = await IsModeratorOrOwnerAsync(communityId, requestingUserId, ct);
            if (!canAct) return new List<ModLogEntryDto>().AsReadOnly();

            var query = _context.ModLogs
                .Where(l => l.CommunityId == communityId)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(actionType) && actionType.ToLower() != "all")
                query = query.Where(l => l.ActionType == actionType.ToLower());

            var entries = await query
                .OrderByDescending(l => l.CreatedAt)
                .Take(200)
                .Select(l => new ModLogEntryDto
                {
                    Id = l.Id,
                    ActionType = l.ActionType,
                    ActorUserName = l.Actor.UserName,
                    TargetUserName = l.TargetUser != null ? l.TargetUser.UserName : null,
                    TargetPostId = l.TargetPostId,
                    Details = l.Details,
                    CreatedAt = l.CreatedAt
                })
                .ToListAsync(ct);

            return entries.AsReadOnly();
        }

        internal async Task<ActionResponse> TransferOwnershipExecution(int communityId, int newOwnerId, int requestingUserId, CancellationToken ct = default)
        {
            var isOwner = await IsOwnerExecution(communityId, requestingUserId, ct) || await IsGlobalAdminAsync(requestingUserId, ct);
            if (!isOwner)
                return new ActionResponse { IsSuccess = false, Message = "Only the current owner can transfer ownership." };

            // Find the community's actual owner (the requesting user may be a global admin
            // who isn't the owner) so we don't end up with two owners.
            var currentOwner = await _context.CommunityMembers
                .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.Role == "owner", ct);

            var newOwner = await _context.CommunityMembers
                .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.UserId == newOwnerId && !m.IsBanned, ct);

            if (newOwner == null)
                return new ActionResponse { IsSuccess = false, Message = "Target user is not a member of this community." };

            if (currentOwner != null) currentOwner.Role = "member";
            newOwner.Role = "owner";
            AddModLog(communityId, "transfer", requestingUserId, newOwnerId);

            try { await _context.SaveChangesAsync(ct); }
            catch (DbUpdateException) { return new ActionResponse { IsSuccess = false, Message = "Failed to transfer ownership." }; }

            return new ActionResponse { IsSuccess = true, Message = "Ownership transferred successfully." };
        }

        internal async Task<IReadOnlyList<CommunityWithRoleDto>> GetUserCommunitiesWithRolesExecution(int userId, CancellationToken ct = default)
        {
            var memberships = await _context.CommunityMembers
                .Where(m => m.UserId == userId)
                .Include(m => m.Community)
                .OrderBy(m => m.Community.Title)
                .Select(m => new CommunityWithRoleDto
                {
                    Id = m.Community.Id,
                    Title = m.Community.Title,
                    Slug = m.Community.Slug,
                    AvatarUrl = m.Community.AvatarUrl,
                    MembersCount = m.Community.MembersCount,
                    Type = m.Community.Type,
                    Role = m.Role,
                    IsBanned = m.IsBanned,
                    BanReason = m.BanReason,
                })
                .ToListAsync(ct);

            return memberships.AsReadOnly();
        }

        internal async Task<(bool IsBanned, string? BanReason)> GetUserBanStatusExecution(int communityId, int userId, CancellationToken ct = default)
        {
            var member = await _context.CommunityMembers
                .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.UserId == userId && m.IsBanned, ct);
            return (member != null, member?.BanReason);
        }
    }
}
