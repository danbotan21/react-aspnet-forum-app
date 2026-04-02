using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Entities.Comment;
using ForumApp.Domain.Models.Comment;
using ForumApp.Domain.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Structure
{
    public class CommentService : ICommentActions
    {
        private readonly ForumDbContext _context;

        public CommentService(ForumDbContext context)
        {
            _context = context;
        }

        private static CommentResponseDto MapToDto(CommentData comment) => new CommentResponseDto
        {
            ID = comment.ID,
            Body = comment.Body,
            Votes = comment.Votes,
            CreatedAt = comment.CreatedAt,
            AuthorName = comment.Author.UserName,
            PostId = comment.PostId,
            ParentCommentId = comment.ParentCommentId
        };

        public async Task<CommentResponseDto?> GetCommentByIdAsync(int commentId, CancellationToken ct = default)
        {
            var comment = await _context.Comments
                .Include(c => c.Author)
                .FirstOrDefaultAsync(c => c.ID == commentId, ct);

            if (comment == null) return null;

            return MapToDto(comment);
        }

        public async Task<IReadOnlyList<CommentResponseDto>> GetCommentsByPostAsync(int postId, CancellationToken ct = default)
        {
            var comments = await _context.Comments
                .Include(c => c.Author)
                .Where(c => c.PostId == postId)
                .OrderBy(c => c.CreatedAt)
                .ToListAsync(ct);

            return comments.Select(MapToDto).ToList().AsReadOnly();
        }

        public async Task<IReadOnlyList<CommentResponseDto>> GetCommentsByUserAsync(int userId, CancellationToken ct = default)
        {
            var comments = await _context.Comments
                .Include(c => c.Author)
                .Where(c => c.AuthorId == userId)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync(ct);

            return comments.Select(MapToDto).ToList().AsReadOnly();
        }

        public async Task<CommentResponseDto?> CreateCommentAsync(CommentCreateDto commentData, int authorId, CancellationToken ct = default)
        {
            var postExists = await _context.Posts
                .AnyAsync(p => p.Id == commentData.PostId, ct);

            if (!postExists) return null;

            // Daca este reply, verifica ca comentariul parinte exista si apartine aceluiasi post
            if (commentData.ParentCommentId.HasValue)
            {
                var parentExists = await _context.Comments
                    .AnyAsync(c => c.ID == commentData.ParentCommentId.Value && c.PostId == commentData.PostId, ct);

                if (!parentExists) return null;
            }

            var comment = new CommentData
            {
                Body = commentData.Body,
                PostId = commentData.PostId,
                AuthorId = authorId,
                ParentCommentId = commentData.ParentCommentId,
                CreatedAt = DateTime.UtcNow,
                Votes = 0
            };

            _context.Comments.Add(comment);

            // Incrementeaza CommentsCount pe post
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

            return MapToDto(comment);
        }

        public async Task<CommentResponseDto?> UpdateCommentAsync(int commentId, CommentCreateDto commentData, int requestingUserId, CancellationToken ct = default)
        {
            var comment = await _context.Comments
                .Include(c => c.Author)
                .FirstOrDefaultAsync(c => c.ID == commentId, ct);

            if (comment == null) return null;

            if (comment.AuthorId != requestingUserId) return null;

            comment.Body = commentData.Body;

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

        public async Task<ActionResponse> DeleteCommentAsync(int commentId, int requestingUserId, CancellationToken ct = default)
        {
            var comment = await _context.Comments
                .FirstOrDefaultAsync(c => c.ID == commentId, ct);

            if (comment == null)
                return new ActionResponse { IsSuccess = false, Message = "Comment not found." };

            if (comment.AuthorId != requestingUserId)
                return new ActionResponse { IsSuccess = false, Message = "You are not the author of this comment." };

            // Decrementeaza CommentsCount pe post
            var post = await _context.Posts.FindAsync(new object[] { comment.PostId }, ct);
            if (post != null && post.CommentsCount > 0) post.CommentsCount--;

            _context.Comments.Remove(comment);

            try
            {
                await _context.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                return new ActionResponse { IsSuccess = false, Message = "Failed to delete comment." };
            }

            return new ActionResponse { IsSuccess = true, Message = "Comment deleted successfully." };
        }
    }
}