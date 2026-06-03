using ForumApp.Domain.Entities.User;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ForumApp.Domain.Entities.Chat
{
    // A 1-to-1 direct-message thread between two users.
    public class ConversationData
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [ForeignKey("User1")]
        public int User1Id { get; set; }
        public UserData User1 { get; set; } = null!;

        [ForeignKey("User2")]
        public int User2Id { get; set; }
        public UserData User2 { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Updated on every new message so we can sort conversations by recency.
        public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;

        public ICollection<MessageData> Messages { get; set; } = new List<MessageData>();
    }
}
