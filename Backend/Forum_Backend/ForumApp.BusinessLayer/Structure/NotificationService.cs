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

        // Constructor - Dependency Injection pentru DbContext
        public NotificationService(ForumDbContext context)
        {
            _context = context;
        }

        // Obține toate notificările unui utilizator (ordonate descrescător după dată)
        public async Task<IReadOnlyList<NotificationResponseDto>> GetUserNotificationsAsync(int userId, CancellationToken ct = default)
        {
            try
            {
                var notifications = await _context.Notifications
                    .Where(n => n.RecipientId == userId)
                    .OrderByDescending(n => n.CreatedAt)
                    .Select(n => new NotificationResponseDto
                    {
                        Id = n.Id,
                        Message = n.Message,
                        CreatedAt = n.CreatedAt,
                        IsRead = n.IsRead
                    })
                    .ToListAsync(ct);

                return notifications;
            }
            catch (Exception ex)
            {
                // Logging în producție: log.Error(ex, "Failed to get notifications for user {UserId}", userId);
                throw new Exception($"Failed to retrieve notifications for user {userId}", ex);
            }
        }

        // Marchează o notificare ca fiind citită
        public async Task<ActionResponse> MarkAsReadAsync(int notificationId, int userId, CancellationToken ct = default)
        {
            try
            {
                var notification = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.Id == notificationId && n.RecipientId == userId, ct);

                if (notification == null)
                {
                    return new ActionResponse
                    {
                        IsSuccess = false,
                        Message = "Notification not found or you don't have permission to access it."
                    };
                }

                // Verifică dacă e deja citită (optional - evită update-uri inutile)
                if (notification.IsRead)
                {
                    return new ActionResponse
                    {
                        IsSuccess = true,
                        Message = "Notification was already marked as read."
                    };
                }

                notification.IsRead = true;
                await _context.SaveChangesAsync(ct);

                return new ActionResponse
                {
                    IsSuccess = true,
                    Message = "Notification marked as read successfully."
                };
            }
            catch (Exception ex)
            {
                // Logging în producție
                return new ActionResponse
                {
                    IsSuccess = false,
                    Message = $"Failed to mark notification as read: {ex.Message}"
                };
            }
        }

        // Șterge o notificare (doar dacă aparține utilizatorului)
        public async Task<ActionResponse> DeleteNotificationAsync(int notificationId, int userId, CancellationToken ct = default)
        {
            try
            {
                var notification = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.Id == notificationId && n.RecipientId == userId, ct);

                if (notification == null)
                {
                    return new ActionResponse
                    {
                        IsSuccess = false,
                        Message = "Notification not found or you don't have permission to delete it."
                    };
                }

                _context.Notifications.Remove(notification);
                await _context.SaveChangesAsync(ct);

                return new ActionResponse
                {
                    IsSuccess = true,
                    Message = "Notification deleted successfully."
                };
            }
            catch (Exception ex)
            {
                // Logging în producție
                return new ActionResponse
                {
                    IsSuccess = false,
                    Message = $"Failed to delete notification: {ex.Message}"
                };
            }
        }
    }
}