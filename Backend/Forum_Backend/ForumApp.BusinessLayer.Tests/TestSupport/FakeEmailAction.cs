using ForumApp.BusinessLayer.Interfaces;

namespace ForumApp.BusinessLayer.Tests.TestSupport;

public sealed class FakeEmailAction : IEmailAction
{
    public List<(string Email, string Link)> ConfirmationEmails { get; } = new();
    public List<(string Email, string Link)> PasswordResetEmails { get; } = new();
    public List<(string Email, string Code)> LoginCodes { get; } = new();

    public Task SendPasswordResetAsync(string toEmail, string resetLink, CancellationToken ct = default)
    {
        PasswordResetEmails.Add((toEmail, resetLink));
        return Task.CompletedTask;
    }

    public Task SendEmailConfirmationAsync(string toEmail, string confirmLink, CancellationToken ct = default)
    {
        ConfirmationEmails.Add((toEmail, confirmLink));
        return Task.CompletedTask;
    }

    public Task SendLoginCodeAsync(string toEmail, string code, CancellationToken ct = default)
    {
        LoginCodes.Add((toEmail, code));
        return Task.CompletedTask;
    }
}
