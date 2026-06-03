namespace ForumApp.Domain.Models.User
{
    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;        // access token (15 min)
        public string RefreshToken { get; set; } = string.Empty; // refresh token (7 zile)
        public UserResponseDto? User { get; set; }

        // Two-step login signals. When either is true, no tokens are issued yet.
        public bool RequiresEmailCode { get; set; }          // password OK → code emailed
        public bool RequiresEmailConfirmation { get; set; }  // account email not confirmed yet
        public string? PendingEmail { get; set; }            // which address the next step targets
    }
}