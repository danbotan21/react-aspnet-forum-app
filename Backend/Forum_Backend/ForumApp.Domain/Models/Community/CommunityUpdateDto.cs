using System.ComponentModel.DataAnnotations;

namespace ForumApp.Domain.Models.Community
{
    // Partial update: every field is optional (null = leave unchanged), so no
    // [Required] here — only length limits validated WHEN a value is provided.
    public class CommunityUpdateDto
    {
        [StringLength(100, MinimumLength = 1)]
        public string? Title { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        public string? BannerUrl { get; set; }
        public string? AvatarUrl { get; set; }

        [StringLength(50)]
        public string? Category { get; set; }

        [StringLength(20)]
        public string? Type { get; set; }

        public string? Rules { get; set; }
    }
}
