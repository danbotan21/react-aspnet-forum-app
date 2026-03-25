namespace ForumApp.Domain.Models.Comment
{
    public class CommentResponseDto
    {
        public int ID { get; set; }
        public string Body { get; set; }
        public int Votes { get; set; }
        public DateTime CreatedAt { get; set; }
        public string AuthorName { get; set; }
        public int PostId { get; set; }
        public int? ParentCommentId { get; set; }
    }
}