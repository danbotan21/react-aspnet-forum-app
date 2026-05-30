namespace ForumApp.BusinessLayer.Interfaces
{
    public interface IHubNotifierAction
    {
        Task SendToUserAsync(int userId, string method, object payload, CancellationToken ct = default);
    }
}
