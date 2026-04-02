namespace ForumApp.Domain.Models.Community
{
    public class CommunityUpdateDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? BannerUrl { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Category { get; set; }
        public string? Type { get; set; }
    }
}
