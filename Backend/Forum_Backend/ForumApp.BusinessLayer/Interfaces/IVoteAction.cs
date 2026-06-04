using ForumApp.Domain.Models.Vote;
using ForumApp.Domain.Models.Responses;



namespace ForumApp.BusinessLayer.Interfaces
{

    public interface IVoteAction
    {
        Task<ServiceResult<VoteResponseDto>> VoteAsync(CreateVoteRequestDto voteData, int userId, CancellationToken ct = default);
        Task<ServiceResult<VoteResponseDto>> UpdateVoteAsync(UpdateVoteRequestDto voteData, int voteId, int userId, CancellationToken ct = default);
        Task<ActionResponse> RemoveVoteAsync(int voteId, int userId, CancellationToken ct = default);
        Task<VoteResponseDto?> GetVoteByIdAsync(int voteId, CancellationToken ct = default);
        Task<IReadOnlyList<VoteResponseDto>> GetUserVotesAsync(int userId, CancellationToken ct = default);
        Task<VoteResponseDto?> GetUserVoteOnPostAsync(int postId, int userId, CancellationToken ct = default);
        Task<VoteResponseDto?> GetUserVoteOnCommentAsync(int commentId, int userId, CancellationToken ct = default);
    }

}