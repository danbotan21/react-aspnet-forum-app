using System.ComponentModel.DataAnnotations;
using ForumApp.Domain.Entities.Vote;

namespace ForumApp.Domain.Models.Vote
{
    public class UpdateVoteRequestDTO
    {
        public VoteType Type { get; set; }
    }
}
