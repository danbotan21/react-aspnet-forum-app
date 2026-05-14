namespace ForumApp.Domain.Models.Community
{

    public class CommunityCreateDto
    {
        
        public string Title { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Category { get; set; } = null!;
        public string Type { get; set; } = null!;
        public string? AvatarUrl { get; set; }
        public string? BannerUrl { get; set; }

    }
}