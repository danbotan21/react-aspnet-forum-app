namespace ForumApp.Domain.Models.ModLog
{
    public class ModLogEntryDto
    {
        public int Id { get; set; }
        public string ActionType { get; set; } = string.Empty;
        public string ActorUserName { get; set; } = string.Empty;
        public string? TargetUserName { get; set; }
        public int? TargetPostId { get; set; }
        public string? Details { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
