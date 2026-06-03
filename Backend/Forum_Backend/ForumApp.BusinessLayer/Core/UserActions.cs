using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Entities.User;
using ForumApp.Domain.Models.User;
using ForumApp.Domain.Models.Responses;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace ForumApp.BusinessLayer.Core
{
    public class UserActions
    {
        protected readonly ForumDbContext _context;
        protected readonly ITokenAction _tokenService;
        protected readonly IConfiguration _configuration;
        protected readonly IEmailAction _emailService;

        public UserActions(ForumDbContext context, ITokenAction tokenService, IConfiguration configuration, IEmailAction emailService)
        {
            _context = context;
            _tokenService = tokenService;
            _configuration = configuration;
            _emailService = emailService;
        }

        // Full mapping — includes email. Used only for authenticated user's own profile.
        private static UserResponseDto MapToDto(UserData user) => new()
        {
            Id = user.Id,
            UserName = user.UserName,
            Email = user.Email,
            Bio = user.Bio,
            AvatarUrl = user.AvatarUrl,
            BannerUrl = user.BannerUrl,
            Karma = user.Karma,
            Role = user.Role,
            ProfileVisibility = user.ProfileVisibility,
            CreatedAt = user.CreatedAt,
            HasPassword = !string.IsNullOrEmpty(user.PasswordHash),
            IsPremium = user.PremiumUntil.HasValue && user.PremiumUntil.Value > DateTime.UtcNow,
            PremiumUntil = user.PremiumUntil.HasValue && user.PremiumUntil.Value > DateTime.UtcNow
                ? user.PremiumUntil
                : null
        };

        // Public mapping — omits email to avoid exposing PII in public endpoints.
        private static UserResponseDto MapToPublicDto(UserData user) => new()
        {
            Id = user.Id,
            UserName = user.UserName,
            Bio = user.Bio,
            AvatarUrl = user.AvatarUrl,
            BannerUrl = user.BannerUrl,
            Karma = user.Karma,
            Role = user.Role,
            ProfileVisibility = user.ProfileVisibility,
            CreatedAt = user.CreatedAt,
            HasPassword = !string.IsNullOrEmpty(user.PasswordHash),
            // Others may see only WHETHER someone is premium (for a badge), not the exact date.
            IsPremium = user.PremiumUntil.HasValue && user.PremiumUntil.Value > DateTime.UtcNow
        };

        private static string HashToken(string token)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        private async Task<string> GenerateUniqueUsernameAsync(string displayName, CancellationToken ct)
        {
            var sanitized = new string(displayName.Where(char.IsLetterOrDigit).ToArray());
            if (sanitized.Length < 6) sanitized = sanitized.PadRight(6, '0');
            if (sanitized.Length > 45) sanitized = sanitized[..45];

            var candidate = sanitized;
            var random = new Random();
            while (await _context.Users.AnyAsync(u => u.UserName == candidate, ct))
                candidate = sanitized + random.Next(1000, 9999);

            return candidate;
        }

        private sealed record GoogleUserInfo(string Sub, string Email, string? Name, string? Picture);

        internal async Task<ActionResponse> RegisterExecution(UserRegisterDto userData, CancellationToken ct = default)
        {
            var email = userData.Email.Trim();
            var userName = userData.UserName.Trim();

            // A confirmed account already owns this email/username.
            if (await _context.Users.AnyAsync(u => u.Email == email, ct))
                return new ActionResponse { IsSuccess = false, Message = "Email or username already in use." };
            if (await _context.Users.AnyAsync(u => u.UserName == userName, ct))
                return new ActionResponse { IsSuccess = false, Message = "Email or username already in use." };

            // IMPORTANT: we do NOT create the account here. We store a pending
            // registration and only materialize the real user once the email link is
            // clicked (see ConfirmEmailExecution). Drop any stale pending rows for the
            // same email/username so a re-submit just refreshes the link.
            var stale = await _context.PendingRegistrations
                .Where(p => p.Email == email || p.UserName == userName)
                .ToListAsync(ct);
            if (stale.Count > 0)
                _context.PendingRegistrations.RemoveRange(stale);

            var confirmToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();

            _context.PendingRegistrations.Add(new PendingRegistrationData
            {
                UserName = userName,
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(userData.Password),
                TokenHash = HashToken(confirmToken),
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync(ct);

            var baseUrl = (_configuration["Email:FrontendBaseUrl"] ?? "http://localhost:5173").TrimEnd('/');
            var confirmLink = $"{baseUrl}/confirm-email?token={confirmToken}";
            try
            {
                await _emailService.SendEmailConfirmationAsync(email, confirmLink, ct);
            }
            catch
            {
                // The pending row exists; the user can re-submit to get a fresh link.
            }

            return new ActionResponse
            {
                IsSuccess = true,
                Message = "Confirmation email sent. Confirm your email to finish creating your account."
            };
        }

        private static string GenerateNumericCode()
        {
            // 6-digit code, zero-padded (000000–999999).
            return RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        }

        internal async Task<LoginResponseDto?> LoginExecution(UserLoginDto userData, CancellationToken ct = default)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userData.Email, ct);
            if (user == null || string.IsNullOrEmpty(user.PasswordHash))
                return null;
            if (!BCrypt.Net.BCrypt.Verify(userData.Password, user.PasswordHash))
                return null;

            // Globally banned users cannot obtain a session.
            if (user.IsBanned)
                throw new InvalidOperationException(
                    user.BanReason is { Length: > 0 } reason
                        ? $"Your account has been banned. Reason: {reason}"
                        : "Your account has been banned.");

            // Account must be confirmed (via the sign-up email) before logging in.
            if (!user.EmailConfirmed)
                return new LoginResponseDto
                {
                    RequiresEmailConfirmation = true,
                    PendingEmail = user.Email
                };

            // Two-step login: password is correct, but we don't issue tokens yet.
            // We email a short code that must be verified via VerifyLoginCode.
            var code = GenerateNumericCode();
            user.LoginCodeHash = HashToken(code);
            user.LoginCodeExpiry = DateTime.UtcNow.AddMinutes(10);
            await _context.SaveChangesAsync(ct);

            try
            {
                await _emailService.SendLoginCodeAsync(user.Email, code, ct);
            }
            catch
            {
                // Surface a soft failure: the client still moves to the code step and
                // the user can request a resend by submitting the login form again.
            }

            return new LoginResponseDto
            {
                RequiresEmailCode = true,
                PendingEmail = user.Email
            };
        }

        internal async Task<LoginResponseDto?> VerifyLoginCodeExecution(string email, string code, CancellationToken ct = default)
        {
            var normalizedEmail = email?.Trim();
            var normalizedCode = code?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedEmail) || string.IsNullOrWhiteSpace(normalizedCode))
                return null;

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, ct);
            if (user == null
                || user.LoginCodeHash == null
                || user.LoginCodeExpiry == null
                || user.LoginCodeExpiry < DateTime.UtcNow
                || user.LoginCodeHash != HashToken(normalizedCode))
            {
                return null;
            }

            if (user.IsBanned)
                throw new InvalidOperationException(
                    user.BanReason is { Length: > 0 } reason
                        ? $"Your account has been banned. Reason: {reason}"
                        : "Your account has been banned.");

            var accessToken = _tokenService.GenerateToken(user.Id, user.UserName, user.Role);
            var refreshToken = _tokenService.GenerateRefreshToken();

            var expiryDays = int.Parse(_configuration["JwtSettings:RefreshTokenExpiryDays"]!);
            user.RefreshToken = HashToken(refreshToken);
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(expiryDays);
            // Consume the login code so it can't be reused.
            user.LoginCodeHash = null;
            user.LoginCodeExpiry = null;
            await _context.SaveChangesAsync(ct);

            return new LoginResponseDto
            {
                Token = accessToken,
                RefreshToken = refreshToken,
                User = MapToDto(user)
            };
        }

        internal async Task<ActionResponse> ConfirmEmailExecution(string token, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(token))
                return new ActionResponse { IsSuccess = false, Message = "Invalid or expired confirmation link." };

            var tokenHash = HashToken(token.Trim());

            // Primary path: a pending registration → NOW we create the real account.
            var pending = await _context.PendingRegistrations
                .FirstOrDefaultAsync(p => p.TokenHash == tokenHash, ct);

            if (pending != null)
            {
                if (pending.ExpiresAt < DateTime.UtcNow)
                {
                    _context.PendingRegistrations.Remove(pending);
                    await _context.SaveChangesAsync(ct);
                    return new ActionResponse { IsSuccess = false, Message = "This confirmation link has expired. Please sign up again." };
                }

                // Guard against the email/username being taken between sign-up and confirm.
                if (await _context.Users.AnyAsync(u => u.Email == pending.Email || u.UserName == pending.UserName, ct))
                {
                    _context.PendingRegistrations.Remove(pending);
                    await _context.SaveChangesAsync(ct);
                    return new ActionResponse { IsSuccess = false, Message = "This email or username is already in use." };
                }

                _context.Users.Add(new UserData
                {
                    UserName = pending.UserName,
                    Email = pending.Email,
                    PasswordHash = pending.PasswordHash,
                    Role = "User",
                    ProfileVisibility = "Public",
                    Theme = "Light",
                    Language = "en",
                    CreatedAt = DateTime.UtcNow,
                    EmailConfirmed = true
                });
                _context.PendingRegistrations.Remove(pending);
                await _context.SaveChangesAsync(ct);

                return new ActionResponse { IsSuccess = true, Message = "Your account has been created. You can now log in." };
            }

            // Fallback: a legacy unconfirmed account (created before pending-registration flow).
            var user = await _context.Users.FirstOrDefaultAsync(u => u.EmailConfirmTokenHash == tokenHash, ct);
            if (user != null
                && user.EmailConfirmTokenExpiry != null
                && user.EmailConfirmTokenExpiry >= DateTime.UtcNow)
            {
                user.EmailConfirmed = true;
                user.EmailConfirmTokenHash = null;
                user.EmailConfirmTokenExpiry = null;
                await _context.SaveChangesAsync(ct);
                return new ActionResponse { IsSuccess = true, Message = "Your email has been confirmed. You can now log in." };
            }

            return new ActionResponse { IsSuccess = false, Message = "Invalid or expired confirmation link." };
        }

        internal async Task<ActionResponse> ResendConfirmationExecution(string email, CancellationToken ct = default)
        {
            // Neutral response (no account enumeration).
            var neutral = new ActionResponse
            {
                IsSuccess = true,
                Message = "If an unconfirmed account exists for that email, a new confirmation link has been sent."
            };

            var normalizedEmail = email?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedEmail)) return neutral;

            var pending = await _context.PendingRegistrations
                .FirstOrDefaultAsync(p => p.Email == normalizedEmail, ct);
            if (pending == null) return neutral;

            var confirmToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
            pending.TokenHash = HashToken(confirmToken);
            pending.ExpiresAt = DateTime.UtcNow.AddHours(24);
            await _context.SaveChangesAsync(ct);

            var baseUrl = (_configuration["Email:FrontendBaseUrl"] ?? "http://localhost:5173").TrimEnd('/');
            var confirmLink = $"{baseUrl}/confirm-email?token={confirmToken}";
            try
            {
                await _emailService.SendEmailConfirmationAsync(pending.Email, confirmLink, ct);
            }
            catch
            {
                // Keep the neutral response.
            }

            return neutral;
        }

        internal async Task<LoginResponseDto?> RefreshTokenExecution(string refreshToken, CancellationToken ct = default)
        {
            var tokenHash = HashToken(refreshToken);
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.RefreshToken == tokenHash, ct);

            if (user == null || user.RefreshTokenExpiry < DateTime.UtcNow)
                return null;

            // A user banned mid-session loses access at the next refresh.
            if (user.IsBanned)
                return null;

            var newAccessToken = _tokenService.GenerateToken(user.Id, user.UserName, user.Role);
            var newRefreshToken = _tokenService.GenerateRefreshToken();

            var expiryDays = int.Parse(_configuration["JwtSettings:RefreshTokenExpiryDays"]!);
            user.RefreshToken = HashToken(newRefreshToken);
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(expiryDays);
            await _context.SaveChangesAsync(ct);

            return new LoginResponseDto
            {
                Token = newAccessToken,
                RefreshToken = newRefreshToken,
                User = MapToDto(user)
            };
        }

        internal async Task<LoginResponseDto?> GoogleLoginExecution(string accessToken, CancellationToken ct = default)
        {
            GoogleUserInfo? googleUser;
            try
            {
                using var http = new HttpClient();
                http.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", accessToken);
                var response = await http.GetAsync(
                    "https://www.googleapis.com/oauth2/v3/userinfo", ct);
                if (!response.IsSuccessStatusCode) return null;

                var json = await response.Content.ReadAsStringAsync(ct);
                googleUser = JsonSerializer.Deserialize<GoogleUserInfo>(json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (googleUser == null || string.IsNullOrEmpty(googleUser.Sub)) return null;
            }
            catch
            {
                return null;
            }

            var user = await _context.Users.FirstOrDefaultAsync(
                u => u.GoogleId == googleUser.Sub || u.Email == googleUser.Email, ct);

            if (user == null)
            {
                var username = await GenerateUniqueUsernameAsync(googleUser.Name ?? googleUser.Email, ct);
                user = new UserData
                {
                    UserName = username,
                    Email = googleUser.Email,
                    GoogleId = googleUser.Sub,
                    AvatarUrl = googleUser.Picture,
                    Role = "User",
                    ProfileVisibility = "Public",
                    Theme = "Light",
                    Language = "en",
                    CreatedAt = DateTime.UtcNow,
                    EmailConfirmed = true // Google has already verified the address
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync(ct);
            }
            else if (user.GoogleId == null)
            {
                user.GoogleId = googleUser.Sub;
            }

            // Signing in through Google proves email ownership → mark confirmed.
            user.EmailConfirmed = true;

            // Globally banned users cannot obtain a session.
            if (user.IsBanned)
                throw new InvalidOperationException(
                    user.BanReason is { Length: > 0 } reason
                        ? $"Your account has been banned. Reason: {reason}"
                        : "Your account has been banned.");

            var newAccessToken = _tokenService.GenerateToken(user.Id, user.UserName, user.Role);
            var refreshToken = _tokenService.GenerateRefreshToken();

            var expiryDays = int.Parse(_configuration["JwtSettings:RefreshTokenExpiryDays"]!);
            user.RefreshToken = HashToken(refreshToken);
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(expiryDays);
            await _context.SaveChangesAsync(ct);

            return new LoginResponseDto
            {
                Token = newAccessToken,
                RefreshToken = refreshToken,
                User = MapToDto(user)
            };
        }

        internal async Task<UserResponseDto?> GetProfileExecution(int userId, CancellationToken ct = default)
        {
            var user = await _context.Users.FindAsync(new object[] { userId }, ct);
            return user == null ? null : MapToDto(user);
        }

        internal async Task<UserResponseDto?> UpdateProfileExecution(int userId, UserUpdateDto userData, CancellationToken ct = default)
        {
            var user = await _context.Users.FindAsync(new object[] { userId }, ct);
            if (user == null) return null;

            if (userData.UserName != null)
            {
                var normalizedUserName = userData.UserName.Trim();
                if (string.IsNullOrWhiteSpace(normalizedUserName))
                    throw new InvalidOperationException("Username cannot be empty.");

                if (normalizedUserName.Length < 6 || normalizedUserName.Length > 50)
                    throw new InvalidOperationException("Username must have between 6 and 50 characters.");

                var usernameTaken = await _context.Users
                    .AnyAsync(u => u.Id != userId && u.UserName.ToLower() == normalizedUserName.ToLower(), ct);
                if (usernameTaken)
                    throw new InvalidOperationException("Username is already in use.");

                user.UserName = normalizedUserName;
            }

            if (userData.Email != null)
            {
                var normalizedEmail = userData.Email.Trim().ToLower();
                if (!string.Equals(user.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase))
                {
                    if (string.IsNullOrEmpty(user.PasswordHash))
                        throw new InvalidOperationException("Google accounts cannot change email here.");

                    if (string.IsNullOrEmpty(userData.CurrentPassword))
                        throw new InvalidOperationException("Current password is required to change email.");

                    if (!BCrypt.Net.BCrypt.Verify(userData.CurrentPassword, user.PasswordHash))
                        throw new InvalidOperationException("Current password is incorrect.");

                    var emailTaken = await _context.Users
                        .AnyAsync(u => u.Id != userId && u.Email.ToLower() == normalizedEmail, ct);
                    if (emailTaken)
                        throw new InvalidOperationException("Email is already in use.");

                    user.Email = normalizedEmail;
                }
            }

            if (userData.Bio != null)
            {
                var normalizedBio = userData.Bio.Trim();
                user.Bio = string.IsNullOrWhiteSpace(normalizedBio) ? null : normalizedBio;
            }

            if (userData.AvatarUrl != null)
            {
                var normalizedAvatarUrl = userData.AvatarUrl.Trim();
                user.AvatarUrl = string.IsNullOrWhiteSpace(normalizedAvatarUrl) ? null : normalizedAvatarUrl;
            }

            if (userData.BannerUrl != null)
            {
                var normalizedBannerUrl = userData.BannerUrl.Trim();
                user.BannerUrl = string.IsNullOrWhiteSpace(normalizedBannerUrl) ? null : normalizedBannerUrl;
            }

            if (!string.IsNullOrWhiteSpace(userData.Theme))
                user.Theme = userData.Theme.Trim();
            if (!string.IsNullOrWhiteSpace(userData.Language))
                user.Language = userData.Language.Trim();
            if (!string.IsNullOrWhiteSpace(userData.ProfileVisibility))
                user.ProfileVisibility = userData.ProfileVisibility.Trim();

            await _context.SaveChangesAsync(ct);
            return MapToDto(user);
        }

        internal async Task<ActionResponse> ChangePasswordExecution(int userId, ChangePasswordDto passwordData, CancellationToken ct = default)
        {
            var user = await _context.Users.FindAsync(new object[] { userId }, ct);
            if (user == null)
                return new ActionResponse { IsSuccess = false, Message = "User not found." };

            if (string.IsNullOrEmpty(user.PasswordHash))
                return new ActionResponse { IsSuccess = false, Message = "Google accounts cannot change password here. Use Google settings instead." };

            if (!BCrypt.Net.BCrypt.Verify(passwordData.CurrentPassword, user.PasswordHash))
                return new ActionResponse { IsSuccess = false, Message = "Current password is incorrect." };

            if (passwordData.CurrentPassword == passwordData.NewPassword)
                return new ActionResponse { IsSuccess = false, Message = "New password must be different from current password." };

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(passwordData.NewPassword);
            await _context.SaveChangesAsync(ct);

            return new ActionResponse { IsSuccess = true, Message = "Password changed successfully." };
        }

        internal async Task<ActionResponse> RequestPasswordResetExecution(string email, CancellationToken ct = default)
        {
            // Neutral response on purpose: we must NOT reveal whether an email is registered,
            // otherwise this endpoint becomes an account-enumeration oracle.
            var neutral = new ActionResponse
            {
                IsSuccess = true,
                Message = "If an account exists for that email, a reset link has been sent."
            };

            var normalizedEmail = email?.Trim();
            if (string.IsNullOrWhiteSpace(normalizedEmail)) return neutral;

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == normalizedEmail, ct);

            // Only accounts created with a password get a reset email. Google-only accounts
            // (no PasswordHash) are left untouched — they sign in via Google.
            if (user == null || string.IsNullOrEmpty(user.PasswordHash))
                return neutral;

            // Generate a cryptographically-random, single-use token. Only its hash is stored.
            var rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
            user.PasswordResetTokenHash = HashToken(rawToken);
            user.PasswordResetTokenExpiry = DateTime.UtcNow.AddMinutes(30);
            await _context.SaveChangesAsync(ct);

            var baseUrl = (_configuration["Email:FrontendBaseUrl"] ?? "http://localhost:5173").TrimEnd('/');
            var resetLink = $"{baseUrl}/reset-password?token={rawToken}";

            try
            {
                await _emailService.SendPasswordResetAsync(user.Email, resetLink, ct);
            }
            catch
            {
                // Don't leak delivery failures to the caller; the neutral response stands.
            }

            return neutral;
        }

        internal async Task<ActionResponse> ResetPasswordExecution(ResetPasswordDto data, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(data.Token))
                return new ActionResponse { IsSuccess = false, Message = "Invalid or expired reset link." };

            var tokenHash = HashToken(data.Token.Trim());
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.PasswordResetTokenHash == tokenHash, ct);

            if (user == null
                || user.PasswordResetTokenExpiry == null
                || user.PasswordResetTokenExpiry < DateTime.UtcNow)
            {
                return new ActionResponse { IsSuccess = false, Message = "Invalid or expired reset link." };
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(data.NewPassword);
            // Consume the token and invalidate existing sessions for safety.
            user.PasswordResetTokenHash = null;
            user.PasswordResetTokenExpiry = null;
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            await _context.SaveChangesAsync(ct);

            return new ActionResponse { IsSuccess = true, Message = "Your password has been reset. You can now log in." };
        }

        internal async Task<ActionResponse> DeleteAccountExecution(int userId, DeleteAccountDto dto, CancellationToken ct = default)
        {
            var user = await _context.Users.FindAsync(new object[] { userId }, ct);
            if (user == null)
                return new ActionResponse { IsSuccess = false, Message = "User not found." };

            if (!string.Equals(user.Email, dto.Email, StringComparison.OrdinalIgnoreCase))
                return new ActionResponse { IsSuccess = false, Message = "Invalid email or password." };

            if (!string.IsNullOrEmpty(user.PasswordHash) &&
                !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return new ActionResponse { IsSuccess = false, Message = "Invalid email or password." };

            var memberships = await _context.CommunityMembers
                .Where(m => m.UserId == userId)
                .ToListAsync(ct);

            var communityIds = memberships.Select(m => m.CommunityId).Distinct().ToList();
            if (communityIds.Count > 0)
            {
                var communities = await _context.Communities
                    .Where(c => communityIds.Contains(c.Id))
                    .ToListAsync(ct);

                foreach (var community in communities)
                {
                    if (community.MembersCount > 0)
                        community.MembersCount--;
                }
            }

            _context.CommunityMembers.RemoveRange(memberships);

            var votes = await _context.Votes.Where(v => v.AuthorId == userId).ToListAsync(ct);
            _context.Votes.RemoveRange(votes);

            var savedItems = await _context.SavedItems.Where(s => s.AuthorId == userId).ToListAsync(ct);
            _context.SavedItems.RemoveRange(savedItems);

            var notifications = await _context.Notifications.Where(n => n.RecipientId == userId).ToListAsync(ct);
            _context.Notifications.RemoveRange(notifications);

            var drafts = await _context.Drafts.Where(d => d.AuthorId == userId).ToListAsync(ct);
            _context.Drafts.RemoveRange(drafts);

            user.UserName = "[deleted]";
            user.Email = $"deleted_{userId}@deleted.local";
            user.PasswordHash = "";
            user.Bio = null;
            user.AvatarUrl = null;
            user.GoogleId = null;
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;

            await _context.SaveChangesAsync(ct);
            return new ActionResponse { IsSuccess = true, Message = "Account deleted." };
        }

        internal async Task<IReadOnlyList<UserResponseDto>> GetAllUsersExecution(CancellationToken ct = default)
        {
            var users = await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync(ct);

            return users.Select(MapToPublicDto).ToList();
        }

        internal async Task<UserResponseDto?> GetUserByIdExecution(int userId, CancellationToken ct = default)
        {
            var user = await _context.Users.FindAsync(new object[] { userId }, ct);
            return user == null ? null : MapToPublicDto(user);
        }

        internal async Task<UserResponseDto?> GetUserByUsernameExecution(string username, CancellationToken ct = default)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserName == username, ct);
            return user == null ? null : MapToPublicDto(user);
        }

        internal async Task<IReadOnlyList<UserResponseDto>> SearchUsersExecution(string searchTerm, CancellationToken ct = default)
        {
            var users = await _context.Users
                .Where(u => u.UserName.Contains(searchTerm))
                .OrderBy(u => u.UserName)
                .ToListAsync(ct);

            return users.Select(MapToPublicDto).ToList();
        }

        internal async Task LogoutExecution(string refreshToken, CancellationToken ct = default)
        {
            var tokenHash = HashToken(refreshToken);
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.RefreshToken == tokenHash, ct);
            if (user != null)
            {
                user.RefreshToken = null;
                user.RefreshTokenExpiry = null;
                await _context.SaveChangesAsync(ct);
            }
        }
    }
}
