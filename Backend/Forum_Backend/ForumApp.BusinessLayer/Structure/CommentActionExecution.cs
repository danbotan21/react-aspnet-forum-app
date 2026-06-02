using ForumApp.BusinessLayer.Core;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Models.Comment;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Structure
{
    public class CommentActionExecution : CommentActions, ICommentAction
    {
        public CommentActionExecution(ForumDbContext context, INotificationAction notificationActions)
            : base(context, notificationActions) { }

        public Task<CommentResponseDto?> GetCommentByIdAsync(int commentId, int? viewerId = null, CancellationToken ct = default)
            => GetCommentByIdExecution(commentId, viewerId, ct);

        public Task<IReadOnlyList<CommentResponseDto>> GetCommentsByPostAsync(int postId, int? requestingUserId = null, CancellationToken ct = default)
            => GetCommentsByPostExecution(postId, requestingUserId, ct);

        public Task<IReadOnlyList<CommentResponseDto>> GetCommentsByUserAsync(int userId, int? viewerId = null, CancellationToken ct = default)
            => GetCommentsByUserExecution(userId, viewerId, ct);

        public Task<CommentResponseDto?> CreateCommentAsync(CommentCreateDto commentData, int authorId, CancellationToken ct = default)
            => CreateCommentExecution(commentData, authorId, ct);

        public Task<CommentResponseDto?> UpdateCommentAsync(int commentId, CommentCreateDto commentData, int requestingUserId, CancellationToken ct = default)
            => UpdateCommentExecution(commentId, commentData, requestingUserId, ct);

        public Task<ActionResponse> DeleteCommentAsync(int commentId, int requestingUserId, bool isPrivileged = false, CancellationToken ct = default)
            => DeleteCommentExecution(commentId, requestingUserId, isPrivileged, ct);
    }
}
