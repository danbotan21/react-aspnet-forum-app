using ForumApp.Domain.Models.Notification;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Interfaces
{
    public interface INotificationActions
    {
        Task<IReadOnlyList<NotificationData>> GetUserNotificationsAsync(int userId, CancellationToken ct = default);
        Task<ActionResponse> MarkAsReadAsync(int notificationId, int userId, CancellationToken ct = default);
        Task<ActionResponse> DeleteNotificationAsync(int notificationId, int userId, CancellationToken ct = default);
    }
}