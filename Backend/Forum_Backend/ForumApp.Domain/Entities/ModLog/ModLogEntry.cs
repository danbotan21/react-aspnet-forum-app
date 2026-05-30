using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ForumApp.Domain.Entities.Community;
using ForumApp.Domain.Entities.User;

namespace ForumApp.Domain.Entities.ModLog
{
    public class ModLogEntry
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int CommunityId { get; set; }

        [Required]
        [MaxLength(50)]
        public string ActionType { get; set; } = string.Empty; // "ban","unban","kick","promote","demote","pin","unpin","remove","dismiss","transfer"

        [Required]
        public int ActorId { get; set; }

        public int? TargetUserId { get; set; }

        public int? TargetPostId { get; set; }

        [MaxLength(500)]
        public string? Details { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey(nameof(CommunityId))]
        public virtual CommunityData Community { get; set; } = null!;

        [ForeignKey(nameof(ActorId))]
        public virtual UserData Actor { get; set; } = null!;

        [ForeignKey(nameof(TargetUserId))]
        public virtual UserData? TargetUser { get; set; }
    }
}
