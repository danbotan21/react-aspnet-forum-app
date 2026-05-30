using System.ComponentModel.DataAnnotations;

namespace ForumApp.Domain.Models.User
{
    public class UserUpdateDto
    {
        [StringLength(50, MinimumLength = 6)]
        public string? UserName { get; set; }

        [StringLength(50)]
        [DataType(DataType.EmailAddress)]
        public string? Email { get; set; }

        public string? CurrentPassword { get; set; }

        [StringLength(200)]
        public string? Bio { get; set; }

        public string? AvatarUrl { get; set; }
        public string? Theme { get; set; }
        public string? Language { get; set; }
        public string? ProfileVisibility { get; set; }
    }
}
