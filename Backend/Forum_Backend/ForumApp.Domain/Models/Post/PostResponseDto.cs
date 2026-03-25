namespace ForumApp.Domain.Models.Post
{
    public class PostResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string? Body { get; set; }
        public string? ImageUrl { get; set; }
        public string? LinkUrl { get; set; }
        public string Type { get; set; }
        public int Votes { get; set; }
        public int CommentsCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public string AuthorName { get; set; }
        public string CommunitySlug { get; set; }
    }
}