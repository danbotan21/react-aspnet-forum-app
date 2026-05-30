using ForumApp.BusinessLayer.Core;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Models.Post;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Structure
{
    public class PostActionExecution : PostActions, IPostAction
    {
        public PostActionExecution(ForumDbContext context, INotificationAction notificationActions)
            : base(context, notificationActions) { }

        public Task<PostResponseDto?> GetPostByIdAsync(int postId, int? requestingUserId = null, CancellationToken ct = default)
            => GetPostByIdExecution(postId, requestingUserId, ct);

        public Task<PostBatchResponseDto> GetAllPostsAsync(string? sortBy = null, int page = 1, int pageSize = 15, bool excludePrivateCommunities = false, int? requestingUserId = null, CancellationToken ct = default)
            => GetAllPostsExecution(sortBy, page, pageSize, excludePrivateCommunities, requestingUserId, ct);

        public Task<PostBatchResponseDto> GetPostsByCommunityAsync(int communityId, string? sortBy = null, int page = 1, int pageSize = 15, int? requestingUserId = null, CancellationToken ct = default)
            => GetPostsByCommunityExecution(communityId, sortBy, page, pageSize, requestingUserId, ct);

        public Task<PostBatchResponseDto> GetPostsByUserAsync(int userId, int page = 1, int pageSize = 15, CancellationToken ct = default)
            => GetPostsByUserExecution(userId, page, pageSize, ct);

        public Task<PostResponseDto?> CreatePostAsync(PostCreateDto postData, int authorId, CancellationToken ct = default)
            => CreatePostExecution(postData, authorId, ct);

        public Task<PostResponseDto?> UpdatePostAsync(int postId, PostUpdateDto postData, int requestingUserId, CancellationToken ct = default)
            => UpdatePostExecution(postId, postData, requestingUserId, ct);

        public Task<IReadOnlyList<PostResponseDto>> SearchPostsAsync(string term, int limit, CancellationToken ct = default)
            => SearchPostsExecution(term, limit, ct);

        public Task<ActionResponse> DeletePostAsync(int postId, int requestingUserId, bool isPrivileged = false, CancellationToken ct = default)
            => DeletePostExecution(postId, requestingUserId, isPrivileged, ct);

        public Task<ActionResponse> PinPostAsync(int postId, int communityId, int requestingUserId, CancellationToken ct = default)
            => PinPostExecution(postId, communityId, requestingUserId, ct);

        public Task<ActionResponse> UnpinPostAsync(int postId, int communityId, int requestingUserId, CancellationToken ct = default)
            => UnpinPostExecution(postId, communityId, requestingUserId, ct);

        public Task<PostBatchResponseDto> GetPinnedPostsAsync(int communityId, CancellationToken ct = default)
            => GetPinnedPostsExecution(communityId, ct);
    }
}
