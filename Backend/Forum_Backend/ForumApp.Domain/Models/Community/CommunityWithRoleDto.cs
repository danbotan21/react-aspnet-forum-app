namespace ForumApp.Domain.Models.Community
{
    public class CommunityWithRoleDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public int MembersCount { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsBanned { get; set; }
        public string? BanReason { get; set; }
    }
}
