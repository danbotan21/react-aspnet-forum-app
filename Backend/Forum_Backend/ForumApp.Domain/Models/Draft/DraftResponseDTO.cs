namespace ForumApp.Domain.Models.Draft
{
    public class DraftResponseDTO
    {
        public int Id { get; set; }
        public int AuthorId { get; set; }
        public string AuthorUserName { get; set; } = string.Empty;
        public int PostId { get; set; }
        public string PostTitle { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime LastModifiedAt { get; set; }
    }
}
