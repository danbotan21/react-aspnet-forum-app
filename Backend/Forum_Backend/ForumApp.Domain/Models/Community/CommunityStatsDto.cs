namespace ForumApp.Domain.Models.Community
{
    public class CommunityStatsDto
    {
        public int MembersCount { get; set; }
        public int ModeratorsCount { get; set; }
        public int PostsCount { get; set; }
        public int BannedCount { get; set; }
    }
}
