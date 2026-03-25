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
        public int Id {get ; set;}
        public string FullName {get; set;} = string.Empty;
        public string Email {get; set;} = string.Empty;
        public string Subject {get; set;} = string.Empty;
        public ContactType Type {get; set;}
        public string Message {get; set;} = string.Empty;
        public DateTime CreatedAt {get; set;} /* = DateTime.UtcNow; */
        public string ipAddress {get; set;} = string.Empty;

    }
}