using ForumApp.Domain.Entities.User;
using ForumApp.Domain.Entities.Post;


namespace ForumApp.Domain.Entities.Comment
{
    public class CommentData

    {
        public int ID { get; set; }
        public string Body { get; set; } = string.Empty;
        public int Votes { get; set; }
        public DateTime CreatedAt { get; set; }


        //Foreign Key spre User, autorul la comentariu:
        public int AuthorId { get; set; }
        public UserData Author { get; set; } = null!;

        // FK spre Post (comentariul apartine unui post)
        public int PostId { get; set; }
        public PostData Post { get; set; } = null!;

        // Self-referencing: reply la alt comentariu (optional)
        public int? ParentCommentId { get; set; }
        public CommentData? ParentComment { get; set; }


        // Comentariile copil (reply-urile la acest comentariu)
        public ICollection<CommentData> Replies { get; set; } = new List<CommentData>();


    }
}