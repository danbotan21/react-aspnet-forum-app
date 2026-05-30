using System.ComponentModel.DataAnnotations;

namespace ForumApp.Domain.Models.Community
{
    public class BanMemberDto
    {
        [Required]
        [StringLength(500, MinimumLength = 3)]
        public string Reason { get; set; } = string.Empty;
    }
}
