using Microsoft.Extensions.Configuration;

namespace ForumApp.BusinessLayer.Tests.TestSupport;

public static class TestConfiguration
{
    public static IConfiguration Create()
        => new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Email:FrontendBaseUrl"] = "http://localhost:5173",
                ["JwtSettings:RefreshTokenExpiryDays"] = "7"
            })
            .Build();
}
