namespace ForumApp.Domain.Models.User
{

    public class UserResponseDto
    {

        public int Id { get; set; }
        public string UserName { get; set; }
        public string? Email { get; set; }
        public string? Bio { get; set; }
        public string? AvatarUrl { get; set; }
        public string? BannerUrl { get; set; }
        public int Karma { get; set; }
        public string Role { get; set; }
        public string? ProfileVisibility { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool HasPassword { get; set; }
    }

}
