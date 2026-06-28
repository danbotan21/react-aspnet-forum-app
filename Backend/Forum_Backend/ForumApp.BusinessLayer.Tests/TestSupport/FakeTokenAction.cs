using ForumApp.BusinessLayer.Interfaces;

namespace ForumApp.BusinessLayer.Tests.TestSupport;

public sealed class FakeTokenAction : ITokenAction
{
    private int _refreshTokenSequence;

    public string GenerateToken(int userId, string userName, string role)
        => $"access-token-{userId}-{userName}-{role}";

    public string GenerateRefreshToken()
        => $"refresh-token-{++_refreshTokenSequence}";
}
