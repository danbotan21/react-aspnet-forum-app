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
        [StringLength(300)]
        public string Message { get; set; } = string.Empty;

        public NotificationType Type { get; set; } = NotificationType.Unknown;

        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("Recipient")]
        public int RecipientId { get; set; }
        public UserData Recipient { get; set; } = null!;

        [ForeignKey("Actor")]
        public int? ActorId { get; set; }
        public UserData? Actor { get; set; }

        [ForeignKey("Post")]
        public int? PostId { get; set; }
        public PostData? Post { get; set; }

        [ForeignKey("Comment")]
        public int? CommentId { get; set; }
        public CommentData? Comment { get; set; }

        [StringLength(100)]
        public string? CommunitySlug { get; set; }

        [StringLength(300)]
        public string? PostTitle { get; set; }
    }
}
