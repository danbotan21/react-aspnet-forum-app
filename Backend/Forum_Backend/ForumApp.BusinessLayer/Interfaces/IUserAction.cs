using ForumApp.Domain.Models.User;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Interfaces
{
    public interface IUserAction
    {
        // Auth
        Task<ActionResponse> RegisterAsync(UserRegisterDto userData, CancellationToken ct = default);
        Task<LoginResponseDto?> LoginAsync(UserLoginDto userData, CancellationToken ct = default);
        Task<LoginResponseDto?> GoogleLoginAsync(string accessToken, CancellationToken ct = default);
        Task<LoginResponseDto?> RefreshTokenAsync(string refreshToken, CancellationToken ct = default);
        Task LogoutAsync(string refreshToken, CancellationToken ct = default);

        // Profile (userul logat)
        Task<UserResponseDto?> GetProfileAsync(int userId, CancellationToken ct = default);
        Task<UserResponseDto?> UpdateProfileAsync(int userId, UserUpdateDto userData, CancellationToken ct = default);
        Task<ActionResponse> ChangePasswordAsync(int userId, ChangePasswordDto passwordData, CancellationToken ct = default);
        Task<ActionResponse> DeleteAccountAsync(int userId, DeleteAccountDto dto, CancellationToken ct = default);

        // Forgot / reset password (unauthenticated)
        Task<ActionResponse> RequestPasswordResetAsync(string email, CancellationToken ct = default);
        Task<ActionResponse> ResetPasswordAsync(ResetPasswordDto data, CancellationToken ct = default);

        // Email confirmation (sign-up) + two-step login
        Task<ActionResponse> ConfirmEmailAsync(string token, CancellationToken ct = default);
        Task<ActionResponse> ResendConfirmationAsync(string email, CancellationToken ct = default);
        Task<LoginResponseDto?> VerifyLoginCodeAsync(string email, string code, CancellationToken ct = default);

        // Public user queries
        Task<IReadOnlyList<UserResponseDto>> GetAllUsersAsync(CancellationToken ct = default);
        Task<UserResponseDto?> GetUserByIdAsync(int userId, CancellationToken ct = default);
        Task<UserResponseDto?> GetUserByUsernameAsync(string username, CancellationToken ct = default);
        Task<IReadOnlyList<UserResponseDto>> SearchUsersAsync(string searchTerm, CancellationToken ct = default);
    }
}

