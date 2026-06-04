using System.ComponentModel.DataAnnotations;

namespace ForumApp.Domain.Models.Post
{
    public class PostUpdateDto
    {
        [Required]
        [StringLength(300, MinimumLength = 1)]
        public string Title { get; set; }

        public string? Body { get; set; }
        public string? ImageUrl { get; set; }
        public string? LinkUrl { get; set; }
    }
}
