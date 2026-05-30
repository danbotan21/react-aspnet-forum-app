namespace ForumApp.Domain.Models.Admin
{
    public class AdminPostDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Preview { get; set; }
        public string Type { get; set; } = string.Empty;
        public int Votes { get; set; }
        public int CommentsCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public string AuthorUserName { get; set; } = string.Empty;
        public string? CommunitySlug { get; set; }
        public string? CommunityTitle { get; set; }
    }

    public class AdminCommentDto
    {
        public int Id { get; set; }
        public string Preview { get; set; } = string.Empty;
        public int Votes { get; set; }
        public DateTime CreatedAt { get; set; }
        public string AuthorUserName { get; set; } = string.Empty;
        public int PostId { get; set; }
        public string? PostTitle { get; set; }
        public string? CommunitySlug { get; set; }
    }

    // Generic paged wrapper used by the admin content browser.
    public class AdminPagedResult<T>
    {
        public IReadOnlyList<T> Items { get; set; } = new List<T>();
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }
}
