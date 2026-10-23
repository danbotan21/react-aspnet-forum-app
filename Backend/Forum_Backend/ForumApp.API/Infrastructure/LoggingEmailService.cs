using ForumApp.BusinessLayer.Interfaces;
using Microsoft.Extensions.Logging;

namespace ForumApp.API.Infrastructure
{
    // Used when no SMTP account is configured (Email:SenderEmail / Email:AppPassword are empty).
    // Instead of sending the email it writes the link or login code to the server console,
    // so the project can be run locally without a Gmail app password.
    public class LoggingEmailService : IEmailAction
    {
        private readonly ILogger<LoggingEmailService> _logger;

        public LoggingEmailService(ILogger<LoggingEmailService> logger)
        {
            _logger = logger;
        }

        public Task SendPasswordResetAsync(string toEmail, string resetLink, CancellationToken ct = default)
        {
            _logger.LogWarning("[email not configured] Password reset for {Email}: {Link}", toEmail, resetLink);
            return Task.CompletedTask;
        }

        public Task SendEmailConfirmationAsync(string toEmail, string confirmLink, CancellationToken ct = default)
        {
            _logger.LogWarning("[email not configured] Confirm account for {Email}: {Link}", toEmail, confirmLink);
            return Task.CompletedTask;
        }

        public Task SendLoginCodeAsync(string toEmail, string code, CancellationToken ct = default)
        {
            _logger.LogWarning("[email not configured] Login code for {Email}: {Code}", toEmail, code);
            return Task.CompletedTask;
        }
    }
}
