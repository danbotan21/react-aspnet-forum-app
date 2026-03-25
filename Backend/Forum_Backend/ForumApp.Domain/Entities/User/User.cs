using ForumApp.Domain.Entities.Post;
using ForumApp.Domain.Entities.Comment;
using ForumApp.Domain.Entities.Report;
using ForumApp.Domain.Entities.Notification;

namespace ForumApp.Domain.Entities.User


{

    public class UserData
    {

        public int ID { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public int Karma { get; set; }
        public string Role { get; set; } = string.Empty;
        public string ProfileVisibility { get; set; } = string.Empty;
        public bool ShowActivity { get; set; }
        public bool EmailNotifications { get; set; }
        public bool PushNotifications { get; set; }
        public string Theme { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }


        // Relatia cu Post: (one to many)
        public ICollection<PostData> Posts { get; set; } = new List<PostData>();

        // Relatia cu Comment: (one to many)
        public ICollection<CommentData> Comments { get; set; } = new List<CommentData>();

        // Relatia cu Report: (one to many)
        public ICollection<ReportData> Reports { get; set; } = new List<Report.ReportData>();
    
        // Relatia cu Notification: (one to many)
        public ICollection<NotificationData> Notifications { get; set; } = new List<NotificationData>();
    }




}