using ForumApp.Domain.Models.SavedItem;
using ForumApp.Domain.Models.Responses;


namespace ForumApp.BusinessLayer.Interfaces
{

    public interface ISavedItemActions
    {
        Task<SavedItemResponseDTO?> SaveItemAsync(CreateSavedItemRequestDTO itemData, int userId, CancellationToken ct = default);
        Task<ActionResponse> RemoveSavedItemAsync(int savedItemId, int userId, CancellationToken ct = default);
        Task<IReadOnlyList<SavedItemResponseDTO>> GetSavedItemsByUserAsync(int userId, CancellationToken ct = default);
    }

}