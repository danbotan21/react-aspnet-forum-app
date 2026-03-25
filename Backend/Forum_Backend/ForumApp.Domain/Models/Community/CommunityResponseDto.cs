namespace ForumApp.Domain.Models.Community
{
    public class CommunityResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Slug { get; set; }
        public string Description { get; set; }
        public string? BannerUrl { get; set; }
        public string? AvatarUrl { get; set; }
        public int MembersCount { get; set; }
        public string Category { get; set; }
        public string Type { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}