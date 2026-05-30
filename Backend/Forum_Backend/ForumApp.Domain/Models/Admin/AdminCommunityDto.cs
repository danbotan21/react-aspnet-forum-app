namespace ForumApp.Domain.Models.Admin
{
    // Community row for the admin "Communities" table.
    public class AdminCommunityDto
    {
        public int Id { get; set; }
        public string Slug { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? Type { get; set; }
        public string? AvatarUrl { get; set; }
        public DateTime CreatedAt { get; set; }

        public string? OwnerUserName { get; set; }
        public int MembersCount { get; set; }
        public int PostsCount { get; set; }
    }
}
