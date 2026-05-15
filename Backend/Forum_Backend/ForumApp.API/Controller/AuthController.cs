using System.Security.Claims;
using ForumApp.BusinessLayer.Interfaces;
using ForumApp.Domain.Models.User;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForumApp.API.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserActions _userService;

        public AuthController(IUserActions userService)
        {
            _userService = userService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserRegisterDto registerDto, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _userService.RegisterAsync(registerDto, ct);
            if (result == null)
                return BadRequest(new { message = "Email or username already in use." });

            //  Returnam 201 Created cu datele userului nou creat
            return StatusCode(201, result);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto loginDto, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _userService.LoginAsync(loginDto, ct);
            if (result == null)
                return Unauthorized(new { message = "Invalid email or password." });

            return Ok(result);
        }

        // React apeleaza acest endpoint automat cand primeste 401 (access token expirat)
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _userService.RefreshTokenAsync(dto.RefreshToken, ct);
            if (result == null)
                return Unauthorized(new { message = "Refresh token invalid sau expirat. Te rog logheaza-te din nou." });

            return Ok(result);
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetProfile(CancellationToken ct)
        {
            int userId = GetCurrentUserId();
            var profile = await _userService.GetProfileAsync(userId, ct);
            if (profile == null)
                return NotFound();

            return Ok(profile);
        }

        [Authorize]
        [HttpPut("me")]
        public async Task<IActionResult> UpdateProfile([FromBody] UserUpdateDto updateDto, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            int userId = GetCurrentUserId();
            UserResponseDto? updated;
            try
            {
                updated = await _userService.UpdateProfileAsync(userId, updateDto, ct);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }

            if (updated == null)
                return NotFound();

            return Ok(updated);
        }

        [Authorize]
        [HttpPut("me/password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto, CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            int userId = GetCurrentUserId();
            var action = await _userService.ChangePasswordAsync(userId, changePasswordDto, ct);
            if (!action.IsSuccess)
            {
                if (action.Message == "User not found.")
                    return NotFound(action.Message);

                return BadRequest(new { message = action.Message });
            }

            return Ok(action);
        }

        [Authorize]
        [HttpDelete("me")]
        public async Task<IActionResult> DeleteAccount(CancellationToken ct)
        {
            int userId = GetCurrentUserId();
            var action = await _userService.DeleteAccountAsync(userId, ct);
            if (!action.IsSuccess)
                return NotFound(action.Message);

            return Ok(action.Message);
        }

        private int GetCurrentUserId()
        {
            // Extrage din claim-ul "sub" (NameIdentifier)
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                        ?? User.FindFirst("sub");
            return int.Parse(claim!.Value);
        }
    }
}
