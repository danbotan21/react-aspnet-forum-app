namespace ForumApp.Domain.Models.Admin
{
    public class AdminLogDto
    {
        public int Id { get; set; }
        public string ActionType { get; set; } = string.Empty;
        public string ActorUserName { get; set; } = string.Empty;
        public string? TargetType { get; set; }
        public int? TargetId { get; set; }
        public string? TargetLabel { get; set; }
        public string? Details { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
