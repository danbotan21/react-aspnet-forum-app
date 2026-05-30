using ForumApp.BusinessLayer.Core;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Models.SavedItem;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Structure
{
    public class SavedItemActionExecution : SavedItemActions, ISavedItemAction
    {
        public SavedItemActionExecution(ForumDbContext context)
            : base(context) { }

        public Task<SavedItemResponseDto?> SaveItemAsync(CreateSavedItemRequestDto itemData, int userId, CancellationToken ct = default)
            => SaveItemExecution(itemData, userId, ct);

        public Task<ActionResponse> RemoveSavedItemAsync(int savedItemId, int userId, CancellationToken ct = default)
            => RemoveSavedItemExecution(savedItemId, userId, ct);

        public Task<SavedItemResponseDto?> GetSavedItemByIdAsync(int savedItemId, int userId, CancellationToken ct = default)
            => GetSavedItemByIdExecution(savedItemId, userId, ct);

        public Task<IReadOnlyList<SavedItemResponseDto>> GetSavedItemsByUserAsync(int userId, CancellationToken ct = default)
            => GetSavedItemsByUserExecution(userId, ct);

        public Task<SavedItemResponseDto?> GetUserSavedPostAsync(int postId, int userId, CancellationToken ct = default)
            => GetUserSavedPostExecution(postId, userId, ct);

        public Task<SavedItemResponseDto?> GetUserSavedCommentAsync(int commentId, int userId, CancellationToken ct = default)
            => GetUserSavedCommentExecution(commentId, userId, ct);
    }
}
