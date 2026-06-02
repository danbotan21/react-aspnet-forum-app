using ForumApp.Domain.Models.Comment;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Interfaces
{
    public interface ICommentAction
    {
        Task<CommentResponseDto?> CreateCommentAsync(CommentCreateDto commentData, int authorId, CancellationToken ct = default);
        Task<IReadOnlyList<CommentResponseDto>> GetCommentsByPostAsync(int postId, int? requestingUserId = null, CancellationToken ct = default);
        Task<IReadOnlyList<CommentResponseDto>> GetCommentsByUserAsync(int userId, int? viewerId = null, CancellationToken ct = default);
        Task<CommentResponseDto?> GetCommentByIdAsync(int commentId, int? viewerId = null, CancellationToken ct = default);
        Task<CommentResponseDto?> UpdateCommentAsync(int commentId, CommentCreateDto commentData, int requestingUserId, CancellationToken ct = default);
        Task<ActionResponse> DeleteCommentAsync(int commentId, int requestingUserId, bool isPrivileged = false, CancellationToken ct = default);

    }
}