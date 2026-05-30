using ForumApp.BusinessLayer.Core;
using ForumApp.BusinessLayer.Interfaces;
using Microsoft.Extensions.Configuration;

namespace ForumApp.BusinessLayer.Structure
{
    public class TokenActionExecution : TokenActions, ITokenAction
    {
        public TokenActionExecution(IConfiguration configuration)
            : base(configuration) { }

        public string GenerateToken(int userId, string userName, string role)
            => GenerateTokenExecution(userId, userName, role);

        public string GenerateRefreshToken()
            => GenerateRefreshTokenExecution();
    }
}
