namespace ForumApp.BusinessLayer.Interfaces
{
    public interface IHubNotifier
    {
        Task SendToUserAsync(int userId, string method, object payload, CancellationToken ct = default);
    }
}
