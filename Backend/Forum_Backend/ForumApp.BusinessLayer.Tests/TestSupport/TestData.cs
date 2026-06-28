using ForumApp.DataAccess;
using ForumApp.Domain.Entities.Comment;
using ForumApp.Domain.Entities.Community;
using ForumApp.Domain.Entities.CommunityMember;
using ForumApp.Domain.Entities.Post;
using ForumApp.Domain.Entities.User;

namespace ForumApp.BusinessLayer.Tests.TestSupport;

public static class TestData
{
    public static UserData User(string userName, string? password = "Password123!", string role = "User")
        => new()
        {
            UserName = userName,
            Email = $"{userName.ToLowerInvariant()}@example.com",
            PasswordHash = password == null ? null : BCrypt.Net.BCrypt.HashPassword(password),
            Role = role,
            ProfileVisibility = "Public",
            Theme = "Light",
            Language = "en",
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow
        };

    public static CommunityData Community(string slug, string type = "public", int membersCount = 0)
        => new()
        {
            Slug = slug,
            Title = slug,
            Description = $"{slug} description",
            Category = "general",
            Type = type,
            MembersCount = membersCount,
            CreatedAt = DateTime.UtcNow
        };

    public static CommunityMemberData Member(int userId, int communityId, string role = "member", bool isBanned = false)
        => new()
        {
            UserId = userId,
            CommunityId = communityId,
            Role = role,
            IsBanned = isBanned,
            BanReason = isBanned ? "test ban" : null,
            BannedAt = isBanned ? DateTime.UtcNow : null,
            JoinedAt = DateTime.UtcNow
        };

    public static PostData Post(int authorId, int communityId, string title = "Test post")
        => new()
        {
            Title = title,
            Body = "Post body",
            Type = "text",
            AuthorId = authorId,
            CommunityId = communityId,
            CreatedAt = DateTime.UtcNow
        };

    public static CommentData Comment(int authorId, int postId, string body = "Test comment")
        => new()
        {
            Body = body,
            AuthorId = authorId,
            PostId = postId,
            CreatedAt = DateTime.UtcNow
        };

    public static async Task<(UserData Owner, UserData Member, CommunityData Community)> SeedCommunityAsync(
        ForumDbContext context,
        string type = "public")
    {
        var owner = User("owner01");
        var member = User("member01");
        context.Users.AddRange(owner, member);
        await context.SaveChangesAsync();

        var community = Community("dotnet", type, membersCount: 2);
        context.Communities.Add(community);
        await context.SaveChangesAsync();

        context.CommunityMembers.AddRange(
            Member(owner.Id, community.Id, "owner"),
            Member(member.Id, community.Id));
        await context.SaveChangesAsync();

        return (owner, member, community);
    }

    public static async Task<(UserData Author, UserData OtherUser, CommunityData Community, PostData Post)> SeedPostAsync(
        ForumDbContext context,
        string communityType = "public",
        string memberRole = "member")
    {
        var author = User("author01");
        var otherUser = User("other001");
        context.Users.AddRange(author, otherUser);
        await context.SaveChangesAsync();

        var community = Community("backend", communityType, membersCount: 2);
        context.Communities.Add(community);
        await context.SaveChangesAsync();

        context.CommunityMembers.AddRange(
            Member(author.Id, community.Id, "owner"),
            Member(otherUser.Id, community.Id, memberRole));
        await context.SaveChangesAsync();

        var post = Post(author.Id, community.Id);
        context.Posts.Add(post);
        await context.SaveChangesAsync();

        return (author, otherUser, community, post);
    }
}
