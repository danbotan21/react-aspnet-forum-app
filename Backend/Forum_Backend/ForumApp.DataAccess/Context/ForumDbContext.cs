using Microsoft.EntityFrameworkCore;
using ForumApp.Domain.Entities.User;
using ForumApp.Domain.Entities.Community;
using ForumApp.Domain.Entities.Post;



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




        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
        }
    }
}
