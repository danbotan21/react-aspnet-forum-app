using System.ComponentModel.DataAnnotations;
namespace ForumApp.Domain.Models.User
{
   public class UserRegisterDto
{
    [Required]
    [StringLength(50, MinimumLength = 6)]
    public string UserName { get; set; }

    [Required]
    [EmailAddress]
    [StringLength(50)]
    public string Email { get; set; }

    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string Password { get; set; }
}
}