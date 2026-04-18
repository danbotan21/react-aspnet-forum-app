using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Entities.Post;
using ForumApp.Domain.Models.Post;
using ForumApp.Domain.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Structure
{
    public class PostService : IPostActions
    {
        private readonly ForumDbContext _context;

        public PostService(ForumDbContext context)
        {
            _context = context;
        }

        private static PostResponseDto MapToDto(PostData post) => new PostResponseDto
        {
            Id = post.Id,
            Title = post.Title,
            Body = post.Body,
            ImageUrl = post.ImageUrl,
            LinkUrl = post.LinkUrl,
            Type = post.Type,
            Votes = post.Votes,
            CommentsCount = post.CommentsCount,
            CreatedAt = post.CreatedAt,
            AuthorName = post.Author.UserName,
            CommunitySlug = post.Community.Slug
        };

        public async Task<PostResponseDto?> GetPostByIdAsync(int postId, CancellationToken ct = default)
        {
            var post = await _context.Posts
                .Include(p => p.Author)
                .Include(p => p.Community)
                .FirstOrDefaultAsync(p => p.Id == postId, ct);

            if (post == null) return null;

            return MapToDto(post);
        }

        public async Task<IReadOnlyList<PostResponseDto>> GetAllPostsAsync(string? sortBy = null, CancellationToken ct = default)
        {
            var query = _context.Posts
                .Include(p => p.Author)
                .Include(p => p.Community)
                .AsQueryable();

            query = sortBy?.ToLower() switch
            {
                "new" => query.OrderByDescending(p => p.CreatedAt),
                "top" => query.OrderByDescending(p => p.Votes),
                _ => query.OrderByDescending(p => p.Votes).ThenByDescending(p => p.CreatedAt)
            };

            var posts = await query.ToListAsync(ct);
            return posts.Select(MapToDto).ToList().AsReadOnly();
        }

        public async Task<IReadOnlyList<PostResponseDto>> GetPostsByCommunityAsync(int communityId, string? sortBy = null, CancellationToken ct = default)
        {
            var communityExists = await _context.Communities
                .AnyAsync(c => c.Id == communityId, ct);

            if (!communityExists) return Array.Empty<PostResponseDto>();

            var query = _context.Posts
                .Include(p => p.Author)
                .Include(p => p.Community)
                .Where(p => p.CommunityId == communityId)
                .AsQueryable();

            query = sortBy?.ToLower() switch
            {
                "new" => query.OrderByDescending(p => p.CreatedAt),
                "top" => query.OrderByDescending(p => p.Votes),
                _ => query.OrderByDescending(p => p.Votes).ThenByDescending(p => p.CreatedAt)
            };

            var posts = await query.ToListAsync(ct);
            return posts.Select(MapToDto).ToList().AsReadOnly();
        }

        public async Task<IReadOnlyList<PostResponseDto>> GetPostsByUserAsync(int userId, CancellationToken ct = default)
        {
            var posts = await _context.Posts
                .Include(p => p.Author)
                .Include(p => p.Community)
                .Where(p => p.AuthorId == userId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync(ct);

            return posts.Select(MapToDto).ToList().AsReadOnly();
        }

        public async Task<PostResponseDto?> CreatePostAsync(PostCreateDto postData, int authorId, CancellationToken ct = default)
        {
            var communityExists = await _context.Communities
                .AnyAsync(c => c.Id == postData.CommunityId, ct);

            if (!communityExists) return null;

            var post = new PostData
            {
                Title = postData.Title,
                Body = postData.Body,
                ImageUrl = postData.ImageUrl,
                LinkUrl = postData.LinkUrl,
                Type = postData.Type,
                CommunityId = postData.CommunityId,
                AuthorId = authorId,
                CreatedAt = DateTime.UtcNow,
                Votes = 0,
                CommentsCount = 0
            };

            _context.Posts.Add(post);

            try
            {
                await _context.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                return null;
            }

            await _context.Entry(post).Reference(p => p.Author).LoadAsync(ct);
            await _context.Entry(post).Reference(p => p.Community).LoadAsync(ct);

            return MapToDto(post);
        }

        public async Task<PostResponseDto?> UpdatePostAsync(int postId, PostUpdateDto postData, int requestingUserId, CancellationToken ct = default)
        {
            var post = await _context.Posts
                .Include(p => p.Author)
                .Include(p => p.Community)
                .FirstOrDefaultAsync(p => p.Id == postId, ct);

            if (post == null) return null;

            if (post.AuthorId != requestingUserId) return null;

            post.Title = postData.Title;
            post.Body = postData.Body;
            post.ImageUrl = postData.ImageUrl;
            post.LinkUrl = postData.LinkUrl;

            try
            {
                await _context.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                return null;
            }

            return MapToDto(post);
        }

        public async Task<ActionResponse> DeletePostAsync(int postId, int requestingUserId, CancellationToken ct = default)
        {
            var post = await _context.Posts
                .FirstOrDefaultAsync(p => p.Id == postId, ct);

            if (post == null)
                return new ActionResponse { IsSuccess = false, Message = "Post not found." };

            if (post.AuthorId != requestingUserId)
                return new ActionResponse { IsSuccess = false, Message = "You are not the author of this post." };

            _context.Posts.Remove(post);

            try
            {
                await _context.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                return new ActionResponse { IsSuccess = false, Message = "Failed to delete post." };
            }

            return new ActionResponse { IsSuccess = true, Message = "Post deleted successfully." };
        }
    }
}
