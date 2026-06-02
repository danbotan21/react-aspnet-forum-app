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
    public class CommunityActions : BaseActions
    {
        protected readonly INotificationAction _notificationActions;

        public CommunityActions(ForumDbContext context, INotificationAction notificationActions) : base(context)
        {
            _notificationActions = notificationActions;
        }

        // How long a kicked user must wait before they can rejoin a community.
        // TEST value: 1 minute. For production use TimeSpan.FromHours(24).
        private static readonly TimeSpan KickRejoinCooldown = TimeSpan.FromMinutes(1);

        private async Task<int?> GetOwnerUserIdAsync(int communityId, CancellationToken ct = default)
        {
            return await _context.CommunityMembers
                .Where(m => m.CommunityId == communityId && m.Role == "owner" && !m.IsBanned)
                .Select(m => (int?)m.UserId)
                .FirstOrDefaultAsync(ct);
        }

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

        // Removes a community and everything under it (posts + their comments/votes/
        // saves/reports, members, mod logs, reports; drafts keep their author but lose
        // the community reference). All FKs are NoAction, so children go first.
        // Does NOT call SaveChanges — the caller batches the save.
        private async Task CascadeDeleteCommunityAsync(int communityId, CommunityData community, CancellationToken ct = default)
        {
            var postIds = await _context.Posts
                .Where(p => p.CommunityId == communityId)
                .Select(p => p.Id)
                .ToListAsync(ct);
            await CascadeDeletePostsAsync(postIds, ct);

            var members = await _context.CommunityMembers
                .Where(m => m.CommunityId == communityId)
                .ToListAsync(ct);
            _context.CommunityMembers.RemoveRange(members);

            var modLogs = await _context.ModLogs
                .Where(l => l.CommunityId == communityId)
                .ToListAsync(ct);
            _context.ModLogs.RemoveRange(modLogs);

            var communityReports = await _context.Reports
                .Where(r => r.CommunityId == communityId)
                .ToListAsync(ct);
            _context.Reports.RemoveRange(communityReports);

            var communityDrafts = await _context.Drafts
                .Where(d => d.CommunityId == communityId)
                .ToListAsync(ct);
            foreach (var draft in communityDrafts)
                draft.CommunityId = null;

            _context.Communities.Remove(community);
        }

        // Maps communityId -> owner username for the given communities (one batched query).
        private async Task<Dictionary<int, string>> GetOwnerNamesAsync(IEnumerable<int> communityIds, CancellationToken ct)
        {
            var ids = communityIds.Distinct().ToList();
            if (ids.Count == 0) return new Dictionary<int, string>();

            var owners = await _context.CommunityMembers
                .Where(m => ids.Contains(m.CommunityId) && m.Role == "owner")
                .Select(m => new { m.CommunityId, m.User.UserName })
                .ToListAsync(ct);

            return owners
                .GroupBy(o => o.CommunityId)
                .ToDictionary(g => g.Key, g => g.First().UserName);
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

        internal async Task<IReadOnlyList<CommunityResponseDto>> GetAllCommunitiesExecution(int? requestingUserId = null, CancellationToken ct = default)
        {
            // Global admins see every community, including private ones.
            var isAdmin = requestingUserId.HasValue && await IsGlobalAdminAsync(requestingUserId.Value, ct);

            // Admins see everything; everyone else also sees the private communities they
            // are a (non-banned) member of.
            var communities = await _context.Communities
                .Where(c => isAdmin || c.Type.ToLower() != "private" ||
                    (requestingUserId.HasValue && _context.CommunityMembers.Any(m =>
                        m.CommunityId == c.Id && m.UserId == requestingUserId.Value && !m.IsBanned)))
                .OrderByDescending(c => c.MembersCount)
                .ToListAsync(ct);

            var ownerNames = await GetOwnerNamesAsync(communities.Select(c => c.Id), ct);
            return communities.Select(c =>
            {
                var dto = MapToDto(c);
                dto.OwnerUserName = ownerNames.GetValueOrDefault(c.Id);
                return dto;
            }).ToList().AsReadOnly();
        }

        internal async Task<IReadOnlyList<CommunityResponseDto>> GetAllCommunitiesByTypeExecution(string type, int? requestingUserId = null, CancellationToken ct = default)
        {
            var isAdmin = requestingUserId.HasValue && await IsGlobalAdminAsync(requestingUserId.Value, ct);

            // Only admins may list private communities.
            if (type.ToLower() == "private" && !isAdmin)
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

        internal async Task<IReadOnlyList<CommunityResponseDto>> SearchCommunitiesExecution(string searchTerm, int? requestingUserId = null, CancellationToken ct = default)
        {
            var term = searchTerm.ToLower();
            var isAdmin = requestingUserId.HasValue && await IsGlobalAdminAsync(requestingUserId.Value, ct);

            var communities = await _context.Communities
                .Where(c => (isAdmin || c.Type.ToLower() != "private")
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

                // Global admins can open any private community (e.g. via the admin panel's
                // Mod Tools link) even though they aren't members.
                if (!isMember && !await IsGlobalAdminAsync(requestingUserId.Value, ct))
                    return null;
            }

            var dto = MapToDto(community);
            dto.MembersCount = await _context.CommunityMembers
                .CountAsync(m => m.CommunityId == community.Id && !m.IsBanned, ct);
            dto.OwnerUserName = await _context.CommunityMembers
                .Where(m => m.CommunityId == community.Id && m.Role == "owner")
                .Select(m => m.User.UserName)
                .FirstOrDefaultAsync(ct);
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

            // A non-supreme admin may not delete a community owned by a fellow admin.
            var communityOwnerId = await GetOwnerUserIdAsync(communityId, ct);
            if (communityOwnerId.HasValue && await IsProtectedAdminContentAsync(communityOwnerId.Value, requestingUserId, ct))
                return new ActionResponse { IsSuccess = false, Message = "Only the primary administrator can delete another administrator's community." };

            await CascadeDeleteCommunityAsync(communityId, community, ct);

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

            var existing = await _context.CommunityMembers
                .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.UserId == userId, ct);

            if (existing != null)
            {
                if (existing.IsBanned)
                    return new ActionResponse { IsSuccess = false, Message = "You are banned from this community and cannot join." };

                return new ActionResponse { IsSuccess = false, Message = "You are already a member of this community." };
            }

            // Kick cooldown: a recently kicked user must wait before rejoining. We read
            // the timestamp from the existing kick mod-log entry, so no schema change is
            // needed. (Test value 1 min; production should be 24h.)
            var lastKickAt = await _context.ModLogs
                .Where(l => l.CommunityId == communityId && l.TargetUserId == userId && l.ActionType == "kick")
                .OrderByDescending(l => l.CreatedAt)
                .Select(l => (DateTime?)l.CreatedAt)
                .FirstOrDefaultAsync(ct);

            if (lastKickAt.HasValue)
            {
                var rejoinAt = lastKickAt.Value.Add(KickRejoinCooldown);
                if (rejoinAt > DateTime.UtcNow)
                {
                    var remaining = rejoinAt - DateTime.UtcNow;
                    var wait = remaining.TotalMinutes >= 1
                        ? $"{Math.Ceiling(remaining.TotalMinutes)} minute(s)"
                        : $"{Math.Ceiling(remaining.TotalSeconds)} second(s)";
                    return new ActionResponse { IsSuccess = false, Message = $"You were recently kicked from this community. You can rejoin in {wait}." };
                }
            }

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

            // A banned member is already excluded from the community everywhere (sidebar,
            // member list, count). "Leaving" must NOT delete their row — that would erase
            // the ban and let them rejoin. So it's a no-op: the ban record stays in the
            // banned list and they still can't join.
            if (membership.IsBanned)
                return new ActionResponse { IsSuccess = true, Message = "You have left this community. Note: your ban is still in effect." };

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
                {
                    successor.Role = "owner";
                }
                else if (community != null)
                {
                    // The owner is the last active member — the community has no one
                    // left to run it, so delete it entirely instead of leaving an
                    // empty, ownerless community behind.
                    await CascadeDeleteCommunityAsync(communityId, community, ct);

                    try { await _context.SaveChangesAsync(ct); }
                    catch (DbUpdateException) { return new ActionResponse { IsSuccess = false, Message = "Failed to leave community." }; }

                    return new ActionResponse { IsSuccess = true, Message = "You left the community. As the last member, it was deleted." };
                }
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
                .Where(u => bannedByIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => u.UserName, ct);

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

            try
            {
                var slug = community?.Slug ?? string.Empty;
                await _notificationActions.CreateAndSendAsync(
                    targetUserId,
                    NotificationType.Kicked,
                    $"You were removed from c/{slug} by a moderator.",
                    requestingUserId,
                    null,
                    null,
                    slug,
                    null,
                    ct);
            }
            catch { }

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

            // Unban removes the membership/ban record entirely, leaving the user a clean
            // non-member. They are NOT auto-added back — they must rejoin themselves
            // (which is what bumps the member count again).
            _context.CommunityMembers.Remove(target);
            AddModLog(communityId, "unban", requestingUserId, targetUserId);

            try { await _context.SaveChangesAsync(ct); }
            catch (DbUpdateException) { return new ActionResponse { IsSuccess = false, Message = "Failed to unban member." }; }

            return new ActionResponse { IsSuccess = true, Message = "Member unbanned. They can now rejoin the community." };
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
                .Where(m => m.UserId == userId && !m.IsBanned)
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
