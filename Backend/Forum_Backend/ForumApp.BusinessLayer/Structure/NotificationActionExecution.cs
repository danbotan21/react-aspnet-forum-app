using ForumApp.BusinessLayer.Core;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Entities.Notification;
using ForumApp.Domain.Models.Notification;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Structure
{
    public class NotificationActionExecution : NotificationActions, INotificationAction
    {
        public NotificationActionExecution(ForumDbContext context, IHubNotifierAction hubNotifier)
            : base(context, hubNotifier) { }

        public Task<IReadOnlyList<NotificationResponseDto>> GetUserNotificationsAsync(int userId, CancellationToken ct = default)
            => GetUserNotificationsExecution(userId, ct);

        public Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default)
            => GetUnreadCountExecution(userId, ct);

        public Task<ActionResponse> MarkAsReadAsync(int notificationId, int userId, CancellationToken ct = default)
            => MarkAsReadExecution(notificationId, userId, ct);

        public Task<ActionResponse> MarkAllAsReadAsync(int userId, CancellationToken ct = default)
            => MarkAllAsReadExecution(userId, ct);

        public Task<ActionResponse> DeleteNotificationAsync(int notificationId, int userId, CancellationToken ct = default)
            => DeleteNotificationExecution(notificationId, userId, ct);

        public Task CreateAndSendAsync(int recipientId, NotificationType type, string message, int? actorId = null, int? postId = null, int? commentId = null, string? communitySlug = null, string? postTitle = null, CancellationToken ct = default)
            => CreateAndSendExecution(recipientId, type, message, actorId, postId, commentId, communitySlug, postTitle, ct);
    }
}
