using ForumApp.Domain.Entities.User;
using ForumApp.Domain.Entities.Community;
using ForumApp.Domain.Entities.Comment;
using ForumApp.Domain.Entities.Notification;


namespace ForumApp.Domain.Entities.Post
{
    public class PostData
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Body { get; set; }
        public string? ImageUrl { get; set; }
        public string? LinkUrl { get; set; }
        public string Type { get; set; } = string.Empty;
        public int Votes { get; set; }
        public int CommentsCount { get; set; }
        public DateTime CreatedAt { get; set; }

        // Relatia cu User (autorul postarii)
        public int AuthorId { get; set; }
        public UserData Author { get; set; } = null!;


        public int CommunityId { get; set; } // - Cheie Foreign, trimitere la tabelul Community ce eu il am, ID stie automat EF ca asa este codat;
        public CommunityData Community { get; set; } = null!;
        
        // Relatia cu Comment:
        public ICollection<CommentData> Comments { get; set; } = new List<CommentData>();

        // Relatia cu Notification:
        public ICollection<NotificationData> Notifications { get; set; } = new List<NotificationData>();
    }
}