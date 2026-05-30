using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Entities.User;
using ForumApp.Domain.Models.User;
using ForumApp.Domain.Models.Responses;
using System.Net.Http.Headers;
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

        public UserActions(ForumDbContext context, ITokenAction tokenService, IConfiguration configuration)
        {
            _context = context;
            _tokenService = tokenService;
            _configuration = configuration;
        }

        private static UserResponseDto MapToDto(UserData user) => new()
        {
            ID = user.ID,
            UserName = user.UserName,
            Email = user.Email,
            Bio = user.Bio,
            AvatarUrl = user.AvatarUrl,
            Karma = user.Karma,
            Role = user.Role,
            CreatedAt = user.CreatedAt,
            HasPassword = !string.IsNullOrEmpty(user.PasswordHash)
        };

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

        internal async Task<UserResponseDto?> RegisterExecution(UserRegisterDto userData, CancellationToken ct = default)
        {
            if (await _context.Users.AnyAsync(u => u.Email == userData.Email, ct))
                return null;

            if (await _context.Users.AnyAsync(u => u.UserName == userData.UserName, ct))
                return null;

            var user = new UserData
            {
                UserName = userData.UserName,
                Email = userData.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(userData.Password),
                Role = "User",
                ProfileVisibility = "Public",
                Theme = "Light",
                Language = "en",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync(ct);

            return MapToDto(user);
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

            var accessToken = _tokenService.GenerateToken(user.ID, user.UserName, user.Role);
            var refreshToken = _tokenService.GenerateRefreshToken();

            var expiryDays = int.Parse(_configuration["JwtSettings:RefreshTokenExpiryDays"]!);
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(expiryDays);
            await _context.SaveChangesAsync(ct);

            return new LoginResponseDto
            {
                Token = accessToken,
                RefreshToken = refreshToken,
                User = MapToDto(user)
            };
        }

        internal async Task<LoginResponseDto?> RefreshTokenExecution(string refreshToken, CancellationToken ct = default)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken, ct);

            if (user == null || user.RefreshTokenExpiry < DateTime.UtcNow)
                return null;

            // A user banned mid-session loses access at the next refresh.
            if (user.IsBanned)
                return null;

            var newAccessToken = _tokenService.GenerateToken(user.ID, user.UserName, user.Role);
            var newRefreshToken = _tokenService.GenerateRefreshToken();

            var expiryDays = int.Parse(_configuration["JwtSettings:RefreshTokenExpiryDays"]!);
            user.RefreshToken = newRefreshToken;
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
                    CreatedAt = DateTime.UtcNow
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync(ct);
            }
            else if (user.GoogleId == null)
            {
                user.GoogleId = googleUser.Sub;
            }

            // Globally banned users cannot obtain a session.
            if (user.IsBanned)
                throw new InvalidOperationException(
                    user.BanReason is { Length: > 0 } reason
                        ? $"Your account has been banned. Reason: {reason}"
                        : "Your account has been banned.");

            var newAccessToken = _tokenService.GenerateToken(user.ID, user.UserName, user.Role);
            var refreshToken = _tokenService.GenerateRefreshToken();

            var expiryDays = int.Parse(_configuration["JwtSettings:RefreshTokenExpiryDays"]!);
            user.RefreshToken = refreshToken;
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
                    .AnyAsync(u => u.ID != userId && u.UserName.ToLower() == normalizedUserName.ToLower(), ct);
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
                        .AnyAsync(u => u.ID != userId && u.Email.ToLower() == normalizedEmail, ct);
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

            return users.Select(MapToDto).ToList();
        }

        internal async Task<UserResponseDto?> GetUserByIdExecution(int userId, CancellationToken ct = default)
        {
            var user = await _context.Users.FindAsync(new object[] { userId }, ct);
            return user == null ? null : MapToDto(user);
        }

        internal async Task<UserResponseDto?> GetUserByUsernameExecution(string username, CancellationToken ct = default)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserName == username, ct);
            return user == null ? null : MapToDto(user);
        }

        internal async Task<IReadOnlyList<UserResponseDto>> SearchUsersExecution(string searchTerm, CancellationToken ct = default)
        {
            var users = await _context.Users
                .Where(u => u.UserName.Contains(searchTerm))
                .OrderBy(u => u.UserName)
                .ToListAsync(ct);

            return users.Select(MapToDto).ToList();
        }
    }
}
