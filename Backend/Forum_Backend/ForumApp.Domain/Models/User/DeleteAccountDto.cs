namespace ForumApp.Domain.Models.User
{
    public class DeleteAccountDto
    {
        public string Email { get; set; } = string.Empty;
        public string? Password { get; set; }
    }
}
