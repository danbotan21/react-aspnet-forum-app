namespace ForumApp.Domain.Models.Report
{
    public class CommunityReportResponseDto
    {
        public int Id { get; set; }
        public string TypeName { get; set; } = string.Empty; // "Post" or "Comment"
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }

        public string ReporterUserName { get; set; } = string.Empty;

        public string? PostTitle { get; set; }
        public string? ContentPreview { get; set; }
        public bool HasImage { get; set; }
        public string? PostImageUrl { get; set; }
        public string ContentAuthorUserName { get; set; } = string.Empty;

        // The content author's role in this community ("owner"/"moderator"/"member"/null).
        // Lets the UI flag the owner's content and hide actions a moderator may not take.
        public string? ContentAuthorRole { get; set; }

        public int ReportedItemId { get; set; }
        public int? PostId { get; set; } // for comments: the parent post id
    }
}
