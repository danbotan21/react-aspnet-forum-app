using ForumApp.Domain.Models.Post;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Interfaces
{
    public interface IPostActions
    {
        Task<PostResponseDto?> CreatePostAsync(PostCreateDto postData, int authorId, CancellationToken ct = default);
        Task<PostResponseDto?> GetPostByIdAsync(int postId, CancellationToken ct = default);
        Task<IReadOnlyList<PostResponseDto>> GetAllPostsAsync(string? sortBy = null, CancellationToken ct = default);
        Task<IReadOnlyList<PostResponseDto>> GetPostsByCommunityAsync(int communityId, string? sortBy = null, CancellationToken ct = default);
        Task<IReadOnlyList<PostResponseDto>> GetPostsByUserAsync(int userId, CancellationToken ct = default);
        Task<PostResponseDto?> UpdatePostAsync(int postId, PostUpdateDto postData, int requestingUserId, CancellationToken ct = default);
        Task<ActionResponse> DeletePostAsync(int postId, int requestingUserId, CancellationToken ct = default);
    }
}