using ForumApp.Domain.Models.User;
using ForumApp.Domain.Models.Responses;

namespace ForumApp.BusinessLayer.Interfaces
{
    public interface IUserActions
    {
        Task<UserResponseDto?> RegisterAsync(UserRegisterDto userData, CancellationToken ct = default);
        Task<UserResponseDto?> LoginAsync(UserLoginDto userData, CancellationToken ct = default);
        Task<UserResponseDto?> GetProfileAsync(int userId, CancellationToken ct = default);
        Task<UserResponseDto?> UpdateProfileAsync(int userId, UserUpdateDto userData, CancellationToken ct = default);
        Task<ActionResponse> DeleteAccountAsync(int userId, CancellationToken ct = default);
    }
}
