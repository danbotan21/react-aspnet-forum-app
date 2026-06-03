using System.ComponentModel.DataAnnotations;

namespace ForumApp.Domain.Models.User
{
    public class ResendConfirmationDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }
}
