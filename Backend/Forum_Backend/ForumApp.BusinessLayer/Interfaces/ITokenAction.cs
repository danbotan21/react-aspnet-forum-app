namespace ForumApp.BusinessLayer.Interfaces
{
    public interface ITokenAction
    {
        string GenerateToken(int userId, string userName, string role);
        string GenerateRefreshToken(); // string random criptografic, salvat in DB
    }
}
