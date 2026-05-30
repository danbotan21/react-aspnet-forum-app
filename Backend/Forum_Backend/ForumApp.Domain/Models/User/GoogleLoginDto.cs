using System.ComponentModel.DataAnnotations;

namespace ForumApp.Domain.Models.User
{
    public class GoogleLoginDto
    {
        [Required]
        public string AccessToken { get; set; } = string.Empty;
    }
}
