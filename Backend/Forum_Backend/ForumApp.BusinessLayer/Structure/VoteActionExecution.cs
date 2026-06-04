using ForumApp.BusinessLayer.Core;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Models.Responses;
using ForumApp.Domain.Models.Vote;

namespace ForumApp.BusinessLayer.Structure
{
    public class VoteActionExecution : VoteActions, IVoteAction
    {
        public VoteActionExecution(ForumDbContext context, INotificationAction notificationActions)
            : base(context, notificationActions) { }

        public Task<ServiceResult<VoteResponseDto>> VoteAsync(CreateVoteRequestDto voteData, int userId, CancellationToken ct = default)
            => VoteExecution(voteData, userId, ct);

        public Task<ServiceResult<VoteResponseDto>> UpdateVoteAsync(UpdateVoteRequestDto voteData, int voteId, int userId, CancellationToken ct = default)
            => UpdateVoteExecution(voteData, voteId, userId, ct);

        public Task<ActionResponse> RemoveVoteAsync(int voteId, int userId, CancellationToken ct = default)
            => RemoveVoteExecution(voteId, userId, ct);

        public Task<VoteResponseDto?> GetVoteByIdAsync(int voteId, CancellationToken ct = default)
            => GetVoteByIdExecution(voteId, ct);

        public Task<IReadOnlyList<VoteResponseDto>> GetUserVotesAsync(int userId, CancellationToken ct = default)
            => GetUserVotesExecution(userId, ct);

        public Task<VoteResponseDto?> GetUserVoteOnPostAsync(int postId, int userId, CancellationToken ct = default)
            => GetUserVoteOnPostExecution(postId, userId, ct);

        public Task<VoteResponseDto?> GetUserVoteOnCommentAsync(int commentId, int userId, CancellationToken ct = default)
            => GetUserVoteOnCommentExecution(commentId, userId, ct);
    }
}
