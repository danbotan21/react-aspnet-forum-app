using ForumApp.Domain.Models.Comment;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Interfaces
{
    public interface ICommentActions
    {
        Task<CommentResponseDto?> CreateCommentAsync(CommentCreateDto commentData, int authorId, CancellationToken ct = default);
        Task<IReadOnlyList<CommentResponseDto>> GetCommentsByPostAsync(int postId, CancellationToken ct = default);
        Task<CommentResponseDto?> GetCommentByIdAsync(int commentId, CancellationToken ct = default);
        Task<CommentResponseDto?> UpdateCommentAsync(int commentId, CommentCreateDto commentData, int requestingUserId, CancellationToken ct = default);
        Task<ActionResponse> DeleteCommentAsync(int commentId, int requestingUserId, CancellationToken ct = default);
    }
}