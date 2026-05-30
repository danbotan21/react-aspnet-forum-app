using ForumApp.Domain.Models.User;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Interfaces
{
    public interface IUserAction
    {
        // Auth
        Task<UserResponseDto?> RegisterAsync(UserRegisterDto userData, CancellationToken ct = default);
        Task<LoginResponseDto?> LoginAsync(UserLoginDto userData, CancellationToken ct = default);
        Task<LoginResponseDto?> GoogleLoginAsync(string accessToken, CancellationToken ct = default);
        Task<LoginResponseDto?> RefreshTokenAsync(string refreshToken, CancellationToken ct = default);

        // Profile (userul logat)
        Task<UserResponseDto?> GetProfileAsync(int userId, CancellationToken ct = default);
        Task<UserResponseDto?> UpdateProfileAsync(int userId, UserUpdateDto userData, CancellationToken ct = default);
        Task<ActionResponse> ChangePasswordAsync(int userId, ChangePasswordDto passwordData, CancellationToken ct = default);
        Task<ActionResponse> DeleteAccountAsync(int userId, DeleteAccountDto dto, CancellationToken ct = default);

        // Public user queries
        Task<IReadOnlyList<UserResponseDto>> GetAllUsersAsync(CancellationToken ct = default);
        Task<UserResponseDto?> GetUserByIdAsync(int userId, CancellationToken ct = default);
        Task<UserResponseDto?> GetUserByUsernameAsync(string username, CancellationToken ct = default);
        Task<IReadOnlyList<UserResponseDto>> SearchUsersAsync(string searchTerm, CancellationToken ct = default);
    }
}

