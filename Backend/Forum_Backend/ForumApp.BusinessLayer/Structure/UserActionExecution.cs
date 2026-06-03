using ForumApp.BusinessLayer.Core;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.DataAccess;
using ForumApp.Domain.Models.User;
using ForumApp.Domain.Models.Responses;
using Microsoft.Extensions.Configuration;

namespace ForumApp.BusinessLayer.Structure
{
    public class UserActionExecution : UserActions, IUserAction
    {
        public UserActionExecution(ForumDbContext context, ITokenAction tokenService, IConfiguration configuration, IEmailAction emailService)
            : base(context, tokenService, configuration, emailService) { }

        public Task<ActionResponse> RegisterAsync(UserRegisterDto userData, CancellationToken ct = default)
            => RegisterExecution(userData, ct);

        public Task<LoginResponseDto?> LoginAsync(UserLoginDto userData, CancellationToken ct = default)
            => LoginExecution(userData, ct);

        public Task<LoginResponseDto?> GoogleLoginAsync(string accessToken, CancellationToken ct = default)
            => GoogleLoginExecution(accessToken, ct);

        public Task<LoginResponseDto?> RefreshTokenAsync(string refreshToken, CancellationToken ct = default)
            => RefreshTokenExecution(refreshToken, ct);

        public Task<UserResponseDto?> GetProfileAsync(int userId, CancellationToken ct = default)
            => GetProfileExecution(userId, ct);

        public Task<UserResponseDto?> UpdateProfileAsync(int userId, UserUpdateDto userData, CancellationToken ct = default)
            => UpdateProfileExecution(userId, userData, ct);

        public Task<ActionResponse> ChangePasswordAsync(int userId, ChangePasswordDto passwordData, CancellationToken ct = default)
            => ChangePasswordExecution(userId, passwordData, ct);

        public Task<ActionResponse> DeleteAccountAsync(int userId, DeleteAccountDto dto, CancellationToken ct = default)
            => DeleteAccountExecution(userId, dto, ct);

        public Task<ActionResponse> RequestPasswordResetAsync(string email, CancellationToken ct = default)
            => RequestPasswordResetExecution(email, ct);

        public Task<ActionResponse> ResetPasswordAsync(ResetPasswordDto data, CancellationToken ct = default)
            => ResetPasswordExecution(data, ct);

        public Task<ActionResponse> ConfirmEmailAsync(string token, CancellationToken ct = default)
            => ConfirmEmailExecution(token, ct);

        public Task<ActionResponse> ResendConfirmationAsync(string email, CancellationToken ct = default)
            => ResendConfirmationExecution(email, ct);

        public Task<LoginResponseDto?> VerifyLoginCodeAsync(string email, string code, CancellationToken ct = default)
            => VerifyLoginCodeExecution(email, code, ct);

        public Task<IReadOnlyList<UserResponseDto>> GetAllUsersAsync(CancellationToken ct = default)
            => GetAllUsersExecution(ct);

        public Task<UserResponseDto?> GetUserByIdAsync(int userId, CancellationToken ct = default)
            => GetUserByIdExecution(userId, ct);

        public Task<UserResponseDto?> GetUserByUsernameAsync(string username, CancellationToken ct = default)
            => GetUserByUsernameExecution(username, ct);

        public Task<IReadOnlyList<UserResponseDto>> SearchUsersAsync(string searchTerm, CancellationToken ct = default)
            => SearchUsersExecution(searchTerm, ct);

        public Task LogoutAsync(string refreshToken, CancellationToken ct = default)
            => LogoutExecution(refreshToken, ct);
    }
}
