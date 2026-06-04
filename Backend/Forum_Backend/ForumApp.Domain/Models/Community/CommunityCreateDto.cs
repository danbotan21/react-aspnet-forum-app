using System.ComponentModel.DataAnnotations;

namespace ForumApp.Domain.Models.Community
{
    public class CommunityCreateDto
    {
        [Required]
        [StringLength(100, MinimumLength = 1)]
        public string Title { get; set; } = null!;

        [Required]
        [StringLength(100, MinimumLength = 1)]
        public string Slug { get; set; } = null!;

        [Required]
        [StringLength(500)]
        public string Description { get; set; } = null!;

        [Required]
        [StringLength(50)]
        public string Category { get; set; } = null!;

        [Required]
        [StringLength(20)]
        public string Type { get; set; } = null!;

        public string? AvatarUrl { get; set; }
        public string? BannerUrl { get; set; }
    }
}
