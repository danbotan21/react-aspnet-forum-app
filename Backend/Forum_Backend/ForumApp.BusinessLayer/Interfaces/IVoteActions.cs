using ForumApp.Domain.Models.Vote;
using ForumApp.Domain.Models.Responses;



namespace ForumApp.BusinessLayer.Interfaces
{

    public interface IVoteActions
    {
        Task<VoteResponseDTO?> VoteAsync(CreateVoteRequestDTO voteData, int userId, CancellationToken ct = default);
        Task<VoteResponseDTO?> UpdateVoteAsync(UpdateVoteRequestDTO voteData, int voteId, int userId, CancellationToken ct = default);
        Task<ActionResponse> RemoveVoteAsync(int voteId, int userId, CancellationToken ct = default);
        Task<VoteResponseDTO?> GetVoteByIdAsync(int voteId, CancellationToken ct = default);
        Task<IReadOnlyList<VoteResponseDTO>> GetAllVotesAsync(CancellationToken ct = default);
        Task<VoteResponseDTO?> GetUserVoteOnPostAsync(int postId, int userId, CancellationToken ct = default);
        Task<VoteResponseDTO?> GetUserVoteOnCommentAsync(int commentId, int userId, CancellationToken ct = default);
    }

}