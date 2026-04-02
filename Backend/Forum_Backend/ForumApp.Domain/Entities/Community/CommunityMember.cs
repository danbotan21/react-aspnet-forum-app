using ForumApp.Domain.Entities.User;
using ForumApp.Domain.Entities.Community;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ForumApp.Domain.Entities.CommunityMember
{
    public class CommunityMemberData
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public int UserId { get; set; }
        public UserData User { get; set; } = null!;

        public int CommunityId { get; set; }
        public CommunityData Community { get; set; } = null!;

        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}
