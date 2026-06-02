using ForumApp.API.Hubs;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.API.Infrastructure;
using ForumApp.BusinessLayer.Structure;
using ForumApp.DataAccess;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

//  Add services
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        // DateTimes are stored as UTC; emit them with a 'Z' so the browser parses them
        // as UTC instead of local time (otherwise "x minutes ago" is off by the offset).
        o.JsonSerializerOptions.Converters.Add(new ForumApp.API.UtcDateTimeConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSignalR();

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
builder.Services.AddScoped<IHubNotifierAction, SignalRHubNotifier>();
builder.Services.AddScoped<INotificationAction, NotificationActionExecution>();
builder.Services.AddScoped<IPostAction, PostActionExecution>();
builder.Services.AddScoped<ICommunityAction, CommunityActionExecution>();
builder.Services.AddScoped<ICommentAction, CommentActionExecution>();
builder.Services.AddScoped<IVoteAction, VoteActionExecution>();
builder.Services.AddScoped<IDraftAction, DraftActionExecution>();
builder.Services.AddScoped<ISavedItemAction, SavedItemActionExecution>();
builder.Services.AddScoped<IContactAction, ContactActionExecution>();
builder.Services.AddScoped<IReportAction, ReportActionExecution>();
builder.Services.AddScoped<IAdminAction, AdminActionExecution>();
builder.Services.AddScoped<ISubscriptionAction, SubscriptionActionExecution>();

//  Ads: the business action lives in the BusinessLayer (logic only); the external HTTP
//  provider is infrastructure and lives in the API layer, behind IAdProviderAction —
//  same split as IImageStorageAction/LocalImageStorageService and the SignalR notifier.
builder.Services.AddScoped<IAdAction, AdActionExecution>();
builder.Services.AddHttpClient<IAdProviderAction, DummyJsonAdProvider>(client =>
{
    client.BaseAddress = new Uri("https://dummyjson.com/");
    client.Timeout = TimeSpan.FromSeconds(10);
});

//  Auth services
builder.Services.AddScoped<ITokenAction, TokenActionExecution>();
builder.Services.AddScoped<IUserAction, UserActionExecution>();
builder.Services.AddScoped<IImageAction, ImageActionExecution>();
builder.Services.AddScoped<IImageStorageAction, LocalImageStorageService>();

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

        // SignalR passes the JWT as a query param for WebSocket connections
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
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

//  Map SignalR hub
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();

namespace ForumApp.API
{
    // Serializes DateTime as UTC ISO-8601 with a trailing 'Z'. Also applies to DateTime?.
    public sealed class UtcDateTimeConverter : System.Text.Json.Serialization.JsonConverter<DateTime>
    {
        public override DateTime Read(ref System.Text.Json.Utf8JsonReader reader, Type typeToConvert, System.Text.Json.JsonSerializerOptions options)
            => reader.GetDateTime();

        public override void Write(System.Text.Json.Utf8JsonWriter writer, DateTime value, System.Text.Json.JsonSerializerOptions options)
        {
            var utc = value.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
                : value.ToUniversalTime();
            writer.WriteStringValue(utc.ToString("yyyy-MM-ddTHH:mm:ss.fff'Z'"));
        }
    }
}
