namespace ForumApp.Domain.Models.SavedItem
{
    public class SavedItemResponseDTO
    {
        public int Id { get; set; }
        public int AuthorId { get; set; }
        public string AuthorUserName { get; set; } = string.Empty;
        public int? PostId { get; set; }
        public string? PostTitle { get; set; }
        public int? CommentId { get; set; }
        public string? CommentBody { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
