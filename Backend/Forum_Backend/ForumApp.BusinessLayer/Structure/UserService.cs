using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Entities.User;
using ForumApp.Domain.Models.User;
using ForumApp.Domain.Models.Responses;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

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

            if (!string.IsNullOrWhiteSpace(userData.UserName))
                user.UserName = userData.UserName;
            if (!string.IsNullOrWhiteSpace(userData.Bio))
                user.Bio = userData.Bio;
            if (!string.IsNullOrWhiteSpace(userData.Theme))
                user.Theme = userData.Theme;
            if (!string.IsNullOrWhiteSpace(userData.Language))
                user.Language = userData.Language;
            if (!string.IsNullOrWhiteSpace(userData.ProfileVisibility))
                user.ProfileVisibility = userData.ProfileVisibility;

            await _context.SaveChangesAsync(ct);
            return MapToDto(user);
        }

        public async Task<ActionResponse> DeleteAccountAsync(int userId, CancellationToken ct = default)
        {
            var user = await _context.Users.FindAsync(new object[] { userId }, ct);
            if (user == null)
                return new ActionResponse { IsSuccess = false, Message = "User not found." };

            _context.Users.Remove(user);
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
            Karma = user.Karma,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        };
    }
}