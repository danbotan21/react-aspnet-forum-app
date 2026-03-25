using ForumApp.Domain.Entities.User;
using ForumApp.Domain.Entities.Post;
using ForumApp.Domain.Entities.Comment;

namespace ForumApp.Domain.Entities.Notification
{
    public class NotificationData
    {
        public int Id { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // User
        public int RecipientId { get; set; }
        public UserData Recipient { get; set; } = null!;

        // Optional
        public int? PostId { get; set; }
        public PostData? Post { get; set; }

        public int? CommentId { get; set; }
        public CommentData? Comment { get; set; }
    }





}