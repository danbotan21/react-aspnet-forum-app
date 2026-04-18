using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Entities.Vote;
using ForumApp.Domain.Models.Vote;
using ForumApp.Domain.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Structure
{
    public class VoteService : IVoteActions
    {
        private readonly ForumDbContext _context;

        public VoteService(ForumDbContext context)
        {
            _context = context;
        }

        public async Task<VoteResponseDTO?> VoteAsync(CreateVoteRequestDTO voteData, int userId, CancellationToken ct = default)
        {
            // Validare: trebuie să fie fie PostId fie CommentId, dar nu ambele
            if ((voteData.PostId == null && voteData.CommentId == null) || 
                (voteData.PostId != null && voteData.CommentId != null))
            {
                return null; // Invalid: trebuie exact unul dintre cele două
            }

            // Verifică dacă Post sau Comment există
            if (voteData.PostId.HasValue)
            {
                var postExists = await _context.Posts.AnyAsync(p => p.Id == voteData.PostId.Value, ct);
                if (!postExists) return null;
            }

            if (voteData.CommentId.HasValue)
            {
                var commentExists = await _context.Comments.AnyAsync(c => c.ID == voteData.CommentId.Value, ct);
                if (!commentExists) return null;
            }

            // Verifică dacă user-ul a votat deja
            var existingVote = await _context.Votes
                .Include(v => v.Author)
                .FirstOrDefaultAsync(v => 
                    v.AuthorId == userId && 
                    v.PostId == voteData.PostId && 
                    v.CommentId == voteData.CommentId, ct);

            if (existingVote != null)
            {
                // Dacă votul este același tip, nu face nimic
                if (existingVote.Type == voteData.Type)
                {
                    return MapToResponseDTO(existingVote);
                }

                // Altfel, actualizează votul (de la Upvote la Downvote sau invers)
                var oldVoteValue = (int)existingVote.Type;
                var newVoteValue = (int)voteData.Type;
                var voteDifference = newVoteValue - oldVoteValue;

                existingVote.Type = voteData.Type;
                existingVote.VotedAt = DateTime.UtcNow;

                // Actualizează contorul de voturi
                await UpdateVoteCounter(voteData.PostId, voteData.CommentId, voteDifference, ct);

                await _context.SaveChangesAsync(ct);
                return MapToResponseDTO(existingVote);
            }

            // Creează un vot nou
            var newVote = new VoteData
            {
                Type = voteData.Type,
                PostId = voteData.PostId,
                CommentId = voteData.CommentId,
                AuthorId = userId,
                VotedAt = DateTime.UtcNow
            };

            _context.Votes.Add(newVote);

            // Actualizează contorul de voturi
            await UpdateVoteCounter(voteData.PostId, voteData.CommentId, (int)voteData.Type, ct);

            await _context.SaveChangesAsync(ct);

            // Reîncarcă cu Author pentru a returna username
            await _context.Entry(newVote).Reference(v => v.Author).LoadAsync(ct);

            return MapToResponseDTO(newVote);
        }

        public async Task<VoteResponseDTO?> UpdateVoteAsync(UpdateVoteRequestDTO voteData, int voteId, int userId, CancellationToken ct = default)
        {
            var vote = await _context.Votes
                .Include(v => v.Author)
                .FirstOrDefaultAsync(v => v.Id == voteId, ct);

            if (vote == null) return null;

            // Validare: doar autorul votului poate să-l modifice
            if (vote.AuthorId != userId) return null;

            // Dacă tipul de vot este același, nu face nimic
            if (vote.Type == voteData.Type)
            {
                return MapToResponseDTO(vote);
            }

            // Calculează diferența pentru actualizarea contorului
            var oldVoteValue = (int)vote.Type;
            var newVoteValue = (int)voteData.Type;
            var voteDifference = newVoteValue - oldVoteValue;

            vote.Type = voteData.Type;
            vote.VotedAt = DateTime.UtcNow;

            // Actualizează contorul
            await UpdateVoteCounter(vote.PostId, vote.CommentId, voteDifference, ct);

            await _context.SaveChangesAsync(ct);

            return MapToResponseDTO(vote);
        }

        public async Task<ActionResponse> RemoveVoteAsync(int voteId, int userId, CancellationToken ct = default)
        {
            var vote = await _context.Votes
                .FirstOrDefaultAsync(v => v.Id == voteId, ct);

            if (vote == null)
            {
                return new ActionResponse
                {
                    IsSuccess = false,
                    Message = "Vote not found"
                };
            }

            // Validare: doar autorul votului poate să-l șteargă
            if (vote.AuthorId != userId)
            {
                return new ActionResponse
                {
                    IsSuccess = false,
                    Message = "Unauthorized to remove this vote"
                };
            }

            // Actualizează contorul (scade votul)
            await UpdateVoteCounter(vote.PostId, vote.CommentId, -(int)vote.Type, ct);

            _context.Votes.Remove(vote);
            await _context.SaveChangesAsync(ct);

            return new ActionResponse
            {
                IsSuccess = true,
                Message = "Vote removed successfully"
            };
        }

        public async Task<VoteResponseDTO?> GetVoteByIdAsync(int voteId, CancellationToken ct = default)
        {
            var vote = await _context.Votes
                .Include(v => v.Author)
                .FirstOrDefaultAsync(v => v.Id == voteId, ct);

            return vote != null ? MapToResponseDTO(vote) : null;
        }

        public async Task<IReadOnlyList<VoteResponseDTO>> GetAllVotesAsync(CancellationToken ct = default)
        {
            var votes = await _context.Votes
                .Include(v => v.Author)
                .OrderByDescending(v => v.VotedAt)
                .ToListAsync(ct);

            return votes.Select(MapToResponseDTO).ToList();
        }

        public async Task<VoteResponseDTO?> GetUserVoteOnPostAsync(int postId, int userId, CancellationToken ct = default)
        {
            var vote = await _context.Votes
                .Include(v => v.Author)
                .FirstOrDefaultAsync(v => v.PostId == postId && v.AuthorId == userId, ct);

            return vote != null ? MapToResponseDTO(vote) : null;
        }

        public async Task<VoteResponseDTO?> GetUserVoteOnCommentAsync(int commentId, int userId, CancellationToken ct = default)
        {
            var vote = await _context.Votes
                .Include(v => v.Author)
                .FirstOrDefaultAsync(v => v.CommentId == commentId && v.AuthorId == userId, ct);

            return vote != null ? MapToResponseDTO(vote) : null;
        }

        // Metodă helper pentru actualizarea contorului de voturi
        private async Task UpdateVoteCounter(int? postId, int? commentId, int voteChange, CancellationToken ct)
        {
            if (postId.HasValue)
            {
                var post = await _context.Posts.FindAsync(new object[] { postId.Value }, ct);
                if (post != null)
                {
                    post.Votes += voteChange;
                }
            }

            if (commentId.HasValue)
            {
                var comment = await _context.Comments.FindAsync(new object[] { commentId.Value }, ct);
                if (comment != null)
                {
                    comment.Votes += voteChange;
                }
            }
        }

        // Metodă helper pentru mapare la DTO
        private VoteResponseDTO MapToResponseDTO(VoteData vote)
        {
            return new VoteResponseDTO
            {
                Id = vote.Id,
                Type = vote.Type,
                PostId = vote.PostId,
                CommentId = vote.CommentId,
                VotedAt = vote.VotedAt,
                AuthorId = vote.AuthorId,
                AuthorUserName = vote.Author?.UserName ?? string.Empty
            };
        }
    }
}
