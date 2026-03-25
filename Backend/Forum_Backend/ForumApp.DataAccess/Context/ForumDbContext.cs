using Microsoft.EntityFrameworkCore;
using ForumApp.Domain.Entities.User;
using ForumApp.Domain.Entities.Community;
using ForumApp.Domain.Entities.Post;
using ForumApp.Domain.Entities.Comment;



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




        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Fara cascade delete pe AuthorId din Comments
            // (evitam "multiple cascade paths": User->Posts->Comments SI User->Comments)
            modelBuilder.Entity<CommentData>()
                .HasOne(c => c.Author)
                .WithMany(u => u.Comments)
                .HasForeignKey(c => c.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);

            // Self-referencing (ParentComment) nu poate face cascade in SQL Server
            modelBuilder.Entity<CommentData>()
                .HasOne(c => c.ParentComment)
                .WithMany(c => c.Replies)
                .HasForeignKey(c => c.ParentCommentId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
