namespace ForumApp.Domain.Models.Post
{
    public class PostCreateDto
    {
        public string Title { get; set; }
        public string? Body { get; set; }
        public string? ImageUrl { get; set; }
        public string? LinkUrl { get; set; }
        public string Type { get; set; }
        public int CommunityId { get; set; }

    }
}