namespace ForumApp.BusinessLayer.Interfaces
{
    public interface IEmailAction
    {
        // Sends the "reset your password" email containing the one-time reset link.
        Task SendPasswordResetAsync(string toEmail, string resetLink, CancellationToken ct = default);

        // Sends the "confirm your account" email containing the confirmation link.
        Task SendEmailConfirmationAsync(string toEmail, string confirmLink, CancellationToken ct = default);

        // Sends the short numeric two-step login code.
        Task SendLoginCodeAsync(string toEmail, string code, CancellationToken ct = default);
    }
}
