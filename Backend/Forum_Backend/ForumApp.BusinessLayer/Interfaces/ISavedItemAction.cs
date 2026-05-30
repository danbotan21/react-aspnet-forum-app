using ForumApp.Domain.Models.SavedItem;
using ForumApp.Domain.Models.Responses;


namespace ForumApp.BusinessLayer.Interfaces
{

    public interface ISavedItemAction
    {
        Task<SavedItemResponseDto?> SaveItemAsync(CreateSavedItemRequestDto itemData, int userId, CancellationToken ct = default);
        Task<ActionResponse> RemoveSavedItemAsync(int savedItemId, int userId, CancellationToken ct = default);
        Task<SavedItemResponseDto?> GetSavedItemByIdAsync(int savedItemId, int userId, CancellationToken ct = default);
        Task<IReadOnlyList<SavedItemResponseDto>> GetSavedItemsByUserAsync(int userId, CancellationToken ct = default);
        Task<SavedItemResponseDto?> GetUserSavedPostAsync(int postId, int userId, CancellationToken ct = default);
        Task<SavedItemResponseDto?> GetUserSavedCommentAsync(int commentId, int userId, CancellationToken ct = default);
    }

}