using ForumApp.Domain.Entities.User;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ForumApp.Domain.Entities.Report
{
    public enum ReportType
    {
        Post = 0,
        Comment = 1,
        User = 2
    }
    public class ReportData
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Reason { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Reporter User
        [ForeignKey("Reporter")]
        public int ReporterId { get; set; }
        public UserData Reporter { get; set; } = null!;
        public ReportType Type { get; set; }

        // Reported Item
        [Required]
        public int ReportedItemId { get; set; }
    }
}