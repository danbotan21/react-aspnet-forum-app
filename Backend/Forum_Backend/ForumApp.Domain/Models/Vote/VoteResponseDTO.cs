using ForumApp.Domain.Entities.Vote;

namespace ForumApp.Domain.Models.Vote
{
    public class VoteResponseDTO
    {
        public int Id { get; set; }
        public VoteType Type { get; set; }
        public int? PostId { get; set; }
        public int? CommentId { get; set; }
        public DateTime VotedAt { get; set; }
        public int AuthorId { get; set; }
        public string AuthorUserName { get; set; } = string.Empty;
    }
}
