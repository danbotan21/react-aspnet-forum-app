using System.ComponentModel.DataAnnotations;

namespace ForumApp.Domain.Models.User
{
    public class VerifyLoginCodeDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Code { get; set; } = string.Empty;
    }
}
