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



namespace ForumApp.DataAccess
{
    public class ForumDbContext : DbContext
    {
        public ForumDbContext(DbContextOptions<ForumDbContext> options) : base(options)
        {
        }



        public DbSet<UserData> Users { get; set; } // DbSet este reprezentarea unui tabel in C#. EF Core vede aceasta linie si stie: "trebuie sa existe un tabel Users in DB cu coloanele din clasa User". Numele proprietatii (Users) devine numele tabelului.
        public DbSet<CommunityData> Communities { get; set; }
        public DbSet<PostData> Posts { get; set; }
        public DbSet<CommentData> Comments { get; set; }
        public DbSet<ContactData> Contacts { get; set; }
        public DbSet<DraftData> Drafts { get; set; }
        public DbSet<ReportData> Reports { get; set; }
        public DbSet<SavedItemData> SavedItems { get; set; }
        public DbSet<VoteData> Votes { get; set; }
        public DbSet<NotificationData> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

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

            modelBuilder.Entity<CommentData>()
                .HasOne(c => c.Author)
                .WithMany(u => u.Comments)
                .HasForeignKey(c => c.AuthorId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}
