using System.ComponentModel.DataAnnotations;
using ForumApp.Domain.Entities.Vote;

namespace ForumApp.Domain.Models.Vote
{
    public class CreateVoteRequestDTO
    {
        public VoteType Type { get; set; }

        public int? PostId { get; set; }

        public int? CommentId { get; set; }
    }
}
