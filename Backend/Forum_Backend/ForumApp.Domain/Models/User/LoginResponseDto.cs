namespace ForumApp.Domain.Models.User
{
    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;        // access token (15 min)
        public string RefreshToken { get; set; } = string.Empty; // refresh token (7 zile)
        public UserResponseDto User { get; set; } = null!;
    }
}