using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Entities.Vote;
using ForumApp.Domain.Models.Responses;
using ForumApp.Domain.Models.Vote;
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
            if ((voteData.PostId == null && voteData.CommentId == null) ||
                (voteData.PostId != null && voteData.CommentId != null))
            {
                return null;
            }

            var targetAuthorId = await GetTargetAuthorIdAsync(voteData.PostId, voteData.CommentId, ct);
            if (!targetAuthorId.HasValue) return null;

            var existingVote = await _context.Votes
                .Include(v => v.Author)
                .FirstOrDefaultAsync(v =>
                    v.AuthorId == userId &&
                    v.PostId == voteData.PostId &&
                    v.CommentId == voteData.CommentId, ct);

            if (existingVote != null)
            {
                if (existingVote.Type == voteData.Type)
                {
                    return MapToResponseDTO(existingVote);
                }

                var oldVoteValue = (int)existingVote.Type;
                var newVoteValue = (int)voteData.Type;
                var voteDifference = newVoteValue - oldVoteValue;

                existingVote.Type = voteData.Type;
                existingVote.VotedAt = DateTime.UtcNow;

                await ApplyVoteDeltaAsync(
                    voteData.PostId,
                    voteData.CommentId,
                    voteDifference,
                    userId,
                    targetAuthorId.Value,
                    ct);

                await _context.SaveChangesAsync(ct);
                return MapToResponseDTO(existingVote);
            }

            var newVote = new VoteData
            {
                Type = voteData.Type,
                PostId = voteData.PostId,
                CommentId = voteData.CommentId,
                AuthorId = userId,
                VotedAt = DateTime.UtcNow
            };

            _context.Votes.Add(newVote);

            await ApplyVoteDeltaAsync(
                voteData.PostId,
                voteData.CommentId,
                (int)voteData.Type,
                userId,
                targetAuthorId.Value,
                ct);

            await _context.SaveChangesAsync(ct);
            await _context.Entry(newVote).Reference(v => v.Author).LoadAsync(ct);

            return MapToResponseDTO(newVote);
        }

        public async Task<VoteResponseDTO?> UpdateVoteAsync(UpdateVoteRequestDTO voteData, int voteId, int userId, CancellationToken ct = default)
        {
            var vote = await _context.Votes
                .Include(v => v.Author)
                .FirstOrDefaultAsync(v => v.Id == voteId, ct);

            if (vote == null) return null;
            if (vote.AuthorId != userId) return null;

            if (vote.Type == voteData.Type)
            {
                return MapToResponseDTO(vote);
            }

            var targetAuthorId = await GetTargetAuthorIdAsync(vote.PostId, vote.CommentId, ct);
            if (!targetAuthorId.HasValue) return null;

            var oldVoteValue = (int)vote.Type;
            var newVoteValue = (int)voteData.Type;
            var voteDifference = newVoteValue - oldVoteValue;

            vote.Type = voteData.Type;
            vote.VotedAt = DateTime.UtcNow;

            await ApplyVoteDeltaAsync(
                vote.PostId,
                vote.CommentId,
                voteDifference,
                userId,
                targetAuthorId.Value,
                ct);

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

            if (vote.AuthorId != userId)
            {
                return new ActionResponse
                {
                    IsSuccess = false,
                    Message = "Unauthorized to remove this vote"
                };
            }

            var targetAuthorId = await GetTargetAuthorIdAsync(vote.PostId, vote.CommentId, ct);
            if (!targetAuthorId.HasValue)
            {
                return new ActionResponse
                {
                    IsSuccess = false,
                    Message = "Target content not found."
                };
            }

            await ApplyVoteDeltaAsync(
                vote.PostId,
                vote.CommentId,
                -(int)vote.Type,
                userId,
                targetAuthorId.Value,
                ct);

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

        private async Task<int?> GetTargetAuthorIdAsync(int? postId, int? commentId, CancellationToken ct)
        {
            if (postId.HasValue)
            {
                return await _context.Posts
                    .Where(p => p.Id == postId.Value)
                    .Select(p => (int?)p.AuthorId)
                    .FirstOrDefaultAsync(ct);
            }

            if (commentId.HasValue)
            {
                return await _context.Comments
                    .Where(c => c.ID == commentId.Value)
                    .Select(c => (int?)c.AuthorId)
                    .FirstOrDefaultAsync(ct);
            }

            return null;
        }

        private async Task ApplyVoteDeltaAsync(
            int? postId,
            int? commentId,
            int voteChange,
            int voterUserId,
            int targetAuthorId,
            CancellationToken ct)
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

            if (targetAuthorId != voterUserId)
            {
                var author = await _context.Users.FindAsync(new object[] { targetAuthorId }, ct);
                if (author != null)
                {
                    author.Karma += voteChange;
                }
            }
        }

        private static VoteResponseDTO MapToResponseDTO(VoteData vote)
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
