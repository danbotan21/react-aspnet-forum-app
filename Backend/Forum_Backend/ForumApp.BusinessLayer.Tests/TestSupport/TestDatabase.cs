using ForumApp.DataAccess;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace ForumApp.BusinessLayer.Tests.TestSupport;

public sealed class TestDatabase : IDisposable
{
    private readonly SqliteConnection _connection;

    public ForumDbContext Context { get; }

    public TestDatabase()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<ForumDbContext>()
            .UseSqlite(_connection)
            .Options;

        Context = new ForumDbContext(options);
        Context.Database.EnsureCreated();
    }

    public void Dispose()
    {
        Context.Dispose();
        _connection.Dispose();
    }
}
