using ForumApp.Domain.Entities.User;
using ForumApp.Domain.Entities.Post;
using ForumApp.Domain.Entities.Comment;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

    namespace ForumApp.Domain.Entities.Vote
    {
        public enum VoteType
        {
            DownVote = -1,
            UpVote = 1
        }
        public class VoteData
        {
            [Key]
            [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
            public int Id { get; set; }

            public VoteType Type { get; set; }
            [ForeignKey("Post")]
            public int? PostId { get; set; }
            public PostData? Post { get; set; }
            [ForeignKey("Comment")]
            public int? CommentId { get; set; }
            public CommentData? Comment { get; set; }
            public DateTime VotedAt { get; set; } = DateTime.UtcNow;
            [ForeignKey("Author")]
            public int AuthorId { get; set; }
            public UserData Author { get; set; } = null!;
        }
    }


