using System.ComponentModel.DataAnnotations;

namespace ForumApp.Domain.Models.Comment
{
    public class CommentCreateDto
    {
        [Required]
        [StringLength(1000, MinimumLength = 1)]
        public string Body { get; set; }

        [Range(1, int.MaxValue)]
        public int PostId { get; set; }

        public int? ParentCommentId { get; set; }
    }
}
