namespace ForumApp.Domain.Models.Admin
{
    // Enriched report row for the admin "Reports" table — covers Post, Comment and User reports
    // across every community (unlike the community mod panel, which is scoped to one community).
    public class AdminReportDto
    {
        public int Id { get; set; }
        public string TypeName { get; set; } = string.Empty; // "Post" | "Comment" | "User"
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;   // "pending" | "dismissed" | "actioned"
        public DateTime CreatedAt { get; set; }

        public string ReporterUserName { get; set; } = string.Empty;
        public int ReportedItemId { get; set; }

        // Community context (null for user reports / deleted communities)
        public int? CommunityId { get; set; }
        public string? CommunityName { get; set; }
        public string? CommunitySlug { get; set; }

        // Content preview (for posts/comments) and navigation helpers
        public string? PostTitle { get; set; }
        public int? PostId { get; set; }
        public string? ContentPreview { get; set; }
        public string? ContentAuthorUserName { get; set; }
        public int? ContentAuthorId { get; set; }
        public bool ContentAuthorIsAdmin { get; set; }
    }
}
