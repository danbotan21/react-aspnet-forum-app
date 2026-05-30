namespace ForumApp.Domain.Models.Draft
{
    public class DraftResponseDTO
    {
        public int Id { get; set; }
        public int AuthorId { get; set; }
        public string AuthorUserName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Body { get; set; }
        public string? LinkUrl { get; set; }
        public string? ImageUrl { get; set; }
        public int? CommunityId { get; set; }
        public string? CommunitySlug { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastModifiedAt { get; set; }
    }
}
