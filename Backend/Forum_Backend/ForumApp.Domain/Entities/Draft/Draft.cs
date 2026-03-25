using ForumApp.Domain.Entities.User;
using ForumApp.Domain.Entities.Post;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ForumApp.Domain.Entities.Draft{
    public class DraftData{
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id{get; set;}
        public int AuthorId{get; set;}
        public UserData Author{get; set;}=null!;
        public int PostId{get; set;}
        public PostData Post{get; set;}=null!;
        public DateTime CreatedAt{get; set;}=DateTime.UtcNow;
        public DateTime LastModifiedAt { get; set; } = DateTime.UtcNow;
    }

}