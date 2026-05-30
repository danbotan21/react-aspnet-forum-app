namespace ForumApp.Domain.Models.Notification
{
    public class NotificationResponseDto
    {
        public int Id { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsRead { get; set; }
        public int? ActorId { get; set; }
        public string? ActorUsername { get; set; }
        public string? ActorAvatarUrl { get; set; }
        public int? PostId { get; set; }
        public int? CommentId { get; set; }
        public string? CommunitySlug { get; set; }
        public string? PostTitle { get; set; }
    }
}
