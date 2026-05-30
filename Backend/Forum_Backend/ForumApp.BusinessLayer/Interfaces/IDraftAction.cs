using ForumApp.Domain.Models.Draft;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Interfaces
{

    public interface IDraftAction
    {
        Task<DraftResponseDto> CreateDraftAsync(CreateDraftRequestDto draftData, int authorId, CancellationToken ct = default);
        Task<DraftResponseDto?> UpdateDraftAsync(UpdateDraftRequestDto draftData, int draftId, int authorId, CancellationToken ct = default);
        Task<DraftResponseDto?> GetDraftByIdAsync(int draftId, int authorId, CancellationToken ct = default);
        Task<IReadOnlyList<DraftResponseDto>> GetAllUserDraftsAsync(int authorId, CancellationToken ct = default);
        Task<ActionResponse> DeleteDraftAsync(int draftId, int authorId, CancellationToken ct = default);
    }
}