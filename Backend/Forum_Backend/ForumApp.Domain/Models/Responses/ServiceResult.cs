namespace ForumApp.Domain.Models.Responses
{
    public class ServiceResult<T>
    {
        public bool IsSuccess { get; init; }
        public string? Error { get; init; }
        public T? Data { get; init; }

        public static ServiceResult<T> Success(T data) =>
            new() { IsSuccess = true, Data = data };

        public static ServiceResult<T> Fail(string error) =>
            new() { IsSuccess = false, Error = error };
    }
}
