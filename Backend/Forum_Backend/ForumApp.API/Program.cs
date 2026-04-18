using ForumApp.BusinessLayer.Interfaces;
using ForumApp.BusinessLayer.Structure;
using ForumApp.DataAccess;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 🔹 Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 🔹 Configure DbContext
builder.Services.AddDbContext<ForumDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 🔹 Register Business Layer services
builder.Services.AddScoped<IPostActions, PostService>();
builder.Services.AddScoped<ICommunityActions, CommunityService>();
builder.Services.AddScoped<ICommentActions, CommentService>();

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