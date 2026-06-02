using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Entities.Comment;
using ForumApp.Domain.Entities.Notification;
using ForumApp.Domain.Models.Comment;
using ForumApp.Domain.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Core
{
    public class CommentActions : BaseActions
    {
        protected readonly INotificationAction _notificationActions;

        public CommentActions(ForumDbContext context, INotificationAction notificationActions) : base(context)
        {
            _notificationActions = notificationActions;
        }

        private static CommentResponseDto MapToDto(CommentData comment) => new CommentResponseDto
        {
            Id = comment.Id,
            Body = comment.Body,
            Votes = comment.Votes,
            CreatedAt = comment.CreatedAt,
            AuthorName = comment.Author.UserName,
            PostId = comment.PostId,
            ParentCommentId = comment.ParentCommentId
        };

        internal async Task<CommentResponseDto?> GetCommentByIdExecution(int commentId, int? viewerId = null, CancellationToken ct = default)
        {
            var comment = await _context.Comments
                .Include(c => c.Author)
                .Include(c => c.Post).ThenInclude(p => p!.Community)
                .FirstOrDefaultAsync(c => c.Id == commentId, ct);

            if (comment == null) return null;

            // A comment in a private community is only visible to its (non-banned)
            // members or a global admin.
            if (comment.Post?.Community != null && comment.Post.Community.Type.ToLower() == "private")
            {
                if (!viewerId.HasValue) return null;
                var canView = await _context.CommunityMembers.AnyAsync(
                        m => m.CommunityId == comment.Post.CommunityId && m.UserId == viewerId.Value && !m.IsBanned, ct)
                    || await IsGlobalAdminAsync(viewerId.Value, ct);
                if (!canView) return null;
            }

            return MapToDto(comment);
        }

        internal async Task<IReadOnlyList<CommentResponseDto>> GetCommentsByPostExecution(int postId, int? requestingUserId = null, CancellationToken ct = default)
        {
            var postInfo = await _context.Posts
                .AsNoTracking()
                .Select(p => new { p.Id, p.CommunityId, CommunityType = p.Community.Type })
                .FirstOrDefaultAsync(p => p.Id == postId, ct);

            if (postInfo == null) return Array.Empty<CommentResponseDto>();

            if (postInfo.CommunityType.ToLower() == "private")
            {
                if (!requestingUserId.HasValue) return Array.Empty<CommentResponseDto>();
                var isMember = await _context.CommunityMembers
                    .AnyAsync(m => m.CommunityId == postInfo.CommunityId
                                && m.UserId == requestingUserId.Value
                                && !m.IsBanned, ct);
                if (!isMember) return Array.Empty<CommentResponseDto>();
            }

            var comments = await _context.Comments
                .Include(c => c.Author)
                .Where(c => c.PostId == postId)
                .OrderBy(c => c.CreatedAt)
                .ToListAsync(ct);

            return comments.Select(MapToDto).ToList().AsReadOnly();
        }

        internal async Task<IReadOnlyList<CommentResponseDto>> GetCommentsByUserExecution(int userId, int? viewerId = null, CancellationToken ct = default)
        {
            // Own profile (and admins) see everything; everyone else sees private-community
            // comments only for communities they are a (non-banned) member of.
            var isSelf = viewerId.HasValue && viewerId.Value == userId;
            var isAdmin = viewerId.HasValue && await IsGlobalAdminAsync(viewerId.Value, ct);

            var query = _context.Comments
                .Include(c => c.Author)
                .Where(c => c.AuthorId == userId);

            if (!isSelf && !isAdmin)
            {
                query = query.Where(c =>
                    c.Post.Community.Type.ToLower() != "private" ||
                    (viewerId.HasValue && _context.CommunityMembers.Any(m =>
                        m.CommunityId == c.Post.CommunityId && m.UserId == viewerId.Value && !m.IsBanned)));
            }

            var comments = await query
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync(ct);

            return comments.Select(MapToDto).ToList().AsReadOnly();
        }

        internal async Task<CommentResponseDto?> CreateCommentExecution(CommentCreateDto commentData, int authorId, CancellationToken ct = default)
        {
            var normalizedBody = commentData.Body?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedBody)) return null;

            var postInfo = await _context.Posts
                .Where(p => p.Id == commentData.PostId)
                .Select(p => new { p.Id, p.CommunityId, p.AuthorId, p.Title, CommunitySlug = p.Community.Slug })
                .FirstOrDefaultAsync(ct);

            if (postInfo == null) return null;

            var membership = await _context.CommunityMembers
                .FirstOrDefaultAsync(m => m.CommunityId == postInfo.CommunityId && m.UserId == authorId, ct);

            if (membership == null || membership.IsBanned) return null;

            int? parentCommentAuthorId = null;
            if (commentData.ParentCommentId.HasValue)
            {
                var parentInfo = await _context.Comments
                    .Where(c => c.Id == commentData.ParentCommentId.Value && c.PostId == commentData.PostId)
                    .Select(c => new { c.AuthorId })
                    .FirstOrDefaultAsync(ct);

                if (parentInfo == null) return null;
                parentCommentAuthorId = parentInfo.AuthorId;
            }

            var comment = new CommentData
            {
                Body = normalizedBody,
                PostId = commentData.PostId,
                AuthorId = authorId,
                ParentCommentId = commentData.ParentCommentId,
                CreatedAt = DateTime.UtcNow,
                Votes = 0
            };

            _context.Comments.Add(comment);

            var post = await _context.Posts.FindAsync(new object[] { commentData.PostId }, ct);
            if (post != null) post.CommentsCount++;

            try
            {
                await _context.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                return null;
            }

            await _context.Entry(comment).Reference(c => c.Author).LoadAsync(ct);

            if (commentData.ParentCommentId.HasValue)
            {
                if (parentCommentAuthorId.HasValue && parentCommentAuthorId.Value != authorId)
                {
                    try
                    {
                        await _notificationActions.CreateAndSendAsync(
                            parentCommentAuthorId.Value,
                            NotificationType.NewReply,
                            "Someone replied to your comment.",
                            authorId,
                            commentData.PostId,
                            comment.Id,
                            postInfo.CommunitySlug,
                            postInfo.Title,
                            ct);
                    }
                    catch { }
                }
            }
            else
            {
                if (postInfo.AuthorId != authorId)
                {
                    try
                    {
                        await _notificationActions.CreateAndSendAsync(
                            postInfo.AuthorId,
                            NotificationType.NewComment,
                            "Someone commented on your post.",
                            authorId,
                            commentData.PostId,
                            comment.Id,
                            postInfo.CommunitySlug,
                            postInfo.Title,
                            ct);
                    }
                    catch { }
                }
            }

            return MapToDto(comment);
        }

        internal async Task<CommentResponseDto?> UpdateCommentExecution(int commentId, CommentCreateDto commentData, int requestingUserId, CancellationToken ct = default)
        {
            var comment = await _context.Comments
                .Include(c => c.Author)
                .FirstOrDefaultAsync(c => c.Id == commentId, ct);

            if (comment == null) return null;
            if (comment.AuthorId != requestingUserId) return null;

            var normalizedBody = commentData.Body?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedBody)) return null;

            comment.Body = normalizedBody;

            try
            {
                await _context.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                return null;
            }

            return MapToDto(comment);
        }

        internal async Task<ActionResponse> DeleteCommentExecution(int commentId, int requestingUserId, bool isPrivileged = false, CancellationToken ct = default)
        {
            var comment = await _context.Comments
                .Include(c => c.Post).ThenInclude(p => p!.Community)
                .FirstOrDefaultAsync(c => c.Id == commentId, ct);

            if (comment == null)
                return new ActionResponse { IsSuccess = false, Message = "Comment not found." };

            bool isModDelete = false;
            string? communitySlug = null;
            int commentAuthorId = comment.AuthorId;

            if (comment.AuthorId != requestingUserId)
            {
                var communityId = comment.Post.CommunityId;
                var isModOrOwner = isPrivileged || await _context.CommunityMembers
                    .AnyAsync(m => m.CommunityId == communityId
                                && m.UserId == requestingUserId
                                && (m.Role == "owner" || m.Role == "moderator")
                                && !m.IsBanned, ct)
                    || await IsGlobalAdminAsync(requestingUserId, ct);

                if (!isModOrOwner)
                    return new ActionResponse { IsSuccess = false, Message = "You are not the author of this comment." };

                isModDelete = true;
                communitySlug = comment.Post.Community?.Slug;
            }

            // A non-supreme admin may not remove another admin's comment.
            if (await IsProtectedAdminContentAsync(comment.AuthorId, requestingUserId, ct))
                return new ActionResponse { IsSuccess = false, Message = "Only the primary administrator can remove another administrator's content." };

            // Remove the comment, its full reply tree and every dependent row
            // (votes, saved items, notifications, reports). All FKs are NoAction.
            int removed = await CascadeDeleteCommentsAsync(new[] { commentId }, ct);

            if (comment.Post != null && removed > 0)
                comment.Post.CommentsCount = Math.Max(0, comment.Post.CommentsCount - removed);

            try
            {
                await _context.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                return new ActionResponse { IsSuccess = false, Message = "Failed to delete comment." };
            }

            if (isModDelete)
            {
                try
                {
                    await _notificationActions.CreateAndSendAsync(
                        commentAuthorId,
                        NotificationType.CommentDeletedByMod,
                        "Your comment was removed by a moderator.",
                        requestingUserId,
                        null,
                        null,
                        communitySlug,
                        null,
                        ct);
                }
                catch { }
            }

            return new ActionResponse { IsSuccess = true, Message = "Comment deleted successfully." };
        }
    }
}
