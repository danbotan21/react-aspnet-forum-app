namespace ForumApp.Domain.Models.Community
{

    public class CommunityCreateDto
    {
        public string Title { get; set; }
        public string Slug { get; set; }
        public string Description { get; set; }
        public string Category { get; set; }
        public string Type { get; set; }

    }
}