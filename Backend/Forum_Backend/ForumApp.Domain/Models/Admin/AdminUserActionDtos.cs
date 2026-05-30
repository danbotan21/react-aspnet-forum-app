using System.ComponentModel.DataAnnotations;

namespace ForumApp.Domain.Models.Admin
{
    // Body for banning a user globally.
    public class BanUserDto
    {
        [Required]
        [StringLength(500, MinimumLength = 3)]
        public string Reason { get; set; } = string.Empty;
    }

    // Body for changing a user's global role ("Admin" | "User").
    public class ChangeRoleDto
    {
        [Required]
        public string Role { get; set; } = string.Empty;
    }

    // Body for an admin reply to a contact message.
    public class ReplyMessageDto
    {
        [Required]
        [StringLength(1000, MinimumLength = 2)]
        public string Reply { get; set; } = string.Empty;
    }
}
