using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Entities.Notification;
using ForumApp.Domain.Entities.Vote;
using ForumApp.Domain.Models.Responses;
using ForumApp.Domain.Models.Vote;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Core
{
    public class VoteActions
    {
        protected readonly ForumDbContext _context;
        protected readonly INotificationAction _notificationActions;

        public VoteActions(ForumDbContext context, INotificationAction notificationActions)
        {
            _context = context;
            _notificationActions = notificationActions;
        }

        private static VoteResponseDto MapToResponseDTO(VoteData vote) => new VoteResponseDto
        {
            Id = vote.Id,
            Type = vote.Type,
            PostId = vote.PostId,
            CommentId = vote.CommentId,
            VotedAt = vote.VotedAt,
            AuthorId = vote.AuthorId,
            AuthorUserName = vote.Author?.UserName ?? string.Empty
        };

        private async Task<int?> GetTargetAuthorIdAsync(int? postId, int? commentId, CancellationToken ct)
        {
            if (postId.HasValue)
                return await _context.Posts.Where(p => p.Id == postId.Value).Select(p => (int?)p.AuthorId).FirstOrDefaultAsync(ct);

            if (commentId.HasValue)
                return await _context.Comments.Where(c => c.ID == commentId.Value).Select(c => (int?)c.AuthorId).FirstOrDefaultAsync(ct);

            return null;
        }

        private async Task<int?> GetTargetCommunityIdAsync(int? postId, int? commentId, CancellationToken ct)
        {
            if (postId.HasValue)
                return await _context.Posts.Where(p => p.Id == postId.Value).Select(p => (int?)p.CommunityId).FirstOrDefaultAsync(ct);

            if (commentId.HasValue)
                return await _context.Comments.Where(c => c.ID == commentId.Value).Select(c => (int?)c.Post.CommunityId).FirstOrDefaultAsync(ct);

            return null;
        }

        private async Task ApplyVoteDeltaAsync(int? postId, int? commentId, int voteChange, int voterUserId, int targetAuthorId, CancellationToken ct)
        {
            if (postId.HasValue)
            {
                var post = await _context.Posts.FindAsync(new object[] { postId.Value }, ct);
                if (post != null) post.Votes += voteChange;
            }

            if (commentId.HasValue)
            {
                var comment = await _context.Comments.FindAsync(new object[] { commentId.Value }, ct);
                if (comment != null) comment.Votes += voteChange;
            }

            if (targetAuthorId != voterUserId)
            {
                var author = await _context.Users.FindAsync(new object[] { targetAuthorId }, ct);
                if (author != null) author.Karma += voteChange;
            }
        }

        private async Task<string?> GetCommunitySlugAsync(int? postId, int? commentId, CancellationToken ct)
        {
            if (postId.HasValue)
                return await _context.Posts.Where(p => p.Id == postId.Value).Select(p => p.Community.Slug).FirstOrDefaultAsync(ct);

            if (commentId.HasValue)
                return await _context.Comments.Where(c => c.ID == commentId.Value).Select(c => c.Post.Community.Slug).FirstOrDefaultAsync(ct);

            return null;
        }

        private async Task<string?> GetPostTitleAsync(int? postId, int? commentId, CancellationToken ct)
        {
            if (postId.HasValue)
                return await _context.Posts.Where(p => p.Id == postId.Value).Select(p => p.Title).FirstOrDefaultAsync(ct);

            if (commentId.HasValue)
                return await _context.Comments.Where(c => c.ID == commentId.Value).Select(c => c.Post.Title).FirstOrDefaultAsync(ct);

            return null;
        }

        internal async Task<VoteResponseDto?> VoteExecution(CreateVoteRequestDto voteData, int userId, CancellationToken ct = default)
        {
            if ((voteData.PostId == null && voteData.CommentId == null) ||
                (voteData.PostId != null && voteData.CommentId != null))
                return null;

            var targetAuthorId = await GetTargetAuthorIdAsync(voteData.PostId, voteData.CommentId, ct);
            if (!targetAuthorId.HasValue) return null;

            var communityId = await GetTargetCommunityIdAsync(voteData.PostId, voteData.CommentId, ct);
            if (communityId.HasValue)
            {
                var isBanned = await _context.CommunityMembers
                    .AnyAsync(m => m.CommunityId == communityId.Value && m.UserId == userId && m.IsBanned, ct);
                if (isBanned) return null;
            }

            var existingVote = await _context.Votes
                .Include(v => v.Author)
                .FirstOrDefaultAsync(v =>
                    v.AuthorId == userId &&
                    v.PostId == voteData.PostId &&
                    v.CommentId == voteData.CommentId, ct);

            if (existingVote != null)
            {
                if (existingVote.Type == voteData.Type)
                    return MapToResponseDTO(existingVote);

                var oldVoteValue = (int)existingVote.Type;
                var newVoteValue = (int)voteData.Type;
                var voteDifference = newVoteValue - oldVoteValue;

                existingVote.Type = voteData.Type;
                existingVote.VotedAt = DateTime.UtcNow;

                await ApplyVoteDeltaAsync(voteData.PostId, voteData.CommentId, voteDifference, userId, targetAuthorId.Value, ct);
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

            await ApplyVoteDeltaAsync(voteData.PostId, voteData.CommentId, (int)voteData.Type, userId, targetAuthorId.Value, ct);
            await _context.SaveChangesAsync(ct);
            await _context.Entry(newVote).Reference(v => v.Author).LoadAsync(ct);

            if (newVote.Type == VoteType.UpVote && targetAuthorId.Value != userId)
            {
                try
                {
                    var notifType = voteData.PostId.HasValue ? NotificationType.PostUpvoted : NotificationType.CommentUpvoted;
                    var communitySlug = await GetCommunitySlugAsync(voteData.PostId, voteData.CommentId, ct);
                    var postTitle = await GetPostTitleAsync(voteData.PostId, voteData.CommentId, ct);
                    await _notificationActions.CreateAndSendAsync(
                        targetAuthorId.Value,
                        notifType,
                        voteData.PostId.HasValue ? "Your post received an upvote." : "Your comment received an upvote.",
                        userId,
                        voteData.PostId,
                        voteData.CommentId,
                        communitySlug,
                        postTitle,
                        ct);
                }
                catch { }
            }

            return MapToResponseDTO(newVote);
        }

        internal async Task<VoteResponseDto?> UpdateVoteExecution(UpdateVoteRequestDto voteData, int voteId, int userId, CancellationToken ct = default)
        {
            var vote = await _context.Votes
                .Include(v => v.Author)
                .FirstOrDefaultAsync(v => v.Id == voteId, ct);

            if (vote == null) return null;
            if (vote.AuthorId != userId) return null;

            if (vote.Type == voteData.Type)
                return MapToResponseDTO(vote);

            var targetAuthorId = await GetTargetAuthorIdAsync(vote.PostId, vote.CommentId, ct);
            if (!targetAuthorId.HasValue) return null;

            var oldVoteValue = (int)vote.Type;
            var newVoteValue = (int)voteData.Type;
            var voteDifference = newVoteValue - oldVoteValue;

            vote.Type = voteData.Type;
            vote.VotedAt = DateTime.UtcNow;

            await ApplyVoteDeltaAsync(vote.PostId, vote.CommentId, voteDifference, userId, targetAuthorId.Value, ct);
            await _context.SaveChangesAsync(ct);
            return MapToResponseDTO(vote);
        }

        internal async Task<ActionResponse> RemoveVoteExecution(int voteId, int userId, CancellationToken ct = default)
        {
            var vote = await _context.Votes.FirstOrDefaultAsync(v => v.Id == voteId, ct);

            if (vote == null)
                return new ActionResponse { IsSuccess = false, Message = "Vote not found" };

            if (vote.AuthorId != userId)
                return new ActionResponse { IsSuccess = false, Message = "Unauthorized to remove this vote" };

            var targetAuthorId = await GetTargetAuthorIdAsync(vote.PostId, vote.CommentId, ct);
            if (!targetAuthorId.HasValue)
                return new ActionResponse { IsSuccess = false, Message = "Target content not found." };

            await ApplyVoteDeltaAsync(vote.PostId, vote.CommentId, -(int)vote.Type, userId, targetAuthorId.Value, ct);

            _context.Votes.Remove(vote);
            await _context.SaveChangesAsync(ct);

            return new ActionResponse { IsSuccess = true, Message = "Vote removed successfully" };
        }

        internal async Task<VoteResponseDto?> GetVoteByIdExecution(int voteId, CancellationToken ct = default)
        {
            var vote = await _context.Votes
                .Include(v => v.Author)
                .FirstOrDefaultAsync(v => v.Id == voteId, ct);

            return vote != null ? MapToResponseDTO(vote) : null;
        }

        internal async Task<IReadOnlyList<VoteResponseDto>> GetUserVotesExecution(int userId, CancellationToken ct = default)
        {
            var votes = await _context.Votes
                .Include(v => v.Author)
                .Where(v => v.AuthorId == userId)
                .OrderByDescending(v => v.VotedAt)
                .ToListAsync(ct);

            return votes.Select(MapToResponseDTO).ToList();
        }

        internal async Task<VoteResponseDto?> GetUserVoteOnPostExecution(int postId, int userId, CancellationToken ct = default)
        {
            var vote = await _context.Votes
                .Include(v => v.Author)
                .FirstOrDefaultAsync(v => v.PostId == postId && v.AuthorId == userId, ct);

            return vote != null ? MapToResponseDTO(vote) : null;
        }

        internal async Task<VoteResponseDto?> GetUserVoteOnCommentExecution(int commentId, int userId, CancellationToken ct = default)
        {
            var vote = await _context.Votes
                .Include(v => v.Author)
                .FirstOrDefaultAsync(v => v.CommentId == commentId && v.AuthorId == userId, ct);

            return vote != null ? MapToResponseDTO(vote) : null;
        }
    }
}
