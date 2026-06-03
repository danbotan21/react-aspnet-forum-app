namespace ForumApp.Domain.Models.Chat
{
    public class MessageDto
    {
        public int Id { get; set; }
        public int ConversationId { get; set; }
        public int SenderId { get; set; }
        public string SenderUserName { get; set; } = string.Empty;
        public string? SenderAvatarUrl { get; set; }
        public string? Body { get; set; }
        public string? ImageUrl { get; set; }
        public string? FileUrl { get; set; }
        public string? FileName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? EditedAt { get; set; }
        public DateTime? ReadAt { get; set; }
    }
}
