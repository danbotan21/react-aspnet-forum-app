using ForumApp.Domain.Entities.User;
using ForumApp.Domain.Entities.Post;
using ForumApp.Domain.Entities.Comment;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ForumApp.Domain.Entities.Notification
{
    public class NotificationData
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Message { get; set; } = string.Empty;

        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // User
        [ForeignKey("Recipient")]
        public int RecipientId { get; set; }
        public UserData Recipient { get; set; } = null!;

        // Optional
        [ForeignKey("Post")]
        public int? PostId { get; set; }
        public PostData? Post { get; set; }

        public int? CommentId { get; set; }
        public CommentData? Comment { get; set; }
    }
}