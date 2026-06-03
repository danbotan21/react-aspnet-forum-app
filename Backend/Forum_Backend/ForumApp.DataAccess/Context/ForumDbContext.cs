using Microsoft.EntityFrameworkCore;
using ForumApp.Domain.Entities.User;
using ForumApp.Domain.Entities.Community;
using ForumApp.Domain.Entities.Post;
using ForumApp.Domain.Entities.Comment;
using ForumApp.Domain.Entities.Contact;
using ForumApp.Domain.Entities.Draft;
using ForumApp.Domain.Entities.Notification;
using ForumApp.Domain.Entities.Report;
using ForumApp.Domain.Entities.Vote;
using ForumApp.Domain.Entities.SavedItem;
using ForumApp.Domain.Entities.CommunityMember;
using ForumApp.Domain.Entities.ModLog;
using ForumApp.Domain.Entities.AdminLog;
using ForumApp.Domain.Entities.Follow;
using ForumApp.Domain.Entities.Chat;



namespace ForumApp.DataAccess
{
    public class ForumDbContext : DbContext
    {
        public ForumDbContext(DbContextOptions<ForumDbContext> options) : base(options)
        {
        }



        public DbSet<UserData> Users { get; set; }
        public DbSet<CommunityData> Communities { get; set; }
        public DbSet<PostData> Posts { get; set; }
        public DbSet<CommentData> Comments { get; set; }
        public DbSet<ContactData> Contacts { get; set; }
        public DbSet<DraftData> Drafts { get; set; }
        public DbSet<ReportData> Reports { get; set; }
        public DbSet<SavedItemData> SavedItems { get; set; }
        public DbSet<VoteData> Votes { get; set; }
        public DbSet<NotificationData> Notifications { get; set; }
        public DbSet<CommunityMemberData> CommunityMembers { get; set; }
        public DbSet<ModLogEntryData> ModLogs { get; set; }
        public DbSet<AdminLogData> AdminLogs { get; set; }
        public DbSet<FollowData> Follows { get; set; }
        public DbSet<ConversationData> Conversations { get; set; }
        public DbSet<MessageData> Messages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Notification relationships — explicit to avoid multiple cascade paths
            modelBuilder.Entity<NotificationData>()
                .HasOne(n => n.Recipient)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.RecipientId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<NotificationData>()
                .HasOne(n => n.Actor)
                .WithMany()
                .HasForeignKey(n => n.ActorId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<NotificationData>()
                .HasOne(n => n.Post)
                .WithMany(p => p.Notifications)
                .HasForeignKey(n => n.PostId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<NotificationData>()
                .HasOne(n => n.Comment)
                .WithMany(c => c.Notifications)
                .HasForeignKey(n => n.CommentId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<PostData>()
                .HasOne(p => p.Author)
                .WithMany(u => u.Posts)
                .HasForeignKey(p => p.AuthorId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<DraftData>()
                .HasOne(d => d.Author)
                .WithMany()
                .HasForeignKey(d => d.AuthorId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<DraftData>()
                .HasOne(d => d.Community)
                .WithMany()
                .HasForeignKey(d => d.CommunityId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<CommentData>()
                .HasOne(c => c.Author)
                .WithMany(u => u.Comments)
                .HasForeignKey(c => c.AuthorId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<CommentData>()
                .HasOne(c => c.ParentComment)
                .WithMany(c => c.Replies)
                .HasForeignKey(c => c.ParentCommentId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<CommunityMemberData>()
                .HasIndex(m => new { m.CommunityId, m.UserId })
                .IsUnique();

            // Admin audit log — actor FK must not cascade-delete log rows.
            modelBuilder.Entity<AdminLogData>()
                .HasOne(l => l.Actor)
                .WithMany()
                .HasForeignKey(l => l.ActorId)
                .OnDelete(DeleteBehavior.NoAction);

            // Mod log — preserve audit trail when actor or community is deleted.
            modelBuilder.Entity<ModLogEntryData>()
                .HasOne(l => l.Actor)
                .WithMany()
                .HasForeignKey(l => l.ActorId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ModLogEntryData>()
                .HasOne(l => l.Community)
                .WithMany()
                .HasForeignKey(l => l.CommunityId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<VoteData>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_Votes_ExactlyOneTarget",
                    "([PostId] IS NOT NULL AND [CommentId] IS NULL) OR ([PostId] IS NULL AND [CommentId] IS NOT NULL)"));

            modelBuilder.Entity<VoteData>()
                .HasIndex(v => new { v.AuthorId, v.PostId })
                .IsUnique()
                .HasFilter("[PostId] IS NOT NULL");

            modelBuilder.Entity<VoteData>()
                .HasIndex(v => new { v.AuthorId, v.CommentId })
                .IsUnique()
                .HasFilter("[CommentId] IS NOT NULL");

            modelBuilder.Entity<SavedItemData>()
                .ToTable(t => t.HasCheckConstraint(
                    "CK_SavedItems_ExactlyOneTarget",
                    "([PostId] IS NOT NULL AND [CommentId] IS NULL) OR ([PostId] IS NULL AND [CommentId] IS NOT NULL)"));

            modelBuilder.Entity<SavedItemData>()
                .HasIndex(s => new { s.AuthorId, s.PostId })
                .IsUnique()
                .HasFilter("[PostId] IS NOT NULL");

            modelBuilder.Entity<SavedItemData>()
                .HasIndex(s => new { s.AuthorId, s.CommentId })
                .IsUnique()
                .HasFilter("[CommentId] IS NOT NULL");

            // ===== Follow =====
            // Both FKs point at Users; NoAction avoids multiple cascade paths.
            modelBuilder.Entity<FollowData>()
                .HasOne(f => f.Follower)
                .WithMany()
                .HasForeignKey(f => f.FollowerId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<FollowData>()
                .HasOne(f => f.Following)
                .WithMany()
                .HasForeignKey(f => f.FollowingId)
                .OnDelete(DeleteBehavior.NoAction);

            // A user can follow another user only once.
            modelBuilder.Entity<FollowData>()
                .HasIndex(f => new { f.FollowerId, f.FollowingId })
                .IsUnique();

            // ===== Chat =====
            modelBuilder.Entity<ConversationData>()
                .HasOne(c => c.User1)
                .WithMany()
                .HasForeignKey(c => c.User1Id)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ConversationData>()
                .HasOne(c => c.User2)
                .WithMany()
                .HasForeignKey(c => c.User2Id)
                .OnDelete(DeleteBehavior.NoAction);

            // One conversation per unordered pair (we always store the smaller id as User1).
            modelBuilder.Entity<ConversationData>()
                .HasIndex(c => new { c.User1Id, c.User2Id })
                .IsUnique();

            modelBuilder.Entity<MessageData>()
                .HasOne(m => m.Conversation)
                .WithMany(c => c.Messages)
                .HasForeignKey(m => m.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MessageData>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}
