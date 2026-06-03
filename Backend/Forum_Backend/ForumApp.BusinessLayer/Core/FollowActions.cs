using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Entities.Follow;
using ForumApp.Domain.Entities.Notification;
using ForumApp.Domain.Models.Follow;
using ForumApp.Domain.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Core
{
    public class FollowActions
    {
        protected readonly ForumDbContext _context;
        protected readonly INotificationAction _notifications;

        public FollowActions(ForumDbContext context, INotificationAction notifications)
        {
            _context = context;
            _notifications = notifications;
        }

        internal async Task<ActionResponse> FollowExecution(int followerId, int targetUserId, CancellationToken ct = default)
        {
            if (followerId == targetUserId)
                return new ActionResponse { IsSuccess = false, Message = "You cannot follow yourself." };

            var target = await _context.Users.FirstOrDefaultAsync(u => u.Id == targetUserId, ct);
            if (target == null)
                return new ActionResponse { IsSuccess = false, Message = "User not found." };

            var already = await _context.Follows
                .AnyAsync(f => f.FollowerId == followerId && f.FollowingId == targetUserId, ct);
            if (already)
                return new ActionResponse { IsSuccess = true, Message = "Already following." };

            _context.Follows.Add(new FollowData
            {
                FollowerId = followerId,
                FollowingId = targetUserId,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync(ct);

            // Notify the followed user so they can follow back.
            var followerName = await _context.Users
                .Where(u => u.Id == followerId)
                .Select(u => u.UserName)
                .FirstOrDefaultAsync(ct);

            await _notifications.CreateAndSendAsync(
                recipientId: targetUserId,
                type: NotificationType.NewFollower,
                message: $"u/{followerName} started following you.",
                actorId: followerId,
                ct: ct);

            return new ActionResponse { IsSuccess = true, Message = "Followed." };
        }

        internal async Task<ActionResponse> UnfollowExecution(int followerId, int targetUserId, CancellationToken ct = default)
        {
            var follow = await _context.Follows
                .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowingId == targetUserId, ct);
            if (follow == null)
                return new ActionResponse { IsSuccess = true, Message = "Not following." };

            _context.Follows.Remove(follow);
            await _context.SaveChangesAsync(ct);
            return new ActionResponse { IsSuccess = true, Message = "Unfollowed." };
        }

        internal async Task<FollowStatusDto> GetStatusExecution(int viewerId, int targetUserId, CancellationToken ct = default)
        {
            return new FollowStatusDto
            {
                IsFollowing = await _context.Follows.AnyAsync(f => f.FollowerId == viewerId && f.FollowingId == targetUserId, ct),
                FollowsMe = await _context.Follows.AnyAsync(f => f.FollowerId == targetUserId && f.FollowingId == viewerId, ct),
                FollowersCount = await _context.Follows.CountAsync(f => f.FollowingId == targetUserId, ct),
                FollowingCount = await _context.Follows.CountAsync(f => f.FollowerId == targetUserId, ct)
            };
        }

        internal async Task<IReadOnlyList<FollowUserDto>> GetFollowersExecution(int targetUserId, int viewerId, CancellationToken ct = default)
        {
            var ids = await _context.Follows
                .Where(f => f.FollowingId == targetUserId)
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => f.FollowerId)
                .ToListAsync(ct);

            return await BuildUserListAsync(ids, viewerId, ct);
        }

        internal async Task<IReadOnlyList<FollowUserDto>> GetFollowingExecution(int targetUserId, int viewerId, CancellationToken ct = default)
        {
            var ids = await _context.Follows
                .Where(f => f.FollowerId == targetUserId)
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => f.FollowingId)
                .ToListAsync(ct);

            return await BuildUserListAsync(ids, viewerId, ct);
        }

        // Loads user rows for `ids`, marks which ones the viewer already follows, preserves order.
        private async Task<IReadOnlyList<FollowUserDto>> BuildUserListAsync(List<int> ids, int viewerId, CancellationToken ct)
        {
            if (ids.Count == 0)
                return new List<FollowUserDto>();

            var now = DateTime.UtcNow;

            var users = await _context.Users
                .Where(u => ids.Contains(u.Id))
                .Select(u => new
                {
                    u.Id,
                    u.UserName,
                    u.AvatarUrl,
                    u.Bio,
                    IsPremium = u.PremiumUntil.HasValue && u.PremiumUntil.Value > now
                })
                .ToListAsync(ct);

            var viewerFollowing = await _context.Follows
                .Where(f => f.FollowerId == viewerId && ids.Contains(f.FollowingId))
                .Select(f => f.FollowingId)
                .ToListAsync(ct);
            var followingSet = viewerFollowing.ToHashSet();

            var byId = users.ToDictionary(u => u.Id);

            return ids
                .Where(id => byId.ContainsKey(id))
                .Select(id =>
                {
                    var u = byId[id];
                    return new FollowUserDto
                    {
                        Id = u.Id,
                        UserName = u.UserName,
                        AvatarUrl = u.AvatarUrl,
                        Bio = u.Bio,
                        IsPremium = u.IsPremium,
                        IsFollowedByMe = followingSet.Contains(u.Id)
                    };
                })
                .ToList();
        }
    }
}
