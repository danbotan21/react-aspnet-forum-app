namespace ForumApp.Domain.Models.Comment
{
    public class CommentCreateDto
    {
        public string Body { get; set; }
        public int PostId { get; set; }
        public int? ParentCommentId { get; set; }
    }
}