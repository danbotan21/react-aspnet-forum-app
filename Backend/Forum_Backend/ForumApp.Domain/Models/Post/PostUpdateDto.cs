namespace ForumApp.Domain.Models.Post
{
    public class PostUpdateDto
    {
        public string Title { get; set; }
        public string? Body { get; set; }
        public string? ImageUrl { get; set; }
        public string? LinkUrl { get; set; }
    }
}
