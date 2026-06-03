using ForumApp.Domain.Entities.User;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ForumApp.Domain.Entities.Chat
{
    // A single message within a conversation. Either Body or ImageUrl (or both) is set.
    public class MessageData
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [ForeignKey("Conversation")]
        public int ConversationId { get; set; }
        public ConversationData Conversation { get; set; } = null!;

        [ForeignKey("Sender")]
        public int SenderId { get; set; }
        public UserData Sender { get; set; } = null!;

        [StringLength(2000)]
        public string? Body { get; set; }

        public string? ImageUrl { get; set; }

        // Arbitrary file attachment (non-image): stored URL + original display name.
        public string? FileUrl { get; set; }

        [StringLength(260)]
        public string? FileName { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Set when the sender edits the message text.
        public DateTime? EditedAt { get; set; }

        // null = unread by the recipient.
        public DateTime? ReadAt { get; set; }
    }
}
