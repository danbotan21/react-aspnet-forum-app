namespace ForumApp.Domain.Models.Chat
{
    // Send to an existing conversation (ConversationId) OR start a new one (RecipientId).
    public class SendMessageDto
    {
        public int? ConversationId { get; set; }
        public int? RecipientId { get; set; }
        public string? Body { get; set; }
        public string? ImageUrl { get; set; }
        public string? FileUrl { get; set; }
        public string? FileName { get; set; }
    }
}
