using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ForumApp.Domain.Entities.Contact
{
    public enum ContactType
    {
        GeneralInquiry = 0,
        AccountAndAuthentication = 1,
        CommunitiesAndModeration = 2,
        ReportAnIssue = 3,
        LegalQuestions = 4

    }
    public class ContactData
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id {get ; set;}

        [Required]
        [StringLength(100)]
        public string FullName {get; set;} = string.Empty;

        [Required]
        [StringLength(100)]
        [EmailAddress]
        public string Email {get; set;} = string.Empty;

        [Required]
        [StringLength(50)]
        public string Subject {get; set;} = string.Empty;
        public ContactType Type {get; set;}

        [Required]
        [StringLength(1000)]
        public string Message {get; set;} = string.Empty;
        public DateTime CreatedAt {get; set;} /* = DateTime.UtcNow; */

    }
}