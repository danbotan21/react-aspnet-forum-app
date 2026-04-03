using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Entities.SavedItem;
using ForumApp.Domain.Models.SavedItem;
using ForumApp.Domain.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Structure
{
    public class SavedItemService : ISavedItemActions
    {
        private readonly ForumDbContext _context;

        public SavedItemService(ForumDbContext context)
        {
            _context = context;
        }

        public async Task<SavedItemResponseDTO?> SaveItemAsync(CreateSavedItemRequestDTO itemData, int userId, CancellationToken ct = default)
        {
            // Validare: trebuie să fie fie PostId fie CommentId, dar nu ambele
            if ((itemData.PostId == null && itemData.CommentId == null) ||
                (itemData.PostId != null && itemData.CommentId != null))
            {
                return null; // Invalid: trebuie exact unul dintre cele două
            }

            // Verifică dacă Post sau Comment există
            if (itemData.PostId.HasValue)
            {
                var postExists = await _context.Posts.AnyAsync(p => p.Id == itemData.PostId.Value, ct);
                if (!postExists) return null;
            }

            if (itemData.CommentId.HasValue)
            {
                var commentExists = await _context.Comments.AnyAsync(c => c.ID == itemData.CommentId.Value, ct);
                if (!commentExists) return null;
            }

            // Verifică dacă user-ul a salvat deja acest item
            var existingSavedItem = await _context.SavedItems
                .Include(s => s.Author)
                .Include(s => s.Post)
                .Include(s => s.Comment)
                .FirstOrDefaultAsync(s =>
                    s.AuthorId == userId &&
                    s.PostId == itemData.PostId &&
                    s.CommentId == itemData.CommentId, ct);

            if (existingSavedItem != null)
            {
                // Item-ul este deja salvat, returnează-l
                return MapToResponseDTO(existingSavedItem);
            }

            // Creează un saved item nou
            var newSavedItem = new SavedItemData
            {
                AuthorId = userId,
                PostId = itemData.PostId,
                CommentId = itemData.CommentId,
                CreatedAt = DateTime.UtcNow
            };

            _context.SavedItems.Add(newSavedItem);
            await _context.SaveChangesAsync(ct);

            // Reîncarcă cu relațiile pentru response
            await _context.Entry(newSavedItem).Reference(s => s.Author).LoadAsync(ct);

            if (newSavedItem.PostId.HasValue)
            {
                await _context.Entry(newSavedItem).Reference(s => s.Post).LoadAsync(ct);
            }

            if (newSavedItem.CommentId.HasValue)
            {
                await _context.Entry(newSavedItem).Reference(s => s.Comment).LoadAsync(ct);
            }

            return MapToResponseDTO(newSavedItem);
        }

        public async Task<ActionResponse> RemoveSavedItemAsync(int savedItemId, int userId, CancellationToken ct = default)
        {
            var savedItem = await _context.SavedItems
                .FirstOrDefaultAsync(s => s.Id == savedItemId, ct);

            if (savedItem == null)
            {
                return new ActionResponse
                {
                    IsSuccess = false,
                    Message = "Saved item not found"
                };
            }

            // Validare: doar autorul poate șterge propriul saved item
            if (savedItem.AuthorId != userId)
            {
                return new ActionResponse
                {
                    IsSuccess = false,
                    Message = "Unauthorized to remove this saved item"
                };
            }

            _context.SavedItems.Remove(savedItem);
            await _context.SaveChangesAsync(ct);

            return new ActionResponse
            {
                IsSuccess = true,
                Message = "Saved item removed successfully"
            };
        }

        public async Task<SavedItemResponseDTO?> GetSavedItemByIdAsync(int savedItemId, int userId, CancellationToken ct = default)
        {
            var savedItem = await _context.SavedItems
                .Include(s => s.Author)
                .Include(s => s.Post)
                .Include(s => s.Comment)
                .FirstOrDefaultAsync(s => s.Id == savedItemId, ct);

            if (savedItem == null) return null;

            // Validare: doar autorul poate vedea propriul saved item
            if (savedItem.AuthorId != userId) return null;

            return MapToResponseDTO(savedItem);
        }

        public async Task<IReadOnlyList<SavedItemResponseDTO>> GetSavedItemsByUserAsync(int userId, CancellationToken ct = default)
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

        public async Task<SavedItemResponseDTO?> GetUserSavedPostAsync(int postId, int userId, CancellationToken ct = default)
        {
            var savedItem = await _context.SavedItems
                .Include(s => s.Author)
                .Include(s => s.Post)
                .FirstOrDefaultAsync(s => s.PostId == postId && s.AuthorId == userId, ct);

            if (savedItem == null) return null;

            return MapToResponseDTO(savedItem);
        }

        public async Task<SavedItemResponseDTO?> GetUserSavedCommentAsync(int commentId, int userId, CancellationToken ct = default)
        {
            var savedItem = await _context.SavedItems
                .Include(s => s.Author)
                .Include(s => s.Comment)
                .FirstOrDefaultAsync(s => s.CommentId == commentId && s.AuthorId == userId, ct);

            if (savedItem == null) return null;

            return MapToResponseDTO(savedItem);
        }

        // Metodă helper pentru mapare la DTO
        private SavedItemResponseDTO MapToResponseDTO(SavedItemData savedItem)
        {
            return new SavedItemResponseDTO
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
        }
    }
}
