namespace ForumApp.Domain.Models.User
{

    public class UserResponseDto
    {

        public int ID { get; set; }
        public string UserName { get; set; }
        public string? Bio { get; set; }
        public int Karma { get; set; }
        public string Role { get; set; }
        public DateTime CreatedAt { get; set; }
    }

}