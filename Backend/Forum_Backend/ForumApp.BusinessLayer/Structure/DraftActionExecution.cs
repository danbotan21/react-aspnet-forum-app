using ForumApp.BusinessLayer.Core;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Models.Draft;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Structure
{
    public class DraftActionExecution : DraftActions, IDraftAction
    {
        public DraftActionExecution(ForumDbContext context)
            : base(context) { }

        public Task<DraftResponseDto> CreateDraftAsync(CreateDraftRequestDto draftData, int authorId, CancellationToken ct = default)
            => CreateDraftExecution(draftData, authorId, ct);

        public Task<DraftResponseDto?> UpdateDraftAsync(UpdateDraftRequestDto draftData, int draftId, int authorId, CancellationToken ct = default)
            => UpdateDraftExecution(draftData, draftId, authorId, ct);

        public Task<DraftResponseDto?> GetDraftByIdAsync(int draftId, int authorId, CancellationToken ct = default)
            => GetDraftByIdExecution(draftId, authorId, ct);

        public Task<IReadOnlyList<DraftResponseDto>> GetAllUserDraftsAsync(int authorId, CancellationToken ct = default)
            => GetAllUserDraftsExecution(authorId, ct);

        public Task<ActionResponse> DeleteDraftAsync(int draftId, int authorId, CancellationToken ct = default)
            => DeleteDraftExecution(draftId, authorId, ct);
    }
}
