namespace ForumApp.Domain.Models.Responses
{
    public class ActionResponse
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
