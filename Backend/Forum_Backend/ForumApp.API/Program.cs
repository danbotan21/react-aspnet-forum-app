using ForumApp.BusinessLayer.Interfaces;
using ForumApp.BusinessLayer.Structure;
using ForumApp.DataAccess;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.BusinessLayer.Structure;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

//  Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

//  Configure DbContext
builder.Services.AddDbContext<ForumDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

//  Register Business Layer Services (Dependency Injection)
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