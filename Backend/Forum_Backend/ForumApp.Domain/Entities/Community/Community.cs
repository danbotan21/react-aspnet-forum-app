namespace ForumApp.Domain.Entities.Community
{
  using ForumApp.Domain.Entities.Post;
  using ForumApp.Domain.Entities.CommunityMember;
  using System.ComponentModel.DataAnnotations;
  using System.ComponentModel.DataAnnotations.Schema;

  public class CommunityData
  {
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Slug { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string Description { get; set; } = string.Empty;

    public string? BannerUrl { get; set; }

    public string? AvatarUrl { get; set; }

    public int MembersCount { get; set; }

    [Required]
    [StringLength(50)]
    public string Category { get; set; } = string.Empty;

    [Required]
    [StringLength(20)]
    public string Type { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    // Relatie cu Post
    public ICollection<PostData> Posts { get; set; } = new List<PostData>();

    // Relatie cu CommunityMember
    public ICollection<CommunityMemberData> Members { get; set; } = new List<CommunityMemberData>();
  }
}