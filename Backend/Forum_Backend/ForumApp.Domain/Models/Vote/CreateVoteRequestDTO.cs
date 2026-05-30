using System.ComponentModel.DataAnnotations;
using ForumApp.Domain.Entities.Vote;

namespace ForumApp.Domain.Models.Vote
{
    public class CreateVoteRequestDto
    {
        public VoteType Type { get; set; }

        public int? PostId { get; set; }

        public int? CommentId { get; set; }
    }
}
