namespace ForumApp.Domain.Models.Admin
{
    // Aggregate counts shown on the admin dashboard overview.
    public class AdminStatsDto
    {
        public int TotalUsers { get; set; }
        public int TotalCommunities { get; set; }
        public int TotalPosts { get; set; }
        public int TotalComments { get; set; }
        public int PendingReports { get; set; }
        public int BannedUsers { get; set; }
    }
}
