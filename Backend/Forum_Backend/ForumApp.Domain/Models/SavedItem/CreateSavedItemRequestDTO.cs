using System.ComponentModel.DataAnnotations;

namespace ForumApp.Domain.Models.SavedItem
{
    public class CreateSavedItemRequestDTO
    {
        public int? PostId { get; set; }

        public int? CommentId { get; set; }
    }
}
