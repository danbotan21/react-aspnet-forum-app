using ForumApp.Domain.Entities.User;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ForumApp.Domain.Entities.Follow
{
    // One-directional follow: Follower follows Following.
    public class FollowData
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [ForeignKey("Follower")]
        public int FollowerId { get; set; }
        public UserData Follower { get; set; } = null!;

        [ForeignKey("Following")]
        public int FollowingId { get; set; }
        public UserData Following { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
