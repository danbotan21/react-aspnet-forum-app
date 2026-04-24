# 📚 SETUP BAZA DE DATE + MOCK DATA

## 🔧 PASUL 1: Aplică Migrația

```bash
cd ForumApp.DataAccess
dotnet ef database update --startup-project ..\ForumApp.API\ForumApp.API.csproj
```

Acest comand va:
- Crea tabelele noi (Notifications, Reports, Contacts)
- Actualiza schema bazei de date cu ultimele modificări

---

## 🌱 PASUL 2: Seed Mock Data

**Ai 2 OPȚIUNI:**

### **OPȚIUNE 1: Automatic Seeding (RECOMANDAT)**

Datele mock se vor insera **AUTOMAT** când pornești aplicația în modul Development:

```bash
cd ..\ForumApp.API
dotnet run
```

În consolă vei vedea:
```
Seeding mock data...
✅ Mock data seeded successfully!
   - 5 Notifications
   - 5 Reports
   - 5 Contacts
```

**Nota:** Seeding-ul rulează doar PRIMA DATĂ când tabelele sunt goale.

---

### **OPȚIUNE 2: Manual cu SQL Script**

Dacă preferi să inserezi manual, folosește fișierul:
`ForumApp_Backend\SeedMockData.sql`

**În SQL Server Management Studio:**
1. Deschide fișierul `SeedMockData.sql`
2. Conectează-te la baza de date
3. Execută script-ul (F5)

---

## 📊 CE MOCK DATA VEI AVEA:

### **NOTIFICATIONS (5 înregistrări):**
- Notificări citite și necitite
- Legate de Posts și Comments
- Pentru UserId: 1, 2, 3, 4

### **REPORTS (5 înregistrări):**
- Rapoarte pentru Posts, Comments, Users
- Motive diverse (spam, offensive language, harassment)
- Creat de diferiți useri

### **CONTACTS (5 înregistrări):**
- 5 tipuri diferite: GeneralInquiry, AccountAndAuthentication, CommunitiesAndModeration, ReportAnIssue, LegalQuestions
- Mesaje de la diferiți utilizatori
- Timestamp-uri variate

---

## 🧪 TESTARE ÎN SWAGGER

După ce ai pornit aplicația (`dotnet run`), accesează:
**https://localhost:5001/swagger**

### **Test Scenarios:**

1. **GET /api/notification/user/1**
   - Obține notificările pentru user 1
   - Ar trebui să vezi 1 notificare

2. **PUT /api/notification/1/mark-as-read?userId=1**
   - Marchează notificarea 1 ca citită

3. **GET /api/report**
   - Obține toate rapoartele (5 rapoarte)

4. **POST /api/contact**
   - Trimite un mesaj nou prin formularul de contact
   ```json
   {
     "fullName": "Test User",
     "email": "test@example.com",
     "subject": "Test Subject",
     "type": 0,
     "message": "This is a test message for contact form"
   }
   ```

5. **GET /api/contact**
   - Obține toate mesajele de contact (6 după test POST)

6. **DELETE /api/report/1**
   - Șterge raportul cu ID 1

---

## 🔍 VERIFICARE MANUALĂ ÎN SQL

```sql
-- Verifică câte înregistrări există
SELECT 'Notifications' AS TableName, COUNT(*) AS Count FROM Notifications
UNION ALL
SELECT 'Reports', COUNT(*) FROM Reports
UNION ALL
SELECT 'Contacts', COUNT(*) FROM Contacts;

-- Vezi toate notificările
SELECT * FROM Notifications ORDER BY CreatedAt DESC;

-- Vezi toate rapoartele
SELECT * FROM Reports ORDER BY CreatedAt DESC;

-- Vezi toate mesajele de contact
SELECT * FROM Contacts ORDER BY CreatedAt DESC;
```

---

## ⚠️ TROUBLESHOOTING

### **Problema: "Mock data already exists"**
- Normal! Seeder-ul verifică dacă datele există deja
- Pentru a reseta, șterge manual datele și restartează aplicația

### **Problema: Foreign Key Constraint Failed**
- Verifică că ai Users, Posts, Comments în baza de date
- Mock data se bazează pe UserId: 1, 2, 3, 4 și PostId: 1, 2, 3

### **Problema: Migration Failed**
- Asigură-te că `dotnet build` a reușit
- Verifică connection string-ul în `appsettings.json`

---

## ✅ NEXT STEPS

După seeding, ești gata să:
1. ✅ Testezi toate endpoint-urile în Swagger
2. ✅ Verifici validările din servicii
3. ✅ Testezi error handling-ul
4. ✅ Pregătești frontend-ul pentru integrare

🚀 **Succes!**
