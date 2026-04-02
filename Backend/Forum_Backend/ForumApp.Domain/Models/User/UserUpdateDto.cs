namespace ForumApp.Domain.Models.User
{
    public class UserUpdateDto
    {
        public string? UserName { get; set; }
        public string? Bio { get; set; }
        public string? Theme { get; set; }
        public string? Language { get; set; }
        public string? ProfileVisibility { get; set; }
    }
}
