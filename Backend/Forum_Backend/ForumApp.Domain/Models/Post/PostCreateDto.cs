using System.ComponentModel.DataAnnotations;

namespace ForumApp.Domain.Models.Post
{
    public class PostCreateDto
    {
        [Required]
        [StringLength(300, MinimumLength = 1)]
        public string Title { get; set; }

        public string? Body { get; set; }
        public string? ImageUrl { get; set; }
        public string? LinkUrl { get; set; }

        [Required]
        [StringLength(20)]
        public string Type { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "A valid community must be selected.")]
        public int CommunityId { get; set; }
    }
}
