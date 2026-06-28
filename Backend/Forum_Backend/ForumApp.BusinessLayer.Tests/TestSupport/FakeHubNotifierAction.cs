using ForumApp.BusinessLayer.Interfaces;

namespace ForumApp.BusinessLayer.Tests.TestSupport;

public sealed class FakeHubNotifierAction : IHubNotifierAction
{
    public List<HubCall> Sent { get; } = new();

    public Task SendToUserAsync(int userId, string method, object payload, CancellationToken ct = default)
    {
        Sent.Add(new HubCall(userId, method, payload));
        return Task.CompletedTask;
    }
}

public sealed record HubCall(int UserId, string Method, object Payload);
