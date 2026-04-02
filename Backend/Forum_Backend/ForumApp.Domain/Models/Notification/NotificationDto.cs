namespace ForumApp.Domain.Models.Notification
{
    public class NotificationData
    {
        public int Id { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsRead { get; set; }
    }
}