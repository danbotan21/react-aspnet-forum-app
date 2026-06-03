namespace ForumApp.Domain.Models.Follow
{
    // A user row in a followers/following list.
    public class FollowUserDto
    {
        public int Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string? Bio { get; set; }
        public bool IsPremium { get; set; }

        // Whether the viewer (the logged-in user) currently follows this user —
        // drives the Follow / Following button in the list.
        public bool IsFollowedByMe { get; set; }
    }
}
