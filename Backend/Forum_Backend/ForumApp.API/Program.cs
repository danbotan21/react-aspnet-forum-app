using ForumApp.BusinessLayer.Interfaces;
using ForumApp.BusinessLayer.Structure;
using ForumApp.DataAccess;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

//  Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

//  Swagger cu suport Bearer JWT
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ForumApp API", Version = "v1" });

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

//  Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",   // Vite dev server
                "https://localhost:5173"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

//  Configure DbContext
builder.Services.AddDbContext<ForumDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

//  Business layer services
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
builder.Services.AddScoped<IImageStorageActions, LocalImageStorageService>();

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

//  Seed mock data is DISABLED - use SQL script instead to avoid FK constraint issues
// See: SeedMockDataComplete.sql for manual seeding

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

//  Map controllers
app.MapControllers();

app.Run();
