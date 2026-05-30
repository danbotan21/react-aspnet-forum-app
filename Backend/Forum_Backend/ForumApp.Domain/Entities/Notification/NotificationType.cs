namespace ForumApp.Domain.Entities.Notification
{
    public enum NotificationType
    {
        Unknown = 0,
        NewComment = 1,
        NewReply = 2,
        PostUpvoted = 3,
        CommentUpvoted = 4,
        Banned = 5,
        PostDeletedByMod = 6,
        CommentDeletedByMod = 7
    }
}
