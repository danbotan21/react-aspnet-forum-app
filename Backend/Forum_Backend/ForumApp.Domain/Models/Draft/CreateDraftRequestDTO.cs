using System.ComponentModel.DataAnnotations;

namespace ForumApp.Domain.Models.Draft
{
    public class CreateDraftRequestDto
    {
        [Required]
        [MaxLength(300)]
        public string Title { get; set; } = string.Empty;
        public string? Body { get; set; }
        public string? LinkUrl { get; set; }
        public string? ImageUrl { get; set; }
        public int? CommunityId { get; set; }
    }
}
