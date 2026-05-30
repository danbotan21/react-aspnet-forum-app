using ForumApp.Domain.Entities.Notification;
using ForumApp.Domain.Models.Notification;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Interfaces
{
    public interface INotificationActions
    {
        Task<IReadOnlyList<NotificationResponseDto>> GetUserNotificationsAsync(int userId, CancellationToken ct = default);
        Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default);
        Task<ActionResponse> MarkAsReadAsync(int notificationId, int userId, CancellationToken ct = default);
        Task<ActionResponse> MarkAllAsReadAsync(int userId, CancellationToken ct = default);
        Task<ActionResponse> DeleteNotificationAsync(int notificationId, int userId, CancellationToken ct = default);
        Task CreateAndSendAsync(
            int recipientId,
            NotificationType type,
            string message,
            int? actorId = null,
            int? postId = null,
            int? commentId = null,
            string? communitySlug = null,
            string? postTitle = null,
            CancellationToken ct = default);
    }
}
