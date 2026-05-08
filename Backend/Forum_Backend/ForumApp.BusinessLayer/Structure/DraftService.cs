using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Entities.Draft;
using ForumApp.Domain.Models.Draft;
using ForumApp.Domain.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Structure
{
    public class DraftService : IDraftActions
    {
        private readonly ForumDbContext _context;

        public DraftService(ForumDbContext context)
        {
            _context = context;
        }

        public async Task<DraftResponseDTO> CreateDraftAsync(CreateDraftRequestDTO draftData, int authorId, CancellationToken ct = default)
        {
            // Verifică dacă Post-ul există
            var post = await _context.Posts
                .FirstOrDefaultAsync(p => p.Id == draftData.PostId, ct);

            if (post == null)
            {
                throw new InvalidOperationException($"Post with ID {draftData.PostId} not found.");
            }

            // Verifică dacă există deja un draft pentru acest post de către același autor
            var existingDraft = await _context.Drafts
                .FirstOrDefaultAsync(d => d.PostId == draftData.PostId && d.AuthorId == authorId, ct);

            if (existingDraft != null)
            {
                // Returnează draft-ul existent în loc să creezi unul nou
                return MapToResponseDTO(existingDraft);
            }

            // Creează draft nou
            var newDraft = new DraftData
            {
                AuthorId = authorId,
                PostId = draftData.PostId,
                CreatedAt = DateTime.UtcNow,
                LastModifiedAt = DateTime.UtcNow
            };

            _context.Drafts.Add(newDraft);
            await _context.SaveChangesAsync(ct);

            // Reîncarcă cu relațiile pentru response
            await _context.Entry(newDraft).Reference(d => d.Author).LoadAsync(ct);
            await _context.Entry(newDraft).Reference(d => d.Post).LoadAsync(ct);

            return MapToResponseDTO(newDraft);
        }

        public async Task<DraftResponseDTO?> UpdateDraftAsync(UpdateDraftRequestDTO draftData, int draftId, int authorId, CancellationToken ct = default)
        {
            var draft = await _context.Drafts
                .Include(d => d.Author)
                .Include(d => d.Post)
                .FirstOrDefaultAsync(d => d.Id == draftId, ct);

            if (draft == null) return null;

            // Validare: doar autorul poate modifica propriul draft
            if (draft.AuthorId != authorId) return null;

            // Verifică dacă noul Post există
            var post = await _context.Posts
                .FirstOrDefaultAsync(p => p.Id == draftData.PostId, ct);

            if (post == null) return null;

            // Actualizează draft-ul
            draft.PostId = draftData.PostId;
            draft.LastModifiedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(ct);

            // Reîncarcă Post dacă s-a schimbat
            await _context.Entry(draft).Reference(d => d.Post).LoadAsync(ct);

            return MapToResponseDTO(draft);
        }

        public async Task<DraftResponseDTO?> GetDraftByIdAsync(int draftId, int authorId, CancellationToken ct = default)
        {
            var draft = await _context.Drafts
                .Include(d => d.Author)
                .Include(d => d.Post)
                .FirstOrDefaultAsync(d => d.Id == draftId, ct);

            if (draft == null) return null;

            // Validare: doar autorul poate vedea propriul draft
            if (draft.AuthorId != authorId) return null;

            return MapToResponseDTO(draft);
        }

        public async Task<IReadOnlyList<DraftResponseDTO>> GetAllUserDraftsAsync(int authorId, CancellationToken ct = default)
        {
            var drafts = await _context.Drafts
                .Include(d => d.Author)
                .Include(d => d.Post)
                .Where(d => d.AuthorId == authorId)
                .OrderByDescending(d => d.LastModifiedAt)
                .ToListAsync(ct);

            return drafts.Select(MapToResponseDTO).ToList();
        }

        public async Task<ActionResponse> DeleteDraftAsync(int draftId, int authorId, CancellationToken ct = default)
        {
            var draft = await _context.Drafts
                .FirstOrDefaultAsync(d => d.Id == draftId, ct);

            if (draft == null)
            {
                return new ActionResponse
                {
                    IsSuccess = false,
                    Message = "Draft not found"
                };
            }

            // Validare: doar autorul poate șterge propriul draft
            if (draft.AuthorId != authorId)
            {
                return new ActionResponse
                {
                    IsSuccess = false,
                    Message = "Unauthorized to delete this draft"
                };
            }

            _context.Drafts.Remove(draft);
            await _context.SaveChangesAsync(ct);

            return new ActionResponse
            {
                IsSuccess = true,
                Message = "Draft deleted successfully"
            };
        }

        // Metodă helper pentru mapare la DTO
        private DraftResponseDTO MapToResponseDTO(DraftData draft)
        {
            return new DraftResponseDTO
            {
                Id = draft.Id,
                AuthorId = draft.AuthorId,
                AuthorUserName = draft.Author?.UserName ?? string.Empty,
                PostId = draft.PostId,
                PostTitle = draft.Post?.Title ?? string.Empty,
                CreatedAt = draft.CreatedAt,
                LastModifiedAt = draft.LastModifiedAt
            };
        }
    }
}

