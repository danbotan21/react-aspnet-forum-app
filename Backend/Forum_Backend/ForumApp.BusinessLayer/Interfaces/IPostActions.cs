using ForumApp.Domain.Models.Post;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Interfaces
{
    public interface IPostActions
    {
        Task<PostResponseDto?> CreatePostAsync(PostCreateDto postData, int authorId, CancellationToken ct = default);
        Task<PostResponseDto?> GetPostByIdAsync(int postId, CancellationToken ct = default);
        Task<PostBatchResponseDto> GetAllPostsAsync(string? sortBy = null, int page = 1, int pageSize = 15, CancellationToken ct = default);
        Task<PostBatchResponseDto> GetPostsByCommunityAsync(int communityId, string? sortBy = null, int page = 1, int pageSize = 15, CancellationToken ct = default);
        Task<PostBatchResponseDto> GetPostsByUserAsync(int userId, int page = 1, int pageSize = 15, CancellationToken ct = default);
        Task<PostResponseDto?> UpdatePostAsync(int postId, PostUpdateDto postData, int requestingUserId, CancellationToken ct = default);
        Task<ActionResponse> DeletePostAsync(int postId, int requestingUserId, CancellationToken ct = default);
        Task<IReadOnlyList<PostResponseDto>> SearchPostsAsync(string term, int limit, CancellationToken ct = default);
    }
}
