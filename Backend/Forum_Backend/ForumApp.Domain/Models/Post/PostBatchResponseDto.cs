namespace ForumApp.Domain.Models.Post
{
    public class PostBatchResponseDto
    {
        public IReadOnlyList<PostResponseDto> Items { get; set; } = Array.Empty<PostResponseDto>();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public bool HasMore { get; set; }
    }
}
