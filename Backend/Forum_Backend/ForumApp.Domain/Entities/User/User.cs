namespace ForumApp.Domain.Entities.User


{
    using ForumApp.Domain.Entities.Post;
    using ForumApp.Domain.Entities.Comment;
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


        // Relatia cu Post:
        public ICollection<PostData> Posts { get; set; } = new List<PostData>();

        // Relatia cu Comment:
        public ICollection<CommentData> Comments { get; set; } = new List<CommentData>();

    }




}