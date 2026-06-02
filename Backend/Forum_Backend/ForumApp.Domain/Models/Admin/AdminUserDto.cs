namespace ForumApp.Domain.Models.Admin
{
    // Detailed user row for the admin "Users" table — includes activity stats and global ban status.
    public class AdminUserDto
    {
        public int Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public string? AvatarUrl { get; set; }
        public string Role { get; set; } = string.Empty;
        public bool IsSupremeAdmin { get; set; }
        public int Karma { get; set; }
        public DateTime CreatedAt { get; set; }

        public bool IsBanned { get; set; }
        public string? BanReason { get; set; }
        public DateTime? BannedAt { get; set; }

        public int PostsCount { get; set; }
        public int CommentsCount { get; set; }
        public int CommunitiesCount { get; set; }
    }
}
