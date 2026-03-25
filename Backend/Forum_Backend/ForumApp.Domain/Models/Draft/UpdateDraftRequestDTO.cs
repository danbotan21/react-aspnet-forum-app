using System.ComponentModel.DataAnnotations;

namespace ForumApp.Domain.Models.Draft
{
    public class UpdateDraftRequestDTO
    {
        [Required]
        public int PostId { get; set; }
    }
}
