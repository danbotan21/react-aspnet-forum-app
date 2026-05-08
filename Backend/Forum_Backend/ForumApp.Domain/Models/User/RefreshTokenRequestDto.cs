using System.ComponentModel.DataAnnotations;

namespace ForumApp.Domain.Models.User
{
    // DTO trimis de React la POST /api/auth/refresh
    public class RefreshTokenRequestDto
    {
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }
}
