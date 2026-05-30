using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Entities.ModLog;
using ForumApp.Domain.Entities.Notification;
using ForumApp.Domain.Entities.Post;
using ForumApp.Domain.Models.Post;
using ForumApp.Domain.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Core
{
    public class PostActions
    {
        protected readonly ForumDbContext _context;
        protected readonly INotificationAction _notificationActions;
        private const int DefaultPageSize = 15;
        private const int MaxPageSize = 50;

        public PostActions(ForumDbContext context, INotificationAction notificationActions)
        {
            _context = context;
            _notificationActions = notificationActions;
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
            IsPinned = post.IsPinned,
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

        private static IQueryable<PostData> ApplyPinnedFirstSort(IQueryable<PostData> query, string? sortBy)
        {
            return sortBy?.ToLower() switch
            {
                "new" => query.OrderByDescending(p => p.IsPinned).ThenByDescending(p => p.CreatedAt).ThenByDescending(p => p.Id),
                "top" => query.OrderByDescending(p => p.IsPinned).ThenByDescending(p => p.Votes).ThenByDescending(p => p.CreatedAt).ThenByDescending(p => p.Id),
                "mostcomments" => query.OrderByDescending(p => p.IsPinned).ThenByDescending(p => p.CommentsCount).ThenByDescending(p => p.CreatedAt).ThenByDescending(p => p.Id),
                _ => query.OrderByDescending(p => p.IsPinned).ThenByDescending(p => p.Votes).ThenByDescending(p => p.CreatedAt).ThenByDescending(p => p.Id)
            };
        }

        internal async Task<PostResponseDto?> GetPostByIdExecution(int postId, int? requestingUserId = null, CancellationToken ct = default)
        {
            var post = await _context.Posts
                .Include(p => p.Author)
                .Include(p => p.Community)
                .FirstOrDefaultAsync(p => p.Id == postId, ct);

            if (post == null) return null;

            if (post.Community.Type.ToLower() == "private")
            {
                if (!requestingUserId.HasValue) return null;
                var isMember = await _context.CommunityMembers
                    .AnyAsync(m => m.CommunityId == post.CommunityId
                                && m.UserId == requestingUserId.Value
                                && !m.IsBanned, ct);
                if (!isMember) return null;
            }

            return MapToDto(post);
        }

        internal async Task<PostBatchResponseDto> GetAllPostsExecution(string? sortBy = null, int page = 1, int pageSize = 15, bool excludePrivateCommunities = false, int? requestingUserId = null, CancellationToken ct = default)
        {
            var (normalizedPage, normalizedPageSize) = NormalizePagination(page, pageSize);
            var skip = (normalizedPage - 1) * normalizedPageSize;

            var query = _context.Posts
                .AsNoTracking()
                .Include(p => p.Author)
                .Include(p => p.Community)
                .AsQueryable();

            if (excludePrivateCommunities)
            {
                if (requestingUserId.HasValue)
                {
                    var uid = requestingUserId.Value;
                    query = query.Where(p =>
                        !_context.CommunityMembers.Any(m =>
                            m.CommunityId == p.CommunityId &&
                            m.UserId == uid &&
                            m.IsBanned) &&
                        (p.Community.Type.ToLower() != "private" ||
                         _context.CommunityMembers.Any(m =>
                             m.CommunityId == p.CommunityId &&
                             m.UserId == uid &&
                             !m.IsBanned)));
                }
                else
                {
                    query = query.Where(p => p.Community.Type.ToLower() != "private");
                }
            }

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

        internal async Task<PostBatchResponseDto> GetPostsByCommunityExecution(int communityId, string? sortBy = null, int page = 1, int pageSize = 15, int? requestingUserId = null, CancellationToken ct = default)
        {
            var community = await _context.Communities
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == communityId, ct);

            if (community == null)
            {
                return new PostBatchResponseDto
                {
                    Items = Array.Empty<PostResponseDto>(),
                    Page = page < 1 ? 1 : page,
                    PageSize = pageSize < 1 ? DefaultPageSize : Math.Min(pageSize, MaxPageSize),
                    HasMore = false
                };
            }

            if (community.Type.ToLower() == "private")
            {
                bool canAccess = false;
                if (requestingUserId.HasValue)
                {
                    canAccess = await _context.CommunityMembers
                        .AnyAsync(m => m.CommunityId == communityId
                                    && m.UserId == requestingUserId.Value
                                    && !m.IsBanned, ct);
                }

                if (!canAccess)
                {
                    return new PostBatchResponseDto
                    {
                        Items = Array.Empty<PostResponseDto>(),
                        Page = 1,
                        PageSize = 0,
                        HasMore = false
                    };
                }
            }

            if (requestingUserId.HasValue)
            {
                var isBanned = await _context.CommunityMembers
                    .AnyAsync(m => m.CommunityId == communityId
                                && m.UserId == requestingUserId.Value
                                && m.IsBanned, ct);

                if (isBanned)
                {
                    return new PostBatchResponseDto
                    {
                        Items = Array.Empty<PostResponseDto>(),
                        Page = 1,
                        PageSize = 0,
                        HasMore = false
                    };
                }
            }

            var (normalizedPage, normalizedPageSize) = NormalizePagination(page, pageSize);
            var skip = (normalizedPage - 1) * normalizedPageSize;

            var query = ApplyPinnedFirstSort(
                _context.Posts
                    .AsNoTracking()
                    .Include(p => p.Author)
                    .Include(p => p.Community)
                    .Where(p => p.CommunityId == communityId),
                sortBy);

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

        internal async Task<PostBatchResponseDto> GetPostsByUserExecution(int userId, int page = 1, int pageSize = 15, CancellationToken ct = default)
        {
            var (normalizedPage, normalizedPageSize) = NormalizePagination(page, pageSize);
            var skip = (normalizedPage - 1) * normalizedPageSize;

            var batch = await _context.Posts
                .AsNoTracking()
                .Include(p => p.Author)
                .Include(p => p.Community)
                .Where(p => p.AuthorId == userId && p.Community.Type.ToLower() != "private")
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

        internal async Task<PostResponseDto?> CreatePostExecution(PostCreateDto postData, int authorId, CancellationToken ct = default)
        {
            var community = await _context.Communities
                .Select(c => new { c.Id, c.Type })
                .FirstOrDefaultAsync(c => c.Id == postData.CommunityId, ct);

            if (community == null) return null;

            var membership = await _context.CommunityMembers
                .FirstOrDefaultAsync(m => m.CommunityId == postData.CommunityId && m.UserId == authorId, ct);

            if (membership == null || membership.IsBanned) return null;

            if (community.Type == "restricted" && membership.Role != "owner" && membership.Role != "moderator")
                return null;

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

        internal async Task<PostResponseDto?> UpdatePostExecution(int postId, PostUpdateDto postData, int requestingUserId, CancellationToken ct = default)
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

        internal async Task<IReadOnlyList<PostResponseDto>> SearchPostsExecution(string term, int limit, CancellationToken ct = default)
        {
            var lowerTerm = term.ToLower();
            var posts = await _context.Posts
                .AsNoTracking()
                .Include(p => p.Author)
                .Include(p => p.Community)
                .Where(p => p.Title.ToLower().Contains(lowerTerm)
                         && p.Community.Type.ToLower() != "private")
                .OrderByDescending(p => p.Votes)
                .ThenByDescending(p => p.CreatedAt)
                .Take(limit)
                .ToListAsync(ct);

            return posts.Select(MapToDto).ToList().AsReadOnly();
        }

        internal async Task<ActionResponse> DeletePostExecution(int postId, int requestingUserId, bool isPrivileged = false, CancellationToken ct = default)
        {
            var post = await _context.Posts
                .Include(p => p.Community)
                .FirstOrDefaultAsync(p => p.Id == postId, ct);

            if (post == null)
                return new ActionResponse { IsSuccess = false, Message = "Post not found." };

            bool isModDelete = false;
            int postAuthorId = post.AuthorId;
            string postTitle = post.Title;
            string? communitySlug = null;

            if (post.AuthorId != requestingUserId)
            {
                var isModOrOwner = isPrivileged || await _context.CommunityMembers
                    .AnyAsync(m => m.CommunityId == post.CommunityId
                                && m.UserId == requestingUserId
                                && (m.Role == "owner" || m.Role == "moderator")
                                && !m.IsBanned, ct)
                    || await IsGlobalAdminAsync(requestingUserId, ct);

                if (!isModOrOwner)
                    return new ActionResponse { IsSuccess = false, Message = "You do not have permission to delete this post." };

                isModDelete = true;
                communitySlug = post.Community?.Slug;
            }

            var savedItems = await _context.SavedItems.Where(s => s.PostId == postId).ToListAsync(ct);
            _context.SavedItems.RemoveRange(savedItems);

            var votes = await _context.Votes.Where(v => v.PostId == postId).ToListAsync(ct);
            _context.Votes.RemoveRange(votes);

            var commentIds = await _context.Comments
                .Where(c => c.PostId == postId)
                .Select(c => c.ID)
                .ToListAsync(ct);

            if (commentIds.Count > 0)
            {
                var commentNotifications = await _context.Notifications
                    .Where(n => n.CommentId != null && commentIds.Contains(n.CommentId!.Value))
                    .ToListAsync(ct);
                _context.Notifications.RemoveRange(commentNotifications);

                var comments = await _context.Comments.Where(c => c.PostId == postId).ToListAsync(ct);
                _context.Comments.RemoveRange(comments);
            }

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

            if (isModDelete)
            {
                try
                {
                    await _notificationActions.CreateAndSendAsync(
                        postAuthorId,
                        NotificationType.PostDeletedByMod,
                        "Your post was removed by a moderator.",
                        requestingUserId,
                        null,
                        null,
                        communitySlug,
                        postTitle,
                        ct);
                }
                catch { }
            }

            return new ActionResponse { IsSuccess = true, Message = "Post deleted successfully." };
        }

        // Global admins get owner-level moderation power in any community.
        private Task<bool> IsGlobalAdminAsync(int userId, CancellationToken ct = default)
            => _context.Users.AnyAsync(u => u.ID == userId && u.Role == "Admin", ct);

        internal async Task<ActionResponse> PinPostExecution(int postId, int communityId, int requestingUserId, CancellationToken ct = default)
        {
            var isMod = await _context.CommunityMembers
                .AnyAsync(m => m.CommunityId == communityId && m.UserId == requestingUserId
                               && (m.Role == "owner" || m.Role == "moderator") && !m.IsBanned, ct)
                || await IsGlobalAdminAsync(requestingUserId, ct);

            if (!isMod)
                return new ActionResponse { IsSuccess = false, Message = "You must be a moderator or owner to pin posts." };

            var post = await _context.Posts
                .FirstOrDefaultAsync(p => p.Id == postId && p.CommunityId == communityId, ct);

            if (post == null)
                return new ActionResponse { IsSuccess = false, Message = "Post not found in this community." };

            if (post.IsPinned)
                return new ActionResponse { IsSuccess = false, Message = "Post is already pinned." };

            var pinnedCount = await _context.Posts
                .CountAsync(p => p.CommunityId == communityId && p.IsPinned, ct);

            if (pinnedCount >= 3)
                return new ActionResponse { IsSuccess = false, Message = "Maximum 3 posts can be pinned at the same time." };

            post.IsPinned = true;
            _context.ModLogs.Add(new ModLogEntryData { CommunityId = communityId, ActionType = "pin", ActorId = requestingUserId, TargetPostId = postId, CreatedAt = DateTime.UtcNow });

            try { await _context.SaveChangesAsync(ct); }
            catch (DbUpdateException) { return new ActionResponse { IsSuccess = false, Message = "Failed to pin post." }; }

            return new ActionResponse { IsSuccess = true, Message = "Post pinned successfully." };
        }

        internal async Task<ActionResponse> UnpinPostExecution(int postId, int communityId, int requestingUserId, CancellationToken ct = default)
        {
            var isMod = await _context.CommunityMembers
                .AnyAsync(m => m.CommunityId == communityId && m.UserId == requestingUserId
                               && (m.Role == "owner" || m.Role == "moderator") && !m.IsBanned, ct)
                || await IsGlobalAdminAsync(requestingUserId, ct);

            if (!isMod)
                return new ActionResponse { IsSuccess = false, Message = "You must be a moderator or owner to unpin posts." };

            var post = await _context.Posts
                .FirstOrDefaultAsync(p => p.Id == postId && p.CommunityId == communityId, ct);

            if (post == null)
                return new ActionResponse { IsSuccess = false, Message = "Post not found in this community." };

            if (!post.IsPinned)
                return new ActionResponse { IsSuccess = false, Message = "Post is not currently pinned." };

            post.IsPinned = false;
            _context.ModLogs.Add(new ModLogEntryData { CommunityId = communityId, ActionType = "unpin", ActorId = requestingUserId, TargetPostId = postId, CreatedAt = DateTime.UtcNow });

            try { await _context.SaveChangesAsync(ct); }
            catch (DbUpdateException) { return new ActionResponse { IsSuccess = false, Message = "Failed to unpin post." }; }

            return new ActionResponse { IsSuccess = true, Message = "Post unpinned successfully." };
        }

        internal async Task<PostBatchResponseDto> GetPinnedPostsExecution(int communityId, CancellationToken ct = default)
        {
            var posts = await _context.Posts
                .AsNoTracking()
                .Include(p => p.Author)
                .Include(p => p.Community)
                .Where(p => p.CommunityId == communityId && p.IsPinned)
                .OrderByDescending(p => p.Votes)
                .ThenByDescending(p => p.CreatedAt)
                .ToListAsync(ct);

            return new PostBatchResponseDto
            {
                Items = posts.Select(MapToDto).ToList().AsReadOnly(),
                Page = 1,
                PageSize = posts.Count,
                HasMore = false
            };
        }
    }
}
