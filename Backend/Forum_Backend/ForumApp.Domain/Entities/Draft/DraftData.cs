using ForumApp.Domain.Entities.Community;
using ForumApp.Domain.Entities.User;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ForumApp.Domain.Entities.Draft
{
    public class DraftData
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public int AuthorId { get; set; }
        public UserData Author { get; set; } = null!;
        public string Title { get; set; } = string.Empty;
        public string? Body { get; set; }
        public string? LinkUrl { get; set; }
        public string? ImageUrl { get; set; }
        public int? CommunityId { get; set; }
        public CommunityData? Community { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastModifiedAt { get; set; } = DateTime.UtcNow;
    }
}
