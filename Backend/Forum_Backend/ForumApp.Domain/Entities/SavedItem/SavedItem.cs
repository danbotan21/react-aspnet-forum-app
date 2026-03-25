using ForumApp.Domain.Entities.User;
using ForumApp.Domain.Entities.Post;
using ForumApp.Domain.Entities.Comment;


namespace ForumApp.Domain.Entities.SavedItem{
        public class SavedItemData{
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