using ForumApp.Domain.Models.Draft;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Interfaces
{

    public interface IDraftActions
    {
        Task<DraftResponseDTO> CreateDraftAsync(CreateDraftRequestDTO draftData, int authorId, CancellationToken ct = default);
        Task<DraftResponseDTO?> UpdateDraftAsync(UpdateDraftRequestDTO draftData, int draftId, int authorId, CancellationToken ct = default);
        Task<DraftResponseDTO?> GetDraftByIdAsync(int draftId, int authorId, CancellationToken ct = default);
        Task<IReadOnlyList<DraftResponseDTO>> GetAllUserDraftsAsync(int authorId, CancellationToken ct = default);
        Task<ActionResponse> DeleteDraftAsync(int draftId, int authorId, CancellationToken ct = default);
    }
}