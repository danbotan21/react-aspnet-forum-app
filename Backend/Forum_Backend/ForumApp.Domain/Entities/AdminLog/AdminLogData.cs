using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ForumApp.Domain.Entities.User;

namespace ForumApp.Domain.Entities.AdminLog
{
    // Append-only record of every action taken from the global admin panel.
    public class AdminLogData
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        // "ban", "unban", "role", "delete_post", "delete_comment", "delete_community",
        // "report_remove", "report_dismiss", "report_discard", "delete_message"
        [Required]
        [StringLength(40)]
        public string ActionType { get; set; } = string.Empty;

        [Required]
        public int ActorId { get; set; }

        [ForeignKey(nameof(ActorId))]
        public UserData Actor { get; set; } = null!;

        // What the action targeted: "user" | "post" | "comment" | "community" | "report" | "message"
        [StringLength(20)]
        public string? TargetType { get; set; }

        public int? TargetId { get; set; }

        // Human-readable snapshot of the target (kept even if the target is later deleted).
        [StringLength(200)]
        public string? TargetLabel { get; set; }

        [StringLength(500)]
        public string? Details { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
