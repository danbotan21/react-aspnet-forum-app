using ForumApp.Domain.Entities.User;
using ForumApp.Domain.Entities.Post;
using ForumApp.Domain.Entities.Comment;

    namespace ForumApp.Domain.Entities.Vote
    {
        public enum VoteType
        {
            DownVote = -1,
            UpVote = 1
        }
        public class VoteData
        {
            public int Id { get; set; }
            public VoteType Type { get; set; }
            public int? PostId { get; set; }
            public PostData? Post { get; set; }
            public int? CommentId { get; set; }
            public CommentData? Comment { get; set; }
            public DateTime VotedAt { get; set; } = DateTime.UtcNow;
            public int AuthorId { get; set; }
            public UserData Author { get; set; } = null!;
        }
    }


