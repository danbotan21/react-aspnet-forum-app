using ForumApp.BusinessLayer.Interfaces;
using ForumApp.BusinessLayer.Structure;
using ForumApp.DataAccess;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.BusinessLayer.Structure;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 🔹 Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 🔹 Configure DbContext
builder.Services.AddDbContext<ForumDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

<<<<<<< HEAD
// 🔹 Register Business Layer services
builder.Services.AddScoped<IPostActions, PostService>();
builder.Services.AddScoped<ICommunityActions, CommunityService>();
builder.Services.AddScoped<ICommentActions, CommentService>();
=======
// 🔹 Register Business Layer Services
builder.Services.AddScoped<IVoteActions, VoteService>();
builder.Services.AddScoped<IDraftActions, DraftService>();
builder.Services.AddScoped<ISavedItemActions, SavedItemService>();
>>>>>>> cf77dcd73506257a024e461d211f66a1002044ce

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();

// 🔹 Map controllers
app.MapControllers();

app.Run();