namespace ForumApp.Domain.Models.Community
{
    public class CommunityMemberResponseDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string Role { get; set; } = string.Empty;
        public int Karma { get; set; }
        public DateTime JoinedAt { get; set; }
        public string? BanReason { get; set; }
        public DateTime? BannedAt { get; set; }
        public string? BannedByUserName { get; set; }
    }
}
