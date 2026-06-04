using System.ComponentModel.DataAnnotations;

namespace ForumApp.Domain.Models.Chat
{
    // Send to an existing conversation (ConversationId) OR start a new one (RecipientId).
    // A message may carry text and/or an attachment, so Body is validated for length
    // only (the "must have text or a file" rule is enforced in the business layer).
    public class SendMessageDto
    {
        public int? ConversationId { get; set; }
        public int? RecipientId { get; set; }

        [StringLength(2000)]
        public string? Body { get; set; }

        public string? ImageUrl { get; set; }
        public string? FileUrl { get; set; }

        [StringLength(260)]
        public string? FileName { get; set; }
    }
}
