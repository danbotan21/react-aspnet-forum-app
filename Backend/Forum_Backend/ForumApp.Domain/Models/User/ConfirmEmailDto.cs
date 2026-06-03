using System.ComponentModel.DataAnnotations;

namespace ForumApp.Domain.Models.User
{
    public class ConfirmEmailDto
    {
        [Required]
        public string Token { get; set; } = string.Empty;
    }
}
