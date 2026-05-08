using ForumApp.BusinessLayer.Interfaces;
using ForumApp.BusinessLayer.Structure;
using ForumApp.DataAccess;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

//  Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ForumApp API", Version = "v1" });

    // Definirea schemei de securitate JWT
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = @"JWT Authorization header using the Bearer scheme.
                      Introdu 'Bearer' [spațiu] și apoi token-ul tău.
                      Exemplu: 'Bearer eyJhbGciOi...'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

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

//  Auth services
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IUserActions, UserService>();

//  JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["Secret"]!))
        };
    });

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

//  Map controllers
app.MapControllers();

app.Run();