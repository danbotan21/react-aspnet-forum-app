using ForumApp.DataAccess;
using ForumApp.Domain.Entities.Draft;
using ForumApp.Domain.Models.Draft;
using ForumApp.Domain.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Core
{
    public class DraftActions
    {
        protected readonly ForumDbContext _context;

        public DraftActions(ForumDbContext context)
        {
            _context = context;
        }

        private static DraftResponseDto MapToResponseDTO(DraftData draft) => new DraftResponseDto
        {
            Id = draft.Id,
            AuthorId = draft.AuthorId,
            AuthorUserName = draft.Author?.UserName ?? string.Empty,
            Title = draft.Title,
            Body = draft.Body,
            LinkUrl = draft.LinkUrl,
            ImageUrl = draft.ImageUrl,
            CommunityId = draft.CommunityId,
            CommunitySlug = draft.Community?.Slug,
            CreatedAt = draft.CreatedAt,
            LastModifiedAt = draft.LastModifiedAt
        };

        internal async Task<DraftResponseDto> CreateDraftExecution(CreateDraftRequestDto draftData, int authorId, CancellationToken ct = default)
        {
            var newDraft = new DraftData
            {
                AuthorId = authorId,
                Title = draftData.Title,
                Body = draftData.Body,
                LinkUrl = draftData.LinkUrl,
                ImageUrl = draftData.ImageUrl,
                CommunityId = draftData.CommunityId,
                CreatedAt = DateTime.UtcNow,
                LastModifiedAt = DateTime.UtcNow
            };

            _context.Drafts.Add(newDraft);
            await _context.SaveChangesAsync(ct);

            await _context.Entry(newDraft).Reference(d => d.Author).LoadAsync(ct);
            if (newDraft.CommunityId.HasValue)
                await _context.Entry(newDraft).Reference(d => d.Community).LoadAsync(ct);

            return MapToResponseDTO(newDraft);
        }

        internal async Task<DraftResponseDto?> UpdateDraftExecution(UpdateDraftRequestDto draftData, int draftId, int authorId, CancellationToken ct = default)
        {
            var draft = await _context.Drafts
                .Include(d => d.Author)
                .Include(d => d.Community)
                .FirstOrDefaultAsync(d => d.Id == draftId, ct);

            if (draft == null || draft.AuthorId != authorId) return null;

            draft.Title = draftData.Title;
            draft.Body = draftData.Body;
            draft.LinkUrl = draftData.LinkUrl;
            draft.ImageUrl = draftData.ImageUrl;
            draft.CommunityId = draftData.CommunityId;
            draft.LastModifiedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(ct);

            if (draft.CommunityId.HasValue && draft.Community == null)
                await _context.Entry(draft).Reference(d => d.Community).LoadAsync(ct);

            return MapToResponseDTO(draft);
        }

        internal async Task<DraftResponseDto?> GetDraftByIdExecution(int draftId, int authorId, CancellationToken ct = default)
        {
            var draft = await _context.Drafts
                .Include(d => d.Author)
                .Include(d => d.Community)
                .FirstOrDefaultAsync(d => d.Id == draftId, ct);

            if (draft == null || draft.AuthorId != authorId) return null;

            return MapToResponseDTO(draft);
        }

        internal async Task<IReadOnlyList<DraftResponseDto>> GetAllUserDraftsExecution(int authorId, CancellationToken ct = default)
        {
            var drafts = await _context.Drafts
                .Include(d => d.Author)
                .Include(d => d.Community)
                .Where(d => d.AuthorId == authorId)
                .OrderByDescending(d => d.LastModifiedAt)
                .ToListAsync(ct);

            return drafts.Select(MapToResponseDTO).ToList();
        }

        internal async Task<ActionResponse> DeleteDraftExecution(int draftId, int authorId, CancellationToken ct = default)
        {
            var draft = await _context.Drafts
                .FirstOrDefaultAsync(d => d.Id == draftId, ct);

            if (draft == null)
                return new ActionResponse { IsSuccess = false, Message = "Draft not found" };

            if (draft.AuthorId != authorId)
                return new ActionResponse { IsSuccess = false, Message = "Unauthorized to delete this draft" };

            _context.Drafts.Remove(draft);
            await _context.SaveChangesAsync(ct);

            return new ActionResponse { IsSuccess = true, Message = "Draft deleted successfully" };
        }
    }
}
