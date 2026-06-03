namespace ForumApp.Domain.Models.Follow
{
    // Follow summary for a profile page.
    public class FollowStatusDto
    {
        public bool IsFollowing { get; set; }   // does the viewer follow this profile?
        public bool FollowsMe { get; set; }      // does this profile follow the viewer back?
        public int FollowersCount { get; set; }
        public int FollowingCount { get; set; }
    }
}
