/* =====================================================================
   Forum_Database  --  DEMO SEED SCRIPT
   ---------------------------------------------------------------------
   Genereaza date de demonstratie:
     - ~30 useri (toti cu EmailConfirmed = 1, deci se pot loga)
     - 8 comunitati (cu owner / moderatori / membri)
     - 10-15 postari / comunitate
     - 10-15 comentarii / postare (cu reply-uri imbricate)
     - follows, notificari, mesaje (chat), contacte, rapoarte, saved items, voturi

   PAROLA pentru TOTI userii de demo:  Password123!
   (hash BCrypt precalculat si verificat mai jos)

   ADMIN: editeaza variabila @AdminEmail de mai jos.
          - daca exista deja un user cu acel email -> devine Admin
          - daca NU exista              -> se creeaza un cont Admin nou

   IMAGINI: postarile/comunitatile/avatarele folosesc URL-uri placeholder
            publice (picsum.photos / pravatar.cc) ca aplicatia sa arate
            "plina" imediat. Le poti inlocui ulterior cu imaginile tale.

   RULARE: ruleaza scriptul O SINGURA DATA pe baza de date.
           (are un guard care opreste o a doua rulare ca sa nu dubleze datele)
   ===================================================================== */

USE [Forum_Database];
GO

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
GO

-- ====== CONFIG ======================================================
DECLARE @AdminEmail   NVARCHAR(100) = N'admin@forum.demo';   -- <<<<<< SETEAZA AICI EMAILUL ADMINULUI
DECLARE @Pwd          NVARCHAR(256) = N'$2b$11$.FLsUS6k127OUTncEPW4pu3hn9GqWl6ZVEr.gxpzioXnVMiCUXr9e'; -- BCrypt("Password123!")
DECLARE @Now          DATETIME2     = SYSUTCDATETIME();
DECLARE @AdminId      INT;

-- ====== GUARD: nu rula de doua ori ==================================
IF EXISTS (SELECT 1 FROM dbo.Communities WHERE Slug = N'gaming-hub')
BEGIN
    RAISERROR(N'Seed deja aplicat (exista comunitatea "gaming-hub"). Opresc executia ca sa nu dublez datele.', 16, 1);
    RETURN;
END

BEGIN TRY
BEGIN TRAN;

/* =====================================================================
   1. USERI
   ===================================================================== */
CREATE TABLE #SeedUsers (UserName NVARCHAR(50), Bio NVARCHAR(200));
INSERT INTO #SeedUsers (UserName, Bio) VALUES
 (N'maria_pop',          N'Coffee, code and good music.'),
 (N'andrei_ionescu',     N'Gamer and part time PC builder.'),
 (N'elena_dragomir',     N'Digital artist exploring new styles.'),
 (N'vlad_munteanu',      N'Backend dev. Linux enthusiast.'),
 (N'ana_georgescu',      N'Traveler collecting stories not things.'),
 (N'mihai_stan',         N'Music producer in the making.'),
 (N'ioana_radu',         N'Student, runner, bookworm.'),
 (N'cristian_dinu',      N'Always learning something new.'),
 (N'gabriela_toma',      N'Foodie who cannot resist dessert.'),
 (N'razvan_neagu',       N'Football fanatic and weekend hiker.'),
 (N'alexandra_voicu',    N'UX designer. Minimalism lover.'),
 (N'bogdan_marin',       N'Full stack dev and coffee addict.'),
 (N'diana_ene',          N'Painting my way through life.'),
 (N'stefan_lazar',       N'Guitar, vinyl and long road trips.'),
 (N'raluca_barbu',       N'PhD student. Productivity nerd.'),
 (N'catalin_florea',     N'Indie game developer.'),
 (N'simona_nistor',      N'Photographer and travel blogger.'),
 (N'daniel_petre',       N'Sports analyst wannabe.'),
 (N'oana_constantin',    N'Home baker and recipe collector.'),
 (N'florin_iancu',       N'Cybersecurity curious.'),
 (N'larisa_moldovan',    N'Learning three languages at once.'),
 (N'paul_anghel',        N'Mechanical keyboards are life.'),
 (N'teodora_serban',     N'Aspiring novelist and tea drinker.'),
 (N'george_avram',       N'Marathon runner, slowly.'),
 (N'monica_dumitru',     N'Loves cats, code and concerts.'),
 (N'sergiu_ciobanu',     N'Self hosting everything at home.'),
 (N'bianca_oprea',       N'Character designer and doodler.'),
 (N'victor_tanase',      N'Retro gaming collector.'),
 (N'carmen_sandu',       N'Yoga, smoothies and spreadsheets.'),
 (N'lucian_balan',       N'Just here for the discussions.');

INSERT INTO dbo.Users
    (UserName, Email, PasswordHash, Role, ProfileVisibility, Theme, Language,
     Bio, AvatarUrl, BannerUrl, Karma, PremiumUntil, CreatedAt, IsBanned, EmailConfirmed)
SELECT
    s.UserName,
    LOWER(s.UserName) + N'@example.com',
    @Pwd,
    N'User',
    N'Public',
    N'Light',
    N'en',
    s.Bio,
    N'https://i.pravatar.cc/150?u=' + s.UserName,
    N'https://picsum.photos/seed/' + s.UserName + N'/1200/300',
    0,
    NULL,
    DATEADD(DAY, -(ABS(CHECKSUM(NEWID())) % 400) - 1, @Now),
    0,
    1
FROM #SeedUsers s;

-- harta UserName -> Id pentru userii de seed
SELECT u.Id, u.UserName
INTO #U
FROM dbo.Users u
JOIN #SeedUsers s ON s.UserName = u.UserName;

-- cativa useri cu Premium activ (pentru demo)
UPDATE TOP (6) u SET PremiumUntil = DATEADD(MONTH, 3, @Now)
FROM dbo.Users u JOIN #U x ON x.Id = u.Id;

/* =====================================================================
   2. ADMIN  (promoveaza sau creeaza contul cu @AdminEmail)
   ===================================================================== */
IF EXISTS (SELECT 1 FROM dbo.Users WHERE Email = @AdminEmail)
BEGIN
    UPDATE dbo.Users SET Role = N'Admin', EmailConfirmed = 1, IsBanned = 0 WHERE Email = @AdminEmail;
    PRINT N'Admin: am promovat contul existent ' + @AdminEmail;
END
ELSE
BEGIN
    INSERT INTO dbo.Users
        (UserName, Email, PasswordHash, Role, ProfileVisibility, Theme, Language,
         Bio, AvatarUrl, Karma, CreatedAt, IsBanned, EmailConfirmed)
    VALUES
        (N'admin_demo', @AdminEmail, @Pwd, N'Admin', N'Public', N'Light', N'en',
         N'Application administrator.', N'https://i.pravatar.cc/150?u=admin_demo', 0, @Now, 0, 1);
    PRINT N'Admin: am creat un cont nou Admin pentru ' + @AdminEmail + N' (parola: Password123!)';
END

SELECT @AdminId = Id FROM dbo.Users WHERE Email = @AdminEmail;

-- adminul intra si el in pool-ul de membri (ca sa participe la comunitati)
INSERT INTO #U (Id, UserName)
SELECT Id, UserName FROM dbo.Users WHERE Email = @AdminEmail AND Id NOT IN (SELECT Id FROM #U);

/* =====================================================================
   3. COMUNITATI
   ===================================================================== */
INSERT INTO dbo.Communities
    (Slug, Title, Description, BannerUrl, AvatarUrl, MembersCount, Category, Type, Rules, CreatedAt)
VALUES
 (N'gaming-hub',     N'Gaming Hub',         N'Everything gaming: news, recommendations, screenshots and friendly debates.',
    N'https://picsum.photos/seed/gaming-hub/1200/300',   N'https://picsum.photos/seed/gaming-hub-a/200',   0, N'Gaming',     N'public',
    N'1. Be respectful. 2. No spoilers without tags. 3. No piracy links.', DATEADD(DAY, -380, @Now)),
 (N'tech-talk',      N'Tech Talk',          N'Programming, gadgets, open source and everything in between.',
    N'https://picsum.photos/seed/tech-talk/1200/300',    N'https://picsum.photos/seed/tech-talk-a/200',    0, N'Technology', N'public',
    N'1. Stay on topic. 2. No self promotion. 3. Help newcomers.', DATEADD(DAY, -360, @Now)),
 (N'digital-art',    N'Digital Art Studio', N'Share your work, get feedback and grow as an artist.',
    N'https://picsum.photos/seed/digital-art/1200/300',  N'https://picsum.photos/seed/digital-art-a/200',  0, N'Art',        N'public',
    N'1. Original work only. 2. Credit references. 3. Constructive feedback.', DATEADD(DAY, -300, @Now)),
 (N'music-lounge',   N'Music Lounge',       N'For everyone who lives and breathes music. All genres welcome.',
    N'https://picsum.photos/seed/music-lounge/1200/300', N'https://picsum.photos/seed/music-lounge-a/200', 0, N'Music',      N'public',
    N'1. No hate on genres. 2. Tag NSFW. 3. Support indie artists.', DATEADD(DAY, -250, @Now)),
 (N'sports-arena',   N'Sports Arena',       N'Match talk, training tips and everything competitive.',
    N'https://picsum.photos/seed/sports-arena/1200/300', N'https://picsum.photos/seed/sports-arena-a/200', 0, N'Sports',     N'public',
    N'1. No team bashing. 2. Keep it civil. 3. Sources for rumors.', DATEADD(DAY, -210, @Now)),
 (N'study-hall',     N'Study Hall',         N'Tips, resources and accountability for learners of all kinds.',
    N'https://picsum.photos/seed/study-hall/1200/300',   N'https://picsum.photos/seed/study-hall-a/200',   0, N'Education',  N'restricted',
    N'1. No cheating help. 2. Cite sources. 3. Be supportive.', DATEADD(DAY, -160, @Now)),
 (N'wanderlust',     N'Wanderlust Travel',  N'Trip reports, budget tips and hidden gems from around the world.',
    N'https://picsum.photos/seed/wanderlust/1200/300',   N'https://picsum.photos/seed/wanderlust-a/200',   0, N'Travel',     N'public',
    N'1. No affiliate spam. 2. Real photos only. 3. Be helpful.', DATEADD(DAY, -120, @Now)),
 (N'foodies-corner', N'Foodies Corner',     N'Recipes, restaurant finds and kitchen experiments.',
    N'https://picsum.photos/seed/foodies-corner/1200/300', N'https://picsum.photos/seed/foodies-corner-a/200', 0, N'Food',    N'private',
    N'1. Recipes in text. 2. No ads. 3. Share, do not gatekeep.', DATEADD(DAY, -80, @Now));

-- harta comunitatilor + cate postari / cati membri generam
SELECT
    Id AS CommunityId,
    Slug,
    Category,
    PostCount = 10 + (ABS(CHECKSUM(NEWID())) % 6),    -- 10..15
    MemberCap = 12 + (ABS(CHECKSUM(NEWID())) % 14)    -- 12..25
INTO #Comm
FROM dbo.Communities
WHERE Slug IN (N'gaming-hub',N'tech-talk',N'digital-art',N'music-lounge',
               N'sports-arena',N'study-hall',N'wanderlust',N'foodies-corner');

/* =====================================================================
   4. MEMBRI  (1 owner, 2 moderatori, restul membri / comunitate)
   ===================================================================== */
;WITH ranked AS (
    SELECT c.CommunityId, u.Id AS UserId, c.MemberCap,
           rn = ROW_NUMBER() OVER (PARTITION BY c.CommunityId ORDER BY NEWID())
    FROM #Comm c
    CROSS JOIN #U u
)
INSERT INTO dbo.CommunityMembers (CommunityId, UserId, Role, JoinedAt, IsBanned)
SELECT
    CommunityId,
    UserId,
    CASE WHEN rn = 1 THEN N'owner'
         WHEN rn IN (2,3) THEN N'moderator'
         ELSE N'member' END,
    DATEADD(DAY, -(ABS(CHECKSUM(NEWID())) % 200), @Now),
    0
FROM ranked
WHERE rn <= MemberCap;

UPDATE c SET MembersCount =
    (SELECT COUNT(*) FROM dbo.CommunityMembers m WHERE m.CommunityId = c.Id AND m.IsBanned = 0)
FROM dbo.Communities c;

/* =====================================================================
   5. CONTINUT POSTARI  (titlu + corp, pe categorii)
   ===================================================================== */
SELECT Category, Title, Body,
       rn = ROW_NUMBER() OVER (PARTITION BY Category ORDER BY NEWID())
INTO #PC
FROM (VALUES
 -- Gaming
 (N'Gaming', N'Best indie games of the year so far',        N'I have been on an indie binge lately and the quality this year is unreal. Drop your favorites below.'),
 (N'Gaming', N'What is everyone playing this weekend?',      N'Looking for something to sink a few hours into. Open to any genre, surprise me.'),
 (N'Gaming', N'My thoughts after 100 hours in this RPG',     N'The pacing drags in the middle but the ending absolutely makes up for it. Worth every hour.'),
 (N'Gaming', N'Tips for new players who just started',       N'Do not rush the early areas, explore everything and read item descriptions. You will thank yourself later.'),
 (N'Gaming', N'Underrated games that deserve more love',     N'These titles flew under the radar but are some of the most polished experiences I have played.'),
 (N'Gaming', N'The state of competitive shooters in 2026',   N'Matchmaking feels better than ever but the maps could use some variety. What is your take?'),
 (N'Gaming', N'Building my first gaming PC, need advice',     N'Budget is mid range. Should I prioritize the GPU or go balanced across the board?'),
 (N'Gaming', N'Which controller do you prefer and why?',     N'Switched recently and the difference in comfort during long sessions is huge.'),
 (N'Gaming', N'The speedrun community is absolutely insane',  N'Watched a world record attempt last night and my jaw was on the floor. The dedication is unreal.'),
 (N'Gaming', N'Co-op games to play with friends online',     N'We are a group of four looking for our next obsession. Hit me with recommendations.'),
 (N'Gaming', N'Are remasters worth the price these days?',   N'Some are stunning, others feel lazy. Curious where the community draws the line.'),
 (N'Gaming', N'Favorite video game soundtracks of all time', N'A great score can carry an entire game. Sharing my top five, what are yours?'),
 -- Technology
 (N'Technology', N'How AI is changing the way we write code',  N'Pair programming with an assistant has genuinely changed my workflow. Curious how others use it.'),
 (N'Technology', N'Switched to Linux full time, my experience', N'Three weeks in and I am not looking back. The learning curve was real but worth it.'),
 (N'Technology', N'Best mechanical keyboards for programmers',  N'Spent way too much researching switches. Sharing what actually matters for daily typing.'),
 (N'Technology', N'Is the new framework worth learning?',       N'The hype is loud but I want real opinions from people who shipped something with it.'),
 (N'Technology', N'Self hosting everything, a beginner guide',  N'Started with a single board computer and now I run half my services at home. Here is how.'),
 (N'Technology', N'Why I moved away from the cloud',            N'The bill kept climbing and I wanted control. Migration was painful but the savings add up.'),
 (N'Technology', N'The future of web development in 2026',      N'Server side rendering is back, bundlers are faster. Where do you think we are heading?'),
 (N'Technology', N'Debugging horror stories, share yours',      N'Spent two days on a bug that was a single missing character. Make me feel less alone.'),
 (N'Technology', N'Which language should I learn next?',         N'Comfortable with the basics, want something that broadens how I think about problems.'),
 (N'Technology', N'My minimal terminal setup and dotfiles',     N'Stripped everything down to the essentials and my productivity went up. Config in the comments.'),
 (N'Technology', N'Privacy focused alternatives to big apps',    N'Slowly degoogling my life. Sharing the swaps that actually stuck without too much friction.'),
 (N'Technology', N'Lessons learned from my first dev job',       N'Reading code is harder than writing it, and asking questions early saves everyone time.'),
 -- Art
 (N'Art', N'Sharing my latest digital painting',        N'Spent about twelve hours on this one. Feedback very welcome, especially on the lighting.'),
 (N'Art', N'How do you deal with creative burnout?',     N'Hit a wall lately and nothing feels fun. How do you reignite the spark?'),
 (N'Art', N'Favorite brushes and tools for beginners',   N'You do not need a huge brush library. These few cover almost everything I make.'),
 (N'Art', N'Color theory tips that changed my work',     N'Once I understood temperature and value my pieces instantly looked more alive.'),
 (N'Art', N'Feedback wanted on my character design',     N'Working on a personal project and want to make this protagonist memorable. Thoughts?'),
 (N'Art', N'From sketch to finished piece, my process',  N'Breaking down every stage from thumbnail to final render. Hope it helps someone.'),
 (N'Art', N'Studying anatomy really improved my art',    N'I avoided it for years out of fear. Wish I had started sooner, the difference is night and day.'),
 (N'Art', N'Best tablets for digital artists in 2026',   N'Compared a few price ranges. Honestly the mid tier is more than enough for most people.'),
 (N'Art', N'How I finally found my own art style',       N'Stop chasing it directly. It emerges from drawing what you love consistently over time.'),
 (N'Art', N'Daily drawing challenge, who is in?',        N'One sketch a day for thirty days. Post yours and let us keep each other accountable.'),
 (N'Art', N'Traditional vs digital, what do you prefer?', N'I love the tactile feel of paper but the undo button is hard to give up. Where do you stand?'),
 (N'Art', N'Commissions are open, lessons on pricing',   N'Undercharging early almost made me quit. Here is what I learned about valuing your time.'),
 -- Music
 (N'Music', N'Album of the month, what are you on?',      N'On repeat all week and still discovering new layers. Share what is dominating your playlist.'),
 (N'Music', N'Producing my first track at home',          N'Mixing is humbling. Everything sounds great until you listen on different speakers.'),
 (N'Music', N'Underrated artists you should know about',  N'These musicians deserve way bigger audiences. Adding them to your library is a public service.'),
 (N'Music', N'Best budget headphones for mixing?',        N'Do not want to spend a fortune but need something honest. Recommendations appreciated.'),
 (N'Music', N'How theory changed my songwriting',         N'I resisted it for years thinking it would kill creativity. The opposite happened.'),
 (N'Music', N'Vinyl vs streaming, the eternal debate',    N'I love the ritual of records but the convenience of streaming wins on a busy day.'),
 (N'Music', N'Share your current playlist',               N'Building the ultimate focus mix. Drop one song you cannot stop playing right now.'),
 (N'Music', N'Tips for singing without straining',        N'Warm ups changed everything for me. Sharing a simple routine that takes five minutes.'),
 (N'Music', N'Which DAW do you use and why?',             N'Tried a few and finally settled. Curious what keeps everyone loyal to their setup.'),
 (N'Music', N'Live concerts are back and better',         N'Saw a show last night and remembered why nothing beats music in a room full of people.'),
 (N'Music', N'Practicing guitar an hour a day',           N'One month in and the calluses are real but so is the progress. Consistency really is king.'),
 (N'Music', N'Favorite film scores that hit different',   N'A good score can make a scene unforgettable. These ones live rent free in my head.'),
 -- Sports
 (N'Sports', N'What a match last night, thoughts?',       N'Still buzzing from that finish. Did anyone else not breathe for the last ten minutes?'),
 (N'Sports', N'Starting to run, tips for beginners',      N'Couch to first run was harder than expected. What helped you stick with it?'),
 (N'Sports', N'Best workouts with no equipment',          N'Traveling a lot lately so the gym is not an option. Bodyweight routines that actually work?'),
 (N'Sports', N'Transfer rumors are getting wild',         N'Half of these cannot be true but the silly season is the best part of the year.'),
 (N'Sports', N'How do you stay motivated to train?',      N'Some weeks are easy, others I have to drag myself. What keeps you consistent?'),
 (N'Sports', N'Underrated athletes who deserve credit',   N'They do not get the headlines but their consistency is incredible. Shout outs below.'),
 (N'Sports', N'My first marathon, what I learned',        N'Pacing is everything and the wall is real. Crossing that line was worth every blister.'),
 (N'Sports', N'Nutrition tips that actually work',        N'Cut through the noise. Simple, sustainable habits beat any fad I have tried.'),
 (N'Sports', N'Predictions for the playoffs',             N'Bold takes only. Put your reputation on the line and let us revisit this thread later.'),
 (N'Sports', N'Home gym setup on a budget',               N'You do not need much. A few key pieces cover ninety percent of what most people need.'),
 (N'Sports', N'Recovering from an injury, advice?',       N'Patience is the hardest part. How did you stay sane while sidelined?'),
 (N'Sports', N'Greatest sports moments of the decade',    N'Some of these still give me chills. Which one is permanently burned into your memory?'),
 -- Education
 (N'Education', N'How I study effectively for exams',     N'Active recall and spaced repetition changed my results completely. Sharing my system.'),
 (N'Education', N'Best free resources to learn anything',  N'The amount of quality material online for zero cost is staggering. Here are my go tos.'),
 (N'Education', N'Struggling with motivation at uni',      N'Some semesters just hit harder. How do you push through when nothing feels interesting?'),
 (N'Education', N'Note taking methods that help',          N'Tried a dozen systems. The simplest one ended up being the one I actually stick with.'),
 (N'Education', N'Should I do a masters or get a job?',    N'Torn between more study and real experience. Would love to hear from people who chose either.'),
 (N'Education', N'Languages I am learning this year',      N'Juggling two at once is ambitious but the overlap helps more than I expected.'),
 (N'Education', N'Tips for writing a good thesis',         N'Start writing earlier than you think you should. The blank page is the real enemy.'),
 (N'Education', N'How to beat procrastination for good',   N'The two minute rule genuinely rewired my habits. What works for you?'),
 (N'Education', N'Online courses worth your time',         N'Skipped the fluff and found a few that actually delivered. Recommendations inside.'),
 (N'Education', N'Balancing work and studying',            N'Working part time while studying is a grind. Time blocking saved my sanity.'),
 (N'Education', N'Favorite productivity apps for students', N'Tried to keep it minimal so the tools do not become the procrastination. Short list here.'),
 (N'Education', N'Asking for advice on choosing a major',   N'Interested in too many things. How did you narrow it down without regretting it?'),
 -- Travel
 (N'Travel', N'Just got back from an amazing trip',       N'Still processing how good it was. Sharing the highlights and a few things I would do differently.'),
 (N'Travel', N'Budget travel tips that saved me money',   N'You do not need to be rich to see the world. These habits cut my costs in half.'),
 (N'Travel', N'Hidden gems you should visit once',        N'Skip the crowded spots for a day and you will find the places that actually stay with you.'),
 (N'Travel', N'Solo travel, is it worth it?',             N'Nervous before my first solo trip, now I cannot imagine doing it any other way.'),
 (N'Travel', N'Packing light, my essential checklist',    N'One carry on for two weeks. It is absolutely possible and so freeing once you commit.'),
 (N'Travel', N'Best street food I have ever tried',       N'The best meals were never in restaurants. Drop the dish that changed your life.'),
 (N'Travel', N'How to find cheap flights consistently',   N'Flexibility is the secret weapon. A few tools and habits make a real difference.'),
 (N'Travel', N'Underrated cities that surprised me',      N'Went in with no expectations and left completely charmed. These places deserve more attention.'),
 (N'Travel', N'Travel horror stories, share yours',       N'Missed connections, lost luggage, the works. Misery loves company so let us hear them.'),
 (N'Travel', N'Working remotely while traveling',         N'Balancing deadlines and adventure is tricky but doable. Here is what kept me productive.'),
 (N'Travel', N'My favorite hiking trails so far',         N'Nothing beats earning a view on foot. Sharing a few that were worth every step.'),
 (N'Travel', N'Planning my next adventure, ideas?',       N'Open calendar, open mind. Where should I point myself next? Surprise me.'),
 -- Food
 (N'Food', N'Made homemade pasta for the first time',     N'Messy, fun and absolutely worth it. The texture is on another level compared to store bought.'),
 (N'Food', N'Your go to quick weeknight dinner?',         N'Need fast meals that do not feel like a compromise. What is on rotation in your kitchen?'),
 (N'Food', N'Best budget friendly meal prep ideas',       N'Eating well on little money is a skill. Sharing the recipes that keep me on track all week.'),
 (N'Food', N'Sharing my grandmothers secret recipe',      N'She finally let me write it down. Simple ingredients but the technique is everything.'),
 (N'Food', N'Restaurant quality pizza at home',           N'A hot stone and a long rise changed the game. Crispy base, no fancy oven required.'),
 (N'Food', N'Underrated ingredients everyone should try', N'A few small additions transformed my everyday cooking. Curious what your secret weapon is.'),
 (N'Food', N'Baking sourdough, my journey so far',        N'Killed two starters before this one survived. The first good loaf felt like a real win.'),
 (N'Food', N'Favorite comfort foods for cold days',       N'Nothing fancy, just warm and nostalgic. What do you make when the weather turns?'),
 (N'Food', N'Tips for cooking for one person',            N'Cooking solo does not have to mean takeout every night. Sharing how I keep it simple and varied.'),
 (N'Food', N'Most controversial food take?',              N'I will start: pineapple absolutely belongs. Come fight me politely in the comments.'),
 (N'Food', N'Easy desserts anyone can make',              N'No special equipment, no stress. These three never fail to impress with minimal effort.'),
 (N'Food', N'Meal ideas for busy students',               N'Cheap, fast and actually nutritious. Surviving exam season without living on instant noodles.')
) v(Category, Title, Body);

/* =====================================================================
   6. POSTARI  (10-15 / comunitate)
   ===================================================================== */
;WITH Tally AS (
    SELECT TOP (15) n = ROW_NUMBER() OVER (ORDER BY (SELECT NULL))
    FROM sys.all_objects
)
INSERT INTO dbo.Posts
    (Title, Body, ImageUrl, LinkUrl, Type, Votes, CommentsCount, IsPinned, CreatedAt, EditedAt, AuthorId, CommunityId)
SELECT
    pc.Title,
    CASE WHEN b.bucket = 9 THEN LEFT(pc.Body, 180)         -- Image: corp scurt
         WHEN b.bucket >= 7 THEN NULL                       -- Link: fara corp
         ELSE pc.Body END,                                  -- Text
    CASE WHEN b.bucket = 9
         THEN N'https://picsum.photos/seed/' + LEFT(REPLACE(CONVERT(NVARCHAR(40), NEWID()), '-', ''), 14) + N'/900/600'
         ELSE NULL END,
    CASE WHEN b.bucket BETWEEN 7 AND 8
         THEN N'https://example.com/article/' + CAST(ABS(CHECKSUM(NEWID())) % 99999 AS NVARCHAR(10))
         ELSE NULL END,
    CASE WHEN b.bucket = 9 THEN N'Image'
         WHEN b.bucket BETWEEN 7 AND 8 THEN N'Link'
         ELSE N'Text' END,
    (ABS(CHECKSUM(NEWID())) % 480) - 20,                    -- voturi: ~ -20..459
    0,
    0,
    DATEADD(MINUTE, -((ABS(CHECKSUM(NEWID())) % 129600) + 60), @Now),  -- ultimele ~90 zile
    NULL,
    (SELECT TOP 1 m.UserId FROM dbo.CommunityMembers m
       WHERE m.CommunityId = c.CommunityId AND m.IsBanned = 0 ORDER BY NEWID()),
    c.CommunityId
FROM #Comm c
CROSS JOIN Tally t
JOIN #PC pc ON pc.Category = c.Category AND pc.rn = ((t.n - 1) % 12) + 1
CROSS APPLY (SELECT bucket = ABS(CHECKSUM(NEWID())) % 10) b
WHERE t.n <= c.PostCount;

-- snapshot postari pentru generarea comentariilor
SELECT
    p.Id, p.CommunityId, p.AuthorId, p.CreatedAt,
    CommentTarget = 10 + (ABS(CHECKSUM(NEWID())) % 6)       -- 10..15
INTO #P
FROM dbo.Posts p;

/* =====================================================================
   7. COMENTARII  (10-15 / postare)
   ===================================================================== */
SELECT Body INTO #CommentPool FROM (VALUES
 (N'This is exactly what I needed to read today, thanks for sharing.'),
 (N'Totally agree with you on this one.'),
 (N'Interesting take, I never thought about it that way.'),
 (N'Can you elaborate a bit more on this?'),
 (N'I had the same experience recently.'),
 (N'Great post, saved it for later.'),
 (N'Not sure I agree, but I respect your point.'),
 (N'This deserves way more upvotes.'),
 (N'Underrated comment right here.'),
 (N'Could you share some sources?'),
 (N'Been following this for a while, solid stuff.'),
 (N'Honestly this changed my perspective.'),
 (N'Haha this made my day.'),
 (N'Bookmarking this immediately.'),
 (N'How long did this take you?'),
 (N'Welcome to the community!'),
 (N'Beginner here, this helped a lot.'),
 (N'Any tips for someone just starting out?'),
 (N'I respectfully disagree, here is my reasoning.'),
 (N'Quality content as always.'),
 (N'This is the kind of post I come here for.'),
 (N'Thanks for the detailed write up.'),
 (N'Wholesome and informative, love it.'),
 (N'I tried this and it actually worked.'),
 (N'Could not have said it better myself.'),
 (N'What would you recommend for a budget option?'),
 (N'This thread is gold.'),
 (N'First time commenting, but I had to say thanks.'),
 (N'Adding my two cents: it really depends on the use case.'),
 (N'Spot on analysis.'),
 (N'This is way more nuanced than people think.'),
 (N'Anyone else having this issue?'),
 (N'Updating my setup based on this, cheers.'),
 (N'Been lurking forever, finally here to comment.'),
 (N'You explained this so clearly.'),
 (N'This should be pinned honestly.'),
 (N'Came for the title, stayed for the discussion.'),
 (N'Solid advice, will try it out this weekend.'),
 (N'Respect for putting this together.'),
 (N'Saving this for future reference.'),
 (N'Underrated and overlooked, glad you posted.'),
 (N'This community never disappoints.'),
 (N'Could not agree more, well put.'),
 (N'Thanks, this answered my question perfectly.'),
 (N'Great breakdown, very helpful.')
) v(Body);

;WITH Tally15 AS (
    SELECT TOP (15) n = ROW_NUMBER() OVER (ORDER BY (SELECT NULL))
    FROM sys.all_objects
)
INSERT INTO dbo.Comments (Body, Votes, CreatedAt, EditedAt, AuthorId, PostId, ParentCommentId)
SELECT
    (SELECT TOP 1 cp.Body FROM #CommentPool cp ORDER BY NEWID()),
    (ABS(CHECKSUM(NEWID())) % 140) - 10,
    DATEADD(HOUR, ABS(CHECKSUM(NEWID())) % (NULLIF(DATEDIFF(HOUR, p.CreatedAt, @Now), 0) + 1), p.CreatedAt),
    NULL,
    (SELECT TOP 1 m.UserId FROM dbo.CommunityMembers m
       WHERE m.CommunityId = p.CommunityId AND m.IsBanned = 0 ORDER BY NEWID()),
    p.Id,
    NULL
FROM #P p
CROSS JOIN Tally15 t
WHERE t.n <= p.CommentTarget;

-- ~30% dintre comentarii devin reply-uri la un comentariu mai vechi din acelasi post
UPDATE c
SET ParentCommentId = x.PId
FROM dbo.Comments c
CROSS APPLY (
    SELECT TOP 1 c2.Id AS PId
    FROM dbo.Comments c2
    WHERE c2.PostId = c.PostId AND c2.Id < c.Id
    ORDER BY NEWID()
) x
WHERE (ABS(CHECKSUM(NEWID())) % 100) < 30;

/* =====================================================================
   8. CONTORI DENORMALIZATI + PIN
   ===================================================================== */
UPDATE p SET CommentsCount =
    (SELECT COUNT(*) FROM dbo.Comments c WHERE c.PostId = p.Id)
FROM dbo.Posts p;

-- pin la cea mai votata postare din fiecare comunitate
;WITH r AS (
    SELECT Id, ROW_NUMBER() OVER (PARTITION BY CommunityId ORDER BY Votes DESC, Id) AS rn
    FROM dbo.Posts
)
UPDATE p SET IsPinned = 1
FROM dbo.Posts p JOIN r ON r.Id = p.Id
WHERE r.rn = 1;

-- karma = suma voturilor pe postari + comentarii (doar pentru userii de seed)
UPDATE u SET Karma =
    ISNULL((SELECT SUM(p.Votes) FROM dbo.Posts p    WHERE p.AuthorId = u.Id), 0) +
    ISNULL((SELECT SUM(c.Votes) FROM dbo.Comments c WHERE c.AuthorId = u.Id), 0)
FROM dbo.Users u
JOIN #U x ON x.Id = u.Id;

/* =====================================================================
   9. FOLLOWS
   ===================================================================== */
;WITH pairs AS (
    SELECT a.Id AS f1, b.Id AS f2, rn = ROW_NUMBER() OVER (ORDER BY NEWID())
    FROM #U a JOIN #U b ON a.Id <> b.Id
)
INSERT INTO dbo.Follows (FollowerId, FollowingId, CreatedAt)
SELECT f1, f2, DATEADD(DAY, -(ABS(CHECKSUM(NEWID())) % 120), @Now)
FROM pairs WHERE rn <= 60;

/* =====================================================================
   10. NOTIFICARI
   ===================================================================== */
-- "a comentat la postarea ta" (Type = 1 NewComment)
INSERT INTO dbo.Notifications
    (RecipientId, ActorId, Type, Message, PostId, PostTitle, CommunitySlug, IsRead, CreatedAt)
SELECT TOP 45
    p.AuthorId, c.AuthorId, 1,
    N'commented on your post',
    p.Id, LEFT(p.Title, 300), comm.Slug,
    CASE WHEN ABS(CHECKSUM(NEWID())) % 3 = 0 THEN 1 ELSE 0 END,
    c.CreatedAt
FROM dbo.Comments c
JOIN dbo.Posts p ON p.Id = c.PostId
JOIN dbo.Communities comm ON comm.Id = p.CommunityId
WHERE c.AuthorId <> p.AuthorId
ORDER BY NEWID();

-- "a inceput sa te urmareasca" (Type = 10 NewFollower)
INSERT INTO dbo.Notifications (RecipientId, ActorId, Type, Message, IsRead, CreatedAt)
SELECT TOP 20
    FollowingId, FollowerId, 10, N'started following you', 0, CreatedAt
FROM dbo.Follows
ORDER BY NEWID();

/* =====================================================================
   11. MESAJE (chat)  -  3 conversatii cu cateva mesaje
   ===================================================================== */
;WITH up AS (SELECT Id, rn = ROW_NUMBER() OVER (ORDER BY Id) FROM #U)
INSERT INTO dbo.Conversations (User1Id, User2Id, CreatedAt, LastMessageAt)
SELECT a.Id, b.Id, DATEADD(DAY, -5, @Now), DATEADD(HOUR, -2, @Now)
FROM up a
JOIN up b ON a.rn IN (1,3,5) AND b.rn = a.rn + 1;

SELECT Body INTO #MsgPool FROM (VALUES
 (N'Hey, how are you doing?'),
 (N'Did you see the latest post in the community?'),
 (N'Yeah I am good, you?'),
 (N'Lets catch up this weekend.'),
 (N'That sounds great, talk soon!'),
 (N'Haha for sure.'),
 (N'Let me know if you need anything.'),
 (N'Thanks again for the help earlier.')
) v(Body);

;WITH t AS (SELECT TOP (6) n = ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) FROM sys.all_objects)
INSERT INTO dbo.Messages (ConversationId, SenderId, Body, CreatedAt)
SELECT
    cv.Id,
    CASE WHEN t.n % 2 = 1 THEN cv.User1Id ELSE cv.User2Id END,
    (SELECT TOP 1 mp.Body FROM #MsgPool mp ORDER BY NEWID()),
    DATEADD(MINUTE, t.n * 9, cv.CreatedAt)
FROM dbo.Conversations cv
CROSS JOIN t;

/* =====================================================================
   12. CONTACTE  (inbox-ul de admin)
   ===================================================================== */
INSERT INTO dbo.Contacts (FullName, Email, Subject, Type, Message, CreatedAt)
VALUES
 (N'Andreea Popescu', N'andreea.p@example.com', N'Question about my account', 1,
  N'Hi, I cannot change my profile picture, it keeps reverting. Is this a known issue?', DATEADD(DAY, -6, @Now)),
 (N'Mihai Ene',       N'mihai.ene@example.com', N'How to start a community',  2,
  N'I would love to start a community for chess players. What are the requirements?', DATEADD(DAY, -4, @Now)),
 (N'Sara Lungu',      N'sara.lungu@example.com', N'Possible bug in feed',     3,
  N'The home feed sometimes shows the same post twice when I scroll fast. Just reporting it.', DATEADD(DAY, -2, @Now)),
 (N'Tudor Marin',     N'tudor.m@example.com',   N'General feedback',          0,
  N'Just wanted to say the app looks great. Keep up the good work!', DATEADD(HOUR, -10, @Now));

/* =====================================================================
   13. RAPOARTE  (coada de moderare)
   ===================================================================== */
-- rapoarte pe postari (Type = 0)
INSERT INTO dbo.Reports (ReporterId, Type, ReportedItemId, CommunityId, Reason, Status, CreatedAt)
SELECT TOP 3
    (SELECT TOP 1 u.Id FROM #U u WHERE u.Id <> p.AuthorId ORDER BY NEWID()),
    0, p.Id, p.CommunityId, x.Reason, N'pending',
    DATEADD(DAY, -(ABS(CHECKSUM(NEWID())) % 8), @Now)
FROM dbo.Posts p
CROSS APPLY (SELECT TOP 1 Reason FROM (VALUES
    (N'Spam or misleading'), (N'Off-topic content'), (N'Harassment'), (N'Misinformation')) r(Reason)
    ORDER BY NEWID()) x
ORDER BY NEWID();

-- rapoarte pe comentarii (Type = 1)
INSERT INTO dbo.Reports (ReporterId, Type, ReportedItemId, CommunityId, Reason, Status, CreatedAt)
SELECT TOP 2
    (SELECT TOP 1 u.Id FROM #U u WHERE u.Id <> c.AuthorId ORDER BY NEWID()),
    1, c.Id, p.CommunityId, N'Inappropriate language', N'pending',
    DATEADD(DAY, -(ABS(CHECKSUM(NEWID())) % 5), @Now)
FROM dbo.Comments c
JOIN dbo.Posts p ON p.Id = c.PostId
ORDER BY NEWID();

/* =====================================================================
   14. SAVED ITEMS + VOTURI ale adminului (ca sa aiba ce vedea in profil)
   ===================================================================== */
IF @AdminId IS NOT NULL
BEGIN
    INSERT INTO dbo.SavedItems (AuthorId, PostId, CreatedAt)
    SELECT TOP 6 @AdminId, Id, @Now
    FROM dbo.Posts WHERE AuthorId <> @AdminId
    ORDER BY NEWID();

    INSERT INTO dbo.Votes (AuthorId, PostId, Type, VotedAt)
    SELECT TOP 12 @AdminId, Id,
        CASE WHEN ABS(CHECKSUM(NEWID())) % 4 = 0 THEN -1 ELSE 1 END, @Now
    FROM dbo.Posts WHERE AuthorId <> @AdminId
    ORDER BY NEWID();
END

COMMIT;

/* =====================================================================
   SUMAR
   ===================================================================== */
PRINT N'==================== SEED COMPLET ====================';
-- PRINT cannot contain subqueries, so the summary is a result set
SELECT (SELECT COUNT(*) FROM dbo.Users)            AS Users,
       (SELECT COUNT(*) FROM dbo.Communities)      AS Communities,
       (SELECT COUNT(*) FROM dbo.CommunityMembers) AS Members,
       (SELECT COUNT(*) FROM dbo.Posts)            AS Posts,
       (SELECT COUNT(*) FROM dbo.Comments)         AS Comments,
       (SELECT COUNT(*) FROM dbo.Messages)         AS Messages,
       (SELECT COUNT(*) FROM dbo.Reports)          AS Reports;
PRINT N'Parola useri demo: Password123!';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    PRINT N'EROARE - s-a facut ROLLBACK. Nimic nu a fost salvat.';
    THROW;
END CATCH
GO
