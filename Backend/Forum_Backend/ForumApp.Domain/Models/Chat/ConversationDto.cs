namespace ForumApp.Domain.Models.Chat
{
    // One row in the conversations sidebar — always described from the viewer's perspective.
    public class ConversationDto
    {
        public int Id { get; set; }

        public int OtherUserId { get; set; }
        public string OtherUserName { get; set; } = string.Empty;
        public string? OtherUserAvatarUrl { get; set; }
        public bool OtherUserIsPremium { get; set; }

        public string? LastMessagePreview { get; set; }
        public DateTime LastMessageAt { get; set; }
        public int UnreadCount { get; set; }
    }
}
