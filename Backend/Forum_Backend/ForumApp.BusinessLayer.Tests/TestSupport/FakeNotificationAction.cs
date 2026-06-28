using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Entities.Notification;
using ForumApp.Domain.Models.Notification;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Tests.TestSupport;

public sealed class FakeNotificationAction : INotificationAction
{
    public List<NotificationCall> Sent { get; } = new();

    public Task<IReadOnlyList<NotificationResponseDto>> GetUserNotificationsAsync(int userId, CancellationToken ct = default)
        => Task.FromResult<IReadOnlyList<NotificationResponseDto>>(Array.Empty<NotificationResponseDto>());

    public Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default)
        => Task.FromResult(0);

    public Task<ActionResponse> MarkAsReadAsync(int notificationId, int userId, CancellationToken ct = default)
        => Task.FromResult(new ActionResponse { IsSuccess = true });

    public Task<ActionResponse> MarkAllAsReadAsync(int userId, CancellationToken ct = default)
        => Task.FromResult(new ActionResponse { IsSuccess = true });

    public Task<ActionResponse> DeleteNotificationAsync(int notificationId, int userId, CancellationToken ct = default)
        => Task.FromResult(new ActionResponse { IsSuccess = true });

    public Task CreateAndSendAsync(
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
        Sent.Add(new NotificationCall(recipientId, type, message, actorId, postId, commentId, communitySlug, postTitle));
        return Task.CompletedTask;
    }
}

public sealed record NotificationCall(
    int RecipientId,
    NotificationType Type,
    string Message,
    int? ActorId,
    int? PostId,
    int? CommentId,
    string? CommunitySlug,
    string? PostTitle);
