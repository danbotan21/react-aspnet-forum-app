using System.Net;
using System.Net.Mail;
using ForumApp.BusinessLayer.Interfaces;
using Microsoft.Extensions.Configuration;

namespace ForumApp.BusinessLayer.Core
{
    // Sends real email through an SMTP server (Gmail by default). Credentials live in
    // configuration (appsettings.Development.json / user-secrets), never in source.
    public class SmtpEmailService : IEmailAction
    {
        private readonly IConfiguration _configuration;

        public SmtpEmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public Task SendPasswordResetAsync(string toEmail, string resetLink, CancellationToken ct = default)
            => SendAsync(toEmail, "Reset your password",
                BuildActionEmail(
                    "Reset your password",
                    "We received a request to reset the password for your account. Click the button below to choose a new password. This link expires in 30 minutes and can be used only once.",
                    "Reset password",
                    resetLink,
                    "If you did not request a password reset, you can safely ignore this email."),
                ct);

        public Task SendEmailConfirmationAsync(string toEmail, string confirmLink, CancellationToken ct = default)
            => SendAsync(toEmail, "Confirm your account",
                BuildActionEmail(
                    "Confirm your account",
                    "Thanks for signing up! Please confirm your email address to activate your account. This link expires in 24 hours.",
                    "Confirm my account",
                    confirmLink,
                    "If you did not create this account, you can safely ignore this email."),
                ct);

        public Task SendLoginCodeAsync(string toEmail, string code, CancellationToken ct = default)
            => SendAsync(toEmail, $"Your login code: {code}",
                BuildCodeEmail(code),
                ct);

        private async Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken ct)
        {
            var section = _configuration.GetSection("Email");
            var host = section["SmtpHost"] ?? "smtp.gmail.com";
            var port = int.TryParse(section["SmtpPort"], out var p) ? p : 587;
            var senderEmail = section["SenderEmail"];
            var senderName = section["SenderName"] ?? "Forum";
            // App passwords are shown with spaces; strip them so login always works.
            var appPassword = section["AppPassword"]?.Replace(" ", "");

            if (string.IsNullOrWhiteSpace(senderEmail) || string.IsNullOrWhiteSpace(appPassword))
                throw new InvalidOperationException(
                    "Email is not configured. Set Email:SenderEmail and Email:AppPassword.");

            using var message = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true,
            };
            message.To.Add(new MailAddress(toEmail));

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = true,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(senderEmail, appPassword),
            };

            await client.SendMailAsync(message, ct);
        }

        private string BuildActionEmail(string heading, string intro, string buttonText, string link, string footer)
        {
            var senderName = _configuration["Email:SenderName"] ?? "Forum";
            return $@"
<div style=""font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #173464;"">
  <h2 style=""color: #0e4ad2;"">{heading}</h2>
  <p>{intro}</p>
  <p style=""text-align: center; margin: 28px 0;"">
    <a href=""{link}""
       style=""background: linear-gradient(135deg, #0e4ad2 0%, #1a68ff 100%); color: #ffffff; text-decoration: none; padding: 12px 26px; border-radius: 999px; font-weight: bold; display: inline-block;"">
      {buttonText}
    </a>
  </p>
  <p style=""font-size: 13px; color: #66789a;"">If the button does not work, copy this link into your browser:</p>
  <p style=""font-size: 13px; word-break: break-all;""><a href=""{link}"">{link}</a></p>
  <hr style=""border: none; border-top: 1px solid #e1e9f5; margin: 24px 0;"" />
  <p style=""font-size: 12px; color: #97a6bf;"">{footer} — {senderName}</p>
</div>";
        }

        private string BuildCodeEmail(string code)
        {
            var senderName = _configuration["Email:SenderName"] ?? "Forum";
            return $@"
<div style=""font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #173464;"">
  <h2 style=""color: #0e4ad2;"">Your login code</h2>
  <p>Use this code to finish signing in. It expires in 10 minutes.</p>
  <p style=""text-align: center; margin: 28px 0;"">
    <span style=""display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0e4ad2; background: #eaf1ff; padding: 14px 24px; border-radius: 12px;"">{code}</span>
  </p>
  <hr style=""border: none; border-top: 1px solid #e1e9f5; margin: 24px 0;"" />
  <p style=""font-size: 12px; color: #97a6bf;"">If you did not try to log in, someone may have your password — consider resetting it. — {senderName}</p>
</div>";
        }
    }
}
