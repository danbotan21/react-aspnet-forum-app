using Microsoft.EntityFrameworkCore;

namespace ForumApp.DataAccess
{
    public class ForumDbContext : DbContext
    {
        public ForumDbContext(DbContextOptions<ForumDbContext> options) : base(options)
        {
        }

        // DbSet-urile pentru entități vor fi adăugate aici pe măsură ce creezi modelele
        // Exemplu: public DbSet<Post> Posts { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
        }
    }
}
