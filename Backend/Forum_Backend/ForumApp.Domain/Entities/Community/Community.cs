namespace ForumApp.Domain.Entities.Community

{
  using ForumApp.Domain.Entities.Post;
  public class CommunityData
  {
    public int Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? BannerUrl { get; set; }
    public string? AvatarUrl { get; set; }
    public int MembersCount { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }


    //Relatie cu Post;

    public ICollection<PostData> Posts { get; set; } = new List<PostData>();
  }

}