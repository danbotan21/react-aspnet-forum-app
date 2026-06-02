using ForumApp.DataAccess;
using ForumApp.Domain.Entities.SavedItem;
using ForumApp.Domain.Models.SavedItem;
using ForumApp.Domain.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Core
{
    public class SavedItemActions
    {
        protected readonly ForumDbContext _context;

        public SavedItemActions(ForumDbContext context)
        {
            _context = context;
        }

        private SavedItemResponseDto MapToResponseDTO(SavedItemData savedItem) => new SavedItemResponseDto
        {
            Id = savedItem.Id,
            AuthorId = savedItem.AuthorId,
            AuthorUserName = savedItem.Author?.UserName ?? string.Empty,
            PostId = savedItem.PostId,
            PostTitle = savedItem.Post?.Title,
            CommentId = savedItem.CommentId,
            CommentBody = savedItem.Comment?.Body,
            CreatedAt = savedItem.CreatedAt
        };

        internal async Task<SavedItemResponseDto?> SaveItemExecution(CreateSavedItemRequestDto itemData, int userId, CancellationToken ct = default)
        {
            if ((itemData.PostId == null && itemData.CommentId == null) ||
                (itemData.PostId != null && itemData.CommentId != null))
                return null;

            if (itemData.PostId.HasValue)
            {
                var postExists = await _context.Posts.AnyAsync(p => p.Id == itemData.PostId.Value, ct);
                if (!postExists) return null;
            }

            if (itemData.CommentId.HasValue)
            {
                var commentExists = await _context.Comments.AnyAsync(c => c.Id == itemData.CommentId.Value, ct);
                if (!commentExists) return null;
            }

            var existingSavedItem = await _context.SavedItems
                .Include(s => s.Author)
                .Include(s => s.Post)
                .Include(s => s.Comment)
                .FirstOrDefaultAsync(s =>
                    s.AuthorId == userId &&
                    s.PostId == itemData.PostId &&
                    s.CommentId == itemData.CommentId, ct);

            if (existingSavedItem != null)
                return MapToResponseDTO(existingSavedItem);

            var newSavedItem = new SavedItemData
            {
                AuthorId = userId,
                PostId = itemData.PostId,
                CommentId = itemData.CommentId,
                CreatedAt = DateTime.UtcNow
            };

            _context.SavedItems.Add(newSavedItem);
            await _context.SaveChangesAsync(ct);

            await _context.Entry(newSavedItem).Reference(s => s.Author).LoadAsync(ct);

            if (newSavedItem.PostId.HasValue)
                await _context.Entry(newSavedItem).Reference(s => s.Post).LoadAsync(ct);

            if (newSavedItem.CommentId.HasValue)
                await _context.Entry(newSavedItem).Reference(s => s.Comment).LoadAsync(ct);

            return MapToResponseDTO(newSavedItem);
        }

        internal async Task<ActionResponse> RemoveSavedItemExecution(int savedItemId, int userId, CancellationToken ct = default)
        {
            var savedItem = await _context.SavedItems.FirstOrDefaultAsync(s => s.Id == savedItemId, ct);

            if (savedItem == null)
                return new ActionResponse { IsSuccess = false, Message = "Saved item not found" };

            if (savedItem.AuthorId != userId)
                return new ActionResponse { IsSuccess = false, Message = "Unauthorized to remove this saved item" };

            _context.SavedItems.Remove(savedItem);
            await _context.SaveChangesAsync(ct);

            return new ActionResponse { IsSuccess = true, Message = "Saved item removed successfully" };
        }

        internal async Task<SavedItemResponseDto?> GetSavedItemByIdExecution(int savedItemId, int userId, CancellationToken ct = default)
        {
            var savedItem = await _context.SavedItems
                .Include(s => s.Author)
                .Include(s => s.Post)
                .Include(s => s.Comment)
                .FirstOrDefaultAsync(s => s.Id == savedItemId, ct);

            if (savedItem == null) return null;
            if (savedItem.AuthorId != userId) return null;

            return MapToResponseDTO(savedItem);
        }

        internal async Task<IReadOnlyList<SavedItemResponseDto>> GetSavedItemsByUserExecution(int userId, CancellationToken ct = default)
        {
            var savedItems = await _context.SavedItems
                .Include(s => s.Author)
                .Include(s => s.Post)
                .Include(s => s.Comment)
                .Where(s => s.AuthorId == userId)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync(ct);

            return savedItems.Select(MapToResponseDTO).ToList();
        }

        internal async Task<SavedItemResponseDto?> GetUserSavedPostExecution(int postId, int userId, CancellationToken ct = default)
        {
            var savedItem = await _context.SavedItems
                .Include(s => s.Author)
                .Include(s => s.Post)
                .FirstOrDefaultAsync(s => s.PostId == postId && s.AuthorId == userId, ct);

            if (savedItem == null) return null;
            return MapToResponseDTO(savedItem);
        }

        internal async Task<SavedItemResponseDto?> GetUserSavedCommentExecution(int commentId, int userId, CancellationToken ct = default)
        {
            var savedItem = await _context.SavedItems
                .Include(s => s.Author)
                .Include(s => s.Comment)
                .FirstOrDefaultAsync(s => s.CommentId == commentId && s.AuthorId == userId, ct);

            if (savedItem == null) return null;
            return MapToResponseDTO(savedItem);
        }
    }
}
