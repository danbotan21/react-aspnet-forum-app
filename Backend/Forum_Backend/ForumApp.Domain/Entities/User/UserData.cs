using ForumApp.Domain.Entities.Post;
using ForumApp.Domain.Entities.Comment;
using ForumApp.Domain.Entities.Report;
using ForumApp.Domain.Entities.Notification;
using ForumApp.Domain.Entities.CommunityMember;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ForumApp.Domain.Entities.User
{

    public class UserData
    {

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [StringLength(50, MinimumLength = 6)]
        public string UserName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [StringLength(256)]
        public string? PasswordHash { get; set; }

        // Set when the user authenticated via Google OAuth
        public string? GoogleId { get; set; }

        [StringLength(200)]
        public string? Bio { get; set; }

        [StringLength(20)]
        public string Role { get; set; } = string.Empty;

        [StringLength(20)]
        public string ProfileVisibility { get; set; } = string.Empty;

        [StringLength(20)]
        public string Theme { get; set; } = string.Empty;

        [StringLength(10)]
        public string Language { get; set; } = string.Empty;

        public string? AvatarUrl { get; set; }

        public string? BannerUrl { get; set; }

        public int Karma { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Global ban (applied by an application admin — blocks login across the whole app)
        public bool IsBanned { get; set; } = false;

        [StringLength(500)]
        public string? BanReason { get; set; }

        public DateTime? BannedAt { get; set; }

        public int? BannedByUserId { get; set; }

        // Refresh token pentru sesiuni persistente (React frontend)
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiry { get; set; }


        // Relatia cu Post: (one to many)
        public ICollection<PostData> Posts { get; set; } = new List<PostData>();

        // Relatia cu Comment: (one to many)
        public ICollection<CommentData> Comments { get; set; } = new List<CommentData>();

        // Relatia cu Report: (one to many)
        public ICollection<ReportData> Reports { get; set; } = new List<Report.ReportData>();

        // Relatia cu Notification: (one to many)
        public ICollection<NotificationData> Notifications { get; set; } = new List<NotificationData>();

        // Relatia cu CommunityMember: (one to many)
        public ICollection<CommunityMemberData> Communities { get; set; } = new List<CommunityMemberData>();
    }
}
