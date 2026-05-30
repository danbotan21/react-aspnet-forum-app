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

            modelBuilder.Entity<CommunityMemberData>()
                .HasIndex(m => new { m.CommunityId, m.UserId })
                .IsUnique();

            // Admin audit log — actor FK must not cascade-delete log rows.
            modelBuilder.Entity<AdminLogData>()
                .HasOne(l => l.Actor)
                .WithMany()
                .HasForeignKey(l => l.ActorId)
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
        }
    }
}
