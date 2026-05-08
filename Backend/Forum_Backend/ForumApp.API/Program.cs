using ForumApp.BusinessLayer.Interfaces;
using ForumApp.BusinessLayer.Structure;
using ForumApp.DataAccess;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

//  Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

//  Configure DbContext
builder.Services.AddDbContext<ForumDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IPostActions, PostService>();
builder.Services.AddScoped<ICommunityActions, CommunityService>();
builder.Services.AddScoped<ICommentActions, CommentService>();

builder.Services.AddScoped<IVoteActions, VoteService>();
builder.Services.AddScoped<IDraftActions, DraftService>();
builder.Services.AddScoped<ISavedItemActions, SavedItemService>();
builder.Services.AddScoped<IContactActions, ContactService>();
builder.Services.AddScoped<IReportActions, ReportService>();
builder.Services.AddScoped<INotificationActions, NotificationService>();

var app = builder.Build();

//  Seed mock data is DISABLED - use SQL script instead to avoid FK constraint issues
// See: SeedMockDataComplete.sql for manual seeding

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();

//  Map controllers
app.MapControllers();

app.Run();