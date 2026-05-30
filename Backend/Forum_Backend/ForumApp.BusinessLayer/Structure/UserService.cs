using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Entities.User;
using ForumApp.Domain.Models.User;
using ForumApp.Domain.Models.Responses;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using ForumApp.Domain.Entities.Community;

namespace ForumApp.BusinessLayer.Structure
{
    public class UserService : IUserActions
    {
        private readonly ForumDbContext _context;
        private readonly ITokenService _tokenService;
        private readonly IConfiguration _configuration;

        public UserService(ForumDbContext context, ITokenService tokenService, IConfiguration configuration)
        {
            _context = context;
            _tokenService = tokenService;
            _configuration = configuration;
        }

        public async Task<UserResponseDto?> RegisterAsync(UserRegisterDto userData, CancellationToken ct = default)
        {
            // Verifică duplicate
            if (await _context.Users.AnyAsync(u => u.Email == userData.Email, ct))
                return null; // Email deja folosit

            if (await _context.Users.AnyAsync(u => u.UserName == userData.UserName, ct))
                return null; // Username deja luat

            var user = new UserData
            {
                UserName = userData.UserName,
                Email = userData.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(userData.Password),
                Role = "User", // rol implicit
                ProfileVisibility = "Public",
                Theme = "Light",
                Language = "en",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync(ct);

            return MapToDto(user);
        }

        public async Task<LoginResponseDto?> LoginAsync(UserLoginDto userData, CancellationToken ct = default)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userData.Email, ct);
            if (user == null || !BCrypt.Net.BCrypt.Verify(userData.Password, user.PasswordHash))
                return null;

            // Generam ambele tokene
            var accessToken = _tokenService.GenerateToken(user.ID, user.UserName, user.Role);
            var refreshToken = _tokenService.GenerateRefreshToken();

            // Salvam refresh token-ul in DB (React il va trimite inapoi la /refresh)
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

        public async Task<LoginResponseDto?> RefreshTokenAsync(string refreshToken, CancellationToken ct = default)
        {
            // Gasim userul care are exact acest refresh token in DB
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken, ct);

            // Validare: tokenul exista si nu a expirat
            if (user == null || user.RefreshTokenExpiry < DateTime.UtcNow)
                return null; // 401 Unauthorized

            // Rotatie: generam tokene NOI si invalidam cel vechi
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

        public async Task<UserResponseDto?> GetProfileAsync(int userId, CancellationToken ct = default)
        {
            var user = await _context.Users.FindAsync(new object[] { userId }, ct);
            return user == null ? null : MapToDto(user);
        }

        public async Task<UserResponseDto?> UpdateProfileAsync(int userId, UserUpdateDto userData, CancellationToken ct = default)
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

        public async Task<ActionResponse> ChangePasswordAsync(int userId, ChangePasswordDto passwordData, CancellationToken ct = default)
        {
            var user = await _context.Users.FindAsync(new object[] { userId }, ct);
            if (user == null)
                return new ActionResponse { IsSuccess = false, Message = "User not found." };

            if (!BCrypt.Net.BCrypt.Verify(passwordData.CurrentPassword, user.PasswordHash))
                return new ActionResponse { IsSuccess = false, Message = "Current password is incorrect." };

            if (passwordData.CurrentPassword == passwordData.NewPassword)
                return new ActionResponse { IsSuccess = false, Message = "New password must be different from current password." };

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(passwordData.NewPassword);
            await _context.SaveChangesAsync(ct);

            return new ActionResponse { IsSuccess = true, Message = "Password changed successfully." };
        }

        public async Task<ActionResponse> DeleteAccountAsync(int userId, DeleteAccountDto dto, CancellationToken ct = default)
        {
            var user = await _context.Users.FindAsync(new object[] { userId }, ct);
            if (user == null)
                return new ActionResponse { IsSuccess = false, Message = "User not found." };

            if (!string.Equals(user.Email, dto.Email, StringComparison.OrdinalIgnoreCase))
                return new ActionResponse { IsSuccess = false, Message = "Invalid email or password." };

            if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return new ActionResponse { IsSuccess = false, Message = "Invalid email or password." };

            // Decrement MembersCount for each community the user belongs to, then remove memberships.
            // Ownership transfers automatically: the next member by JoinedAt becomes owner.
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

            // Soft-delete: anonymize the user, keep posts/comments intact
            user.UserName = "[deleted]";
            user.Email = $"deleted_{userId}@deleted.local";
            user.PasswordHash = "";
            user.Bio = null;
            user.AvatarUrl = null;
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;

            await _context.SaveChangesAsync(ct);
            return new ActionResponse { IsSuccess = true, Message = "Account deleted." };
        }

        // ── Public user queries ──────────────────────────────────────

        public async Task<IReadOnlyList<UserResponseDto>> GetAllUsersAsync(CancellationToken ct = default)
        {
            var users = await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync(ct);

            return users.Select(MapToDto).ToList();
        }

        public async Task<UserResponseDto?> GetUserByIdAsync(int userId, CancellationToken ct = default)
        {
            var user = await _context.Users.FindAsync(new object[] { userId }, ct);
            return user == null ? null : MapToDto(user);
        }

        public async Task<UserResponseDto?> GetUserByUsernameAsync(string username, CancellationToken ct = default)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserName == username, ct);
            return user == null ? null : MapToDto(user);
        }

        public async Task<IReadOnlyList<UserResponseDto>> SearchUsersAsync(string searchTerm, CancellationToken ct = default)
        {
            var users = await _context.Users
                .Where(u => u.UserName.Contains(searchTerm))
                .OrderBy(u => u.UserName)
                .ToListAsync(ct);

            return users.Select(MapToDto).ToList();
        }

        // ── Mapper ───────────────────────────────────────────────────

        private static UserResponseDto MapToDto(UserData user) => new()
        {
            ID = user.ID,
            UserName = user.UserName,
            Bio = user.Bio,
            AvatarUrl = user.AvatarUrl,
            Karma = user.Karma,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        };
    }
}
