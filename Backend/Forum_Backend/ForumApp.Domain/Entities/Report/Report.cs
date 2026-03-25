using ForumApp.Domain.Entities.User;

namespace ForumApp.Domain.Entities.Report
{
    public enum ReportType
    {
        Post = 0,
        Comment = 1,
        User = 2
    }
    public class ReportData
    {
        public int Id { get; set; }
        public string Reason { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Reporter User
        public int ReporterId { get; set; }
        public UserData Reporter { get; set; } = null!;
        public ReportType Type { get; set; }

        // Reported Item
        public int ReportedItemId { get; set; }
    }
}