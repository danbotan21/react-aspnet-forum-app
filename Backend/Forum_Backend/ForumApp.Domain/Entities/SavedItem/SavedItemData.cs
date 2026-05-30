using ForumApp.Domain.Entities.User;
using ForumApp.Domain.Entities.Post;
using ForumApp.Domain.Entities.Comment;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


namespace ForumApp.Domain.Entities.SavedItem{
        public class SavedItemData{
            [Key]
            [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
            public int Id{get; set;}
            public int AuthorId{get; set;}
            public UserData Author{get; set;}=null!;

            public int? PostId{get; set;}
            public PostData? Post{get; set;}= null!;

            public int? CommentId{get; set;}
            public CommentData? Comment{get; set;} =null!;
            public DateTime CreatedAt {get; set;}=DateTime.UtcNow;

        
    }

}