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
        private const int DefaultPageSize = 15;
        private const int MaxPageSize = 50;

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

        private static (int Page, int PageSize) NormalizePagination(int page, int pageSize)
        {
            var normalizedPage = page < 1 ? 1 : page;
            var normalizedPageSize = pageSize < 1 ? DefaultPageSize : Math.Min(pageSize, MaxPageSize);
            return (normalizedPage, normalizedPageSize);
        }

        private static IQueryable<PostData> ApplySort(IQueryable<PostData> query, string? sortBy)
        {
            return sortBy?.ToLower() switch
            {
                "new" => query.OrderByDescending(p => p.CreatedAt).ThenByDescending(p => p.Id),
                "top" => query.OrderByDescending(p => p.Votes).ThenByDescending(p => p.CreatedAt).ThenByDescending(p => p.Id),
                "mostcomments" => query.OrderByDescending(p => p.CommentsCount).ThenByDescending(p => p.CreatedAt).ThenByDescending(p => p.Id),
                _ => query.OrderByDescending(p => p.Votes).ThenByDescending(p => p.CreatedAt).ThenByDescending(p => p.Id)
            };
        }

        public async Task<PostResponseDto?> GetPostByIdAsync(int postId, CancellationToken ct = default)
        {
            var post = await _context.Posts
                .Include(p => p.Author)
                .Include(p => p.Community)
                .FirstOrDefaultAsync(p => p.Id == postId, ct);

            if (post == null) return null;

            return MapToDto(post);
        }

        public async Task<PostBatchResponseDto> GetAllPostsAsync(string? sortBy = null, int page = 1, int pageSize = 15, CancellationToken ct = default)
        {
            var (normalizedPage, normalizedPageSize) = NormalizePagination(page, pageSize);
            var skip = (normalizedPage - 1) * normalizedPageSize;

            var query = _context.Posts
                .AsNoTracking()
                .Include(p => p.Author)
                .Include(p => p.Community)
                .AsQueryable();

            query = ApplySort(query, sortBy);

            var batch = await query
                .Skip(skip)
                .Take(normalizedPageSize + 1)
                .ToListAsync(ct);

            var hasMore = batch.Count > normalizedPageSize;
            var items = hasMore ? batch.Take(normalizedPageSize).ToList() : batch;

            return new PostBatchResponseDto
            {
                Items = items.Select(MapToDto).ToList().AsReadOnly(),
                Page = normalizedPage,
                PageSize = normalizedPageSize,
                HasMore = hasMore
            };
        }

        public async Task<PostBatchResponseDto> GetPostsByCommunityAsync(int communityId, string? sortBy = null, int page = 1, int pageSize = 15, CancellationToken ct = default)
        {
            var communityExists = await _context.Communities
                .AnyAsync(c => c.Id == communityId, ct);

            if (!communityExists)
            {
                return new PostBatchResponseDto
                {
                    Items = Array.Empty<PostResponseDto>(),
                    Page = page < 1 ? 1 : page,
                    PageSize = pageSize < 1 ? DefaultPageSize : Math.Min(pageSize, MaxPageSize),
                    HasMore = false
                };
            }

            var (normalizedPage, normalizedPageSize) = NormalizePagination(page, pageSize);
            var skip = (normalizedPage - 1) * normalizedPageSize;

            var query = _context.Posts
                .AsNoTracking()
                .Include(p => p.Author)
                .Include(p => p.Community)
                .Where(p => p.CommunityId == communityId)
                .AsQueryable();

            query = ApplySort(query, sortBy);

            var batch = await query
                .Skip(skip)
                .Take(normalizedPageSize + 1)
                .ToListAsync(ct);

            var hasMore = batch.Count > normalizedPageSize;
            var items = hasMore ? batch.Take(normalizedPageSize).ToList() : batch;

            return new PostBatchResponseDto
            {
                Items = items.Select(MapToDto).ToList().AsReadOnly(),
                Page = normalizedPage,
                PageSize = normalizedPageSize,
                HasMore = hasMore
            };
        }

        public async Task<PostBatchResponseDto> GetPostsByUserAsync(int userId, int page = 1, int pageSize = 15, CancellationToken ct = default)
        {
            var (normalizedPage, normalizedPageSize) = NormalizePagination(page, pageSize);
            var skip = (normalizedPage - 1) * normalizedPageSize;

            var batch = await _context.Posts
                .AsNoTracking()
                .Include(p => p.Author)
                .Include(p => p.Community)
                .Where(p => p.AuthorId == userId)
                .OrderByDescending(p => p.CreatedAt)
                .ThenByDescending(p => p.Id)
                .Skip(skip)
                .Take(normalizedPageSize + 1)
                .ToListAsync(ct);

            var hasMore = batch.Count > normalizedPageSize;
            var items = hasMore ? batch.Take(normalizedPageSize).ToList() : batch;

            return new PostBatchResponseDto
            {
                Items = items.Select(MapToDto).ToList().AsReadOnly(),
                Page = normalizedPage,
                PageSize = normalizedPageSize,
                HasMore = hasMore
            };
        }

        public async Task<PostResponseDto?> CreatePostAsync(PostCreateDto postData, int authorId, CancellationToken ct = default)
        {
            var communityExists = await _context.Communities
                .AnyAsync(c => c.Id == postData.CommunityId, ct);

            if (!communityExists) return null;

            var isAuthorCommunityMember = await _context.CommunityMembers
                .AnyAsync(m => m.CommunityId == postData.CommunityId && m.UserId == authorId, ct);

            if (!isAuthorCommunityMember) return null;

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

        public async Task<IReadOnlyList<PostResponseDto>> SearchPostsAsync(string term, int limit, CancellationToken ct = default)
        {
            var lowerTerm = term.ToLower();
            var posts = await _context.Posts
                .AsNoTracking()
                .Include(p => p.Author)
                .Include(p => p.Community)
                .Where(p => p.Title.ToLower().Contains(lowerTerm))
                .OrderByDescending(p => p.Votes)
                .ThenByDescending(p => p.CreatedAt)
                .Take(limit)
                .ToListAsync(ct);

            return posts.Select(MapToDto).ToList().AsReadOnly();
        }

        public async Task<ActionResponse> DeletePostAsync(int postId, int requestingUserId, CancellationToken ct = default)
        {
            var post = await _context.Posts
                .FirstOrDefaultAsync(p => p.Id == postId, ct);

            if (post == null)
                return new ActionResponse { IsSuccess = false, Message = "Post not found." };

            if (post.AuthorId != requestingUserId)
            {
                var ownerUserId = await _context.CommunityMembers
                    .Where(m => m.CommunityId == post.CommunityId)
                    .OrderBy(m => m.JoinedAt)
                    .ThenBy(m => m.Id)
                    .Select(m => (int?)m.UserId)
                    .FirstOrDefaultAsync(ct);

                if (ownerUserId == null || ownerUserId != requestingUserId)
                    return new ActionResponse { IsSuccess = false, Message = "You do not have permission to delete this post." };
            }

            // Remove all dependent records before deleting the post
            var savedItems = await _context.SavedItems.Where(s => s.PostId == postId).ToListAsync(ct);
            _context.SavedItems.RemoveRange(savedItems);

            var votes = await _context.Votes.Where(v => v.PostId == postId).ToListAsync(ct);
            _context.Votes.RemoveRange(votes);

            var comments = await _context.Comments.Where(c => c.PostId == postId).ToListAsync(ct);
            _context.Comments.RemoveRange(comments);

            var reports = await _context.Reports
                .Where(r => r.ReportedItemId == postId && r.Type == Domain.Entities.Report.ReportType.Post)
                .ToListAsync(ct);
            _context.Reports.RemoveRange(reports);

            var notifications = await _context.Notifications.Where(n => n.PostId == postId).ToListAsync(ct);
            _context.Notifications.RemoveRange(notifications);

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
