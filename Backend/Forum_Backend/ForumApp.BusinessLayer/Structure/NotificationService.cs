using ForumApp.DataAccess;
using ForumApp.Domain.Entities.Notification;
using ForumApp.Domain.Models.Notification;
using ForumApp.Domain.Models.Responses;
using ForumApp.BusinessLayer.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Structure
{
    public class NotificationService : INotificationActions
    {
        private readonly ForumDbContext _context;
        private readonly IHubNotifier _hubNotifier;

        public NotificationService(ForumDbContext context, IHubNotifier hubNotifier)
        {
            _context = context;
            _hubNotifier = hubNotifier;
        }

        public async Task<IReadOnlyList<NotificationResponseDto>> GetUserNotificationsAsync(int userId, CancellationToken ct = default)
        {
            var notifications = await _context.Notifications
                .Include(n => n.Actor)
                .Include(n => n.Post).ThenInclude(p => p!.Community)
                .Where(n => n.RecipientId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync(ct);

            return notifications.Select(MapToDto).ToList().AsReadOnly();
        }

        public async Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default)
        {
            return await _context.Notifications
                .CountAsync(n => n.RecipientId == userId && !n.IsRead, ct);
        }

        public async Task<ActionResponse> MarkAsReadAsync(int notificationId, int userId, CancellationToken ct = default)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.RecipientId == userId, ct);

            if (notification == null)
                return new ActionResponse { IsSuccess = false, Message = "Notification not found." };

            if (!notification.IsRead)
            {
                notification.IsRead = true;
                await _context.SaveChangesAsync(ct);
            }

            return new ActionResponse { IsSuccess = true, Message = "Marked as read." };
        }

        public async Task<ActionResponse> MarkAllAsReadAsync(int userId, CancellationToken ct = default)
        {
            await _context.Notifications
                .Where(n => n.RecipientId == userId && !n.IsRead)
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), ct);

            return new ActionResponse { IsSuccess = true, Message = "All notifications marked as read." };
        }

        public async Task<ActionResponse> DeleteNotificationAsync(int notificationId, int userId, CancellationToken ct = default)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.RecipientId == userId, ct);

            if (notification == null)
                return new ActionResponse { IsSuccess = false, Message = "Notification not found." };

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync(ct);

            return new ActionResponse { IsSuccess = true, Message = "Notification deleted." };
        }

        public async Task CreateAndSendAsync(
            int recipientId,
            NotificationType type,
            string message,
            int? actorId = null,
            int? postId = null,
            int? commentId = null,
            string? communitySlug = null,
            string? postTitle = null,
            CancellationToken ct = default)
        {
            var notification = new NotificationData
            {
                RecipientId = recipientId,
                Type = type,
                Message = message,
                ActorId = actorId,
                PostId = postId,
                CommentId = commentId,
                CommunitySlug = communitySlug,
                PostTitle = postTitle,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync(ct);

            string? actorUsername = null;
            string? actorAvatarUrl = null;
            if (actorId.HasValue)
            {
                var actor = await _context.Users
                    .Where(u => u.ID == actorId.Value)
                    .Select(u => new { u.UserName, u.AvatarUrl })
                    .FirstOrDefaultAsync(ct);
                actorUsername = actor?.UserName;
                actorAvatarUrl = actor?.AvatarUrl;
            }

            var dto = new NotificationResponseDto
            {
                Id = notification.Id,
                Message = notification.Message,
                Type = notification.Type.ToString(),
                CreatedAt = notification.CreatedAt,
                IsRead = false,
                ActorId = actorId,
                ActorUsername = actorUsername,
                ActorAvatarUrl = actorAvatarUrl,
                PostId = postId,
                CommentId = commentId,
                CommunitySlug = communitySlug,
                PostTitle = postTitle
            };

            try
            {
                await _hubNotifier.SendToUserAsync(recipientId, "ReceiveNotification", dto, ct);
            }
            catch
            {
                // Real-time delivery failure is non-critical; notification is already persisted
            }
        }

        private static NotificationResponseDto MapToDto(NotificationData n) => new NotificationResponseDto
        {
            Id = n.Id,
            Message = n.Message,
            Type = n.Type.ToString(),
            CreatedAt = n.CreatedAt,
            IsRead = n.IsRead,
            ActorId = n.ActorId,
            ActorUsername = n.Actor?.UserName,
            ActorAvatarUrl = n.Actor?.AvatarUrl,
            PostId = n.PostId,
            CommentId = n.CommentId,
            CommunitySlug = n.CommunitySlug ?? n.Post?.Community?.Slug,
            PostTitle = n.PostTitle ?? n.Post?.Title
        };
    }
}
