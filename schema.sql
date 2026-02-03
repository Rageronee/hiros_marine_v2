-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
----------------------------------------------------------------
-- 0. ADMIN SECURITY HELPER
----------------------------------------------------------------
-- Function to check if the current user is an Admin
-- Usage: SELECT is_admin(); returns true/false
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.players
        WHERE id = auth.uid()
            AND role = 'Admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- DROP TABLE CLEANUP (Cascade to remove dependencies)
DROP TABLE IF EXISTS "public"."news" CASCADE;
DROP TABLE IF EXISTS "public"."locations" CASCADE;
DROP TABLE IF EXISTS "public"."events" CASCADE;
DROP TABLE IF EXISTS "public"."specimens" CASCADE;
DROP TABLE IF EXISTS "public"."missions" CASCADE;
DROP TABLE IF EXISTS "public"."mission_submissions" CASCADE;
DROP TABLE IF EXISTS "public"."community_posts" CASCADE;
DROP TABLE IF EXISTS "public"."community_comments" CASCADE;
DROP TABLE IF EXISTS "public"."community_likes" CASCADE;
DROP TABLE IF EXISTS "public"."clans" CASCADE;
DROP TABLE IF EXISTS "public"."players" CASCADE;
----------------------------------------------------------------
-- 1. NEWS TABLE (Ocean Gazette)
----------------------------------------------------------------
CREATE TABLE "public"."news" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "category" TEXT NOT NULL CHECK (
        "category" IN ('Positive News', 'Alert', 'Community')
    ),
    "image_url" TEXT,
    "content" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE "public"."news" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."news" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read news" ON "public"."news" FOR
SELECT USING (true);
-- Allow Admins to do EVERYTHING (Insert, Update, Delete)
CREATE POLICY "Admin full access news" ON "public"."news" FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
INSERT INTO "public"."news" (
        "title",
        "category",
        "image_url",
        "content",
        "created_at"
    )
VALUES (
        'Hawksbill Turtles Return to Pangandaran',
        'Positive News',
        'https://images.unsplash.com/photo-1518467166778-b88f373ffec7?q=80',
        'After a five-year absence, local conservationists report a record number of nesting sites along the southern coast.',
        NOW()
    ),
    (
        'Bleaching Event Detected',
        'Alert',
        'https://www.barrierreef.org/generated/share-image/oceanimagebank-theoceanagency-bleaching-15-jpg-qsejvo-imqvdtcnjybma-z71fubq-pn-jpg.jpg',
        'High water temperatures in the Java Sea Sector A-4 have triggered early warning systems. Divers are advised to monitor coral health.',
        NOW() - INTERVAL '2 days'
    ),
    (
        'New Ghost Net Hunters',
        'Community',
        'https://images.unsplash.com/photo-1621451537084-482c73073a0f?q=80',
        'The Maung Laut clan has successfully cleared 500kg of debris this week alone, setting a new regional record.',
        NOW() - INTERVAL '5 days'
    ),
    (
        'Sonar Anomaly Investigated',
        'Alert',
        'https://images.unsplash.com/photo-1551244072-5d12893278ab?q=80',
        'Unusual sonar readings have been detected near the Sunda Strait. Likely a playful pod of dolphins.',
        NOW() - INTERVAL '1 week'
    ),
    (
        'Giant Manta Sighting',
        'Positive News',
        'https://images.unsplash.com/photo-1498623116890-37e912163d5d?q=80',
        'A group of giant oceanic manta rays has been spotted feeding near Nusa Penida.',
        NOW() - INTERVAL '2 weeks'
    ),
    (
        'Plastic Free Initiative Success',
        'Community',
        'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?q=80',
        'Over 10,000 volunteers participated in the coastal cleanup, removing tons of plastic waste.',
        NOW() - INTERVAL '3 weeks'
    );
----------------------------------------------------------------
-- 2. LOCATIONS TABLE
----------------------------------------------------------------
CREATE TABLE "public"."locations" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "image_url" TEXT,
    "water_clarity" NUMERIC(3, 1),
    "biodiversity_score" TEXT,
    "current_condition" TEXT,
    "description" TEXT
);
ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read locations" ON "public"."locations" FOR
SELECT USING (true);
CREATE POLICY "Admin full access locations" ON "public"."locations" FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
INSERT INTO "public"."locations" (
        "name",
        "region",
        "image_url",
        "water_clarity",
        "biodiversity_score",
        "current_condition",
        "description"
    )
VALUES (
        'Menjangan Island',
        'West Bali National Park',
        'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80',
        9.5,
        'High',
        'Calm',
        'A pristine sanctuary offering wall diving with spectacular visibility. The calm waters make it perfect for beginners, while the rich marine life captivates veterans. Home to the rare Javan Deer.'
    ),
    (
        'Karimunjawa',
        'Central Java',
        'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?q=80',
        8.2,
        'High',
        'Calm',
        'The Caribbean of Java. Experience turquoise lagoons, shark conservation pools, and endless white sands. Ideal for island hopping and relaxed snorkeling tours.'
    ),
    (
        'Raja Ampat',
        'West Papua',
        'https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?q=80',
        9.8,
        'Critical',
        'Calm',
        'The global epicenter of marine biodiversity. Hidden lagoons, limestone karsts, and vibrant coral gardens await. A bucket-list destination for every serious diver.'
    ),
    (
        'Bunaken',
        'North Sulawesi',
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80',
        9.0,
        'High',
        'Rough',
        'Famous for its dramatic drop-offs and vertical coral walls. Teeming with turtles and macro life. The deep waters surrounding the park ensure excellent visibility year-round.'
    );
----------------------------------------------------------------
-- 3. EVENTS TABLE
----------------------------------------------------------------
CREATE TABLE "public"."events" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "end_date" TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    "status" TEXT DEFAULT 'Active',
    "metadata" JSONB
);
ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read events" ON "public"."events" FOR
SELECT USING (true);
INSERT INTO "public"."events" ("title", "description", "status", "metadata")
VALUES (
        'Battle of Java',
        'Current Directive: Which province can remove the most plastic from the North Coast sector?',
        'Active',
        '{"Sura Buaya": 45, "Maung Laut": 32, "Bhatara": 28, "Jawara": 15}'::jsonb
    );
----------------------------------------------------------------
-- 4. SPECIMENS TABLE
----------------------------------------------------------------
CREATE TABLE "public"."specimens" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "name" TEXT NOT NULL,
    "latin_name" TEXT NOT NULL,
    "type" TEXT NOT NULL CHECK ("type" IN ('Fauna', 'Flora', 'Relic')),
    "status" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "habitat" TEXT NOT NULL,
    "locked" BOOLEAN DEFAULT true,
    "required_level" INTEGER DEFAULT 1,
    "image_url" TEXT,
    "size" TEXT DEFAULT 'Unknown',
    "depth" TEXT DEFAULT 'Variable',
    "rarity" TEXT DEFAULT 'Common',
    "discovery_location" TEXT
);
ALTER TABLE "public"."specimens" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read specimens" ON "public"."specimens" FOR
SELECT USING (true);
CREATE POLICY "Admin full access specimens" ON "public"."specimens" FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
INSERT INTO "public"."specimens" (
        "name",
        "latin_name",
        "type",
        "status",
        "description",
        "habitat",
        "locked",
        "required_level",
        "image_url",
        "size",
        "depth",
        "rarity",
        "discovery_location"
    )
VALUES (
        'Javan Rhinoceros',
        'Rhinoceros sondaicus',
        'Fauna',
        'Critical',
        'One of the rarest large mammals on earth.',
        'Ujung Kulon National Park',
        true,
        5,
        'https://cdn-gonef.nitrocdn.com/UbWAxHlpDDRAfYTBoCBfYvGZgzkfyWTb/assets/images/optimized/rev-d7b6478/seethewild.org/wp-content/uploads/2022/09/javan-rhinoceros-768x432-1.jpg',
        '3.1 - 3.2m',
        'Land/Coastal',
        'Mythic',
        'Ujung Kulon'
    ),
    (
        'Hawksbill Turtle',
        'Eretmochelys imbricata',
        'Fauna',
        'Critical',
        'Critically endangered sea turtle known for their narrow, pointed beak.',
        'Karimunjawa / Thousand Islands',
        true,
        3,
        'https://media.australian.museum/media/dd/images/WWF_Hawksbill_Turtle_RSwwfau_13085.10790cd.width-1200.f825f2c.jpg',
        '1m',
        'Surface - 20m',
        'Legendary',
        'Karimunjawa'
    ),
    (
        'Giant Clam',
        'Tridacna gigas',
        'Fauna',
        'Vulnerable',
        'The largest living bivalve mollusc.',
        'Coral Reefs',
        false,
        1,
        'https://upload.wikimedia.org/wikipedia/commons/1/11/Giant_clam_or_Tridacna_gigas.jpg',
        '1.2m',
        'Shallow Reefs',
        'Rare',
        'Raja Ampat'
    ),
    (
        'Dugong',
        'Dugong dugon',
        'Fauna',
        'Vulnerable',
        'Marine mammal. Strict herbivore. Dependent on seagrass beds.',
        'Baluran National Park',
        true,
        10,
        'https://murexresorts.com/wp-content/uploads/2017/07/Dugong-Dugon-The-Sea-Cow-portrait.jpg',
        '3m',
        '1 - 30m',
        'Legendary',
        'Baluran'
    ),
    (
        'Mola Mola',
        'Mola mola',
        'Fauna',
        'Vulnerable',
        'The ocean sunfish is one of the heaviest known bony fishes.',
        'Nusa Penida',
        true,
        7,
        'https://upload.wikimedia.org/wikipedia/commons/9/98/Mola_mola.jpg',
        '1.8 - 3.3m',
        'Surface - 600m',
        'Legendary',
        'Crystal Bay'
    );
----------------------------------------------------------------
-- 5. MISSIONS TABLE
----------------------------------------------------------------
CREATE TABLE "public"."missions" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "xp_reward" INTEGER NOT NULL,
    "shell_reward" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "deadline" TEXT
);
ALTER TABLE "public"."missions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read missions" ON "public"."missions" FOR
SELECT USING (true);
CREATE POLICY "Admin full access missions" ON "public"."missions" FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
INSERT INTO "public"."missions" (
        "title",
        "location",
        "difficulty",
        "type",
        "xp_reward",
        "shell_reward",
        "description",
        "status",
        "deadline"
    )
VALUES (
        'Ghost Net Hunter',
        'Kepulauan Seribu, Jakarta',
        'Hard',
        'Cleanup',
        500,
        200,
        'Identify and report abandoned fishing nets entangled in the coral reef sector A-4.',
        'Available',
        '24h remaining'
    ),
    (
        'Mangrove Wall Initiative',
        'Muara Gembong, Bekasi',
        'Medium',
        'Restoration',
        300,
        150,
        'Plant 10 mangrove seedlings and upload geotagged photos.',
        'Active',
        '3 days remaining'
    ),
    (
        'Rhino Patrol Interface',
        'Ujung Kulon Sector 7',
        'Expert',
        'Patrol',
        1000,
        500,
        'Patrol the coastline boundary for signs of illegal trawling.',
        'Available',
        NULL
    ),
    (
        'Reef Monitor Alpha',
        'Bunaken National Park',
        'Easy',
        'Survey',
        150,
        50,
        'Conduct a 10-minute visual survey of the shallow reef.',
        'Available',
        '12h remaining'
    );
----------------------------------------------------------------
-- 6. CLANS & PLAYERS (Rich Profile System)
----------------------------------------------------------------
CREATE TABLE "public"."clans" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "name" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "members" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT DEFAULT 'text-gray-400'
);
ALTER TABLE "public"."clans" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read clans" ON "public"."clans" FOR
SELECT USING (true);
INSERT INTO "public"."clans" ("name", "province", "score", "members", "color")
VALUES (
        'Maung Laut',
        'Jawa Barat',
        12500,
        2450,
        'text-blue-400'
    ),
    (
        'Bhatara',
        'Jawa Tengah',
        11200,
        2100,
        'text-yellow-400'
    ),
    (
        'Sura Buaya',
        'Jawa Timur',
        13800,
        2800,
        'text-green-400'
    ),
    (
        'Jawara',
        'DKI Jakarta',
        9800,
        1500,
        'text-red-400'
    ),
    ('Badak', 'Banten', 8900, 1200, 'text-gray-400');
CREATE TABLE "public"."players" (
    "id" UUID REFERENCES auth.users(id) PRIMARY KEY,
    "name" TEXT,
    "clan" TEXT DEFAULT 'Drifters',
    "score" INTEGER DEFAULT 0,
    "role" TEXT DEFAULT 'Scout',
    -- 'Admin', 'Scout', 'Captain'
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Enhanced Profile Fields
    "avatar_url" TEXT DEFAULT 'https://api.dicebear.com/7.x/shapes/svg?seed=new',
    "bio" TEXT DEFAULT 'Ready for deployment.',
    "level" INTEGER DEFAULT 1,
    "xp" INTEGER DEFAULT 0,
    "shells" INTEGER DEFAULT 0,
    "rank_title" TEXT DEFAULT 'Novice',
    "equipped_frame" UUID,
    "equipped_title" UUID
);
ALTER TABLE "public"."players" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read players" ON "public"."players" FOR
SELECT USING (true);
CREATE POLICY "Users update self" ON "public"."players" FOR
UPDATE USING (auth.uid() = id);
-- TRIGGER: Automatically create detailed player profile on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$ BEGIN
INSERT INTO public.players (
        id,
        name,
        clan,
        score,
        role,
        avatar_url,
        bio,
        level,
        xp,
        rank_title
    )
VALUES (
        new.id,
        COALESCE(
            new.raw_user_meta_data->>'full_name',
            'Operative ' || substr(new.id::text, 1, 4)
        ),
        'Drifters',
        0,
        'Scout',
        'https://api.dicebear.com/7.x/shapes/svg?seed=' || new.id,
        'Ready for deployment.',
        1,
        0,
        'Novice'
    );
RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
----------------------------------------------------------------
-- 7. DUMMY AUTH & DATA POPULATION
----------------------------------------------------------------
-- Note: We assume these users exist or are created via Auth API.
-- For local dev with Supabase, you can run this block to seed 'players' if auth users exist.
-- If not, these inserts might fail silently or error depending on constraints.
-- For the sake of this file being the 'source of truth', we will insert directly into 'players' 
-- assuming foreign keys are disabled OR specific UUIDs are pre-generated.
-- IN REALITY: Sign up manually first, then UPDATE these records.
----------------------------------------------------------------
-- 8. MISSION SUBMISSIONS
----------------------------------------------------------------
CREATE TABLE "public"."mission_submissions" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "mission_id" UUID REFERENCES "public"."missions"("id"),
    "player_id" UUID REFERENCES "public"."players"("id") ON DELETE CASCADE,
    "status" TEXT DEFAULT 'Pending',
    "proof_url" TEXT,
    "verification_notes" TEXT,
    "submitted_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "reviewed_at" TIMESTAMP WITH TIME ZONE
);
ALTER TABLE "public"."mission_submissions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read submissions" ON "public"."mission_submissions" FOR
SELECT USING (true);
-- Allow Admins to UPDATE (e.g. Approve/Reject) submissions
CREATE POLICY "Admin update submissions" ON "public"."mission_submissions" FOR
UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Users insert submissions" ON "public"."mission_submissions" FOR
INSERT WITH CHECK (auth.uid() = player_id);
----------------------------------------------------------------
-- 9. COMMUNITY (Posts, Comments, Likes)
----------------------------------------------------------------
CREATE TABLE "public"."community_posts" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "user_id" UUID REFERENCES "public"."players"("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "image_url" TEXT,
    "category" TEXT DEFAULT 'General',
    "likes_count" INTEGER DEFAULT 0,
    "comments_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE "public"."community_posts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read posts" ON "public"."community_posts" FOR
SELECT USING (true);
CREATE POLICY "Users insert posts" ON "public"."community_posts" FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE TABLE "public"."community_comments" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "post_id" UUID REFERENCES "public"."community_posts"("id") ON DELETE CASCADE,
    "user_id" UUID REFERENCES "public"."players"("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE "public"."community_comments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read comments" ON "public"."community_comments" FOR
SELECT USING (true);
CREATE POLICY "Users insert comments" ON "public"."community_comments" FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE TABLE "public"."community_likes" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "post_id" UUID REFERENCES "public"."community_posts"("id") ON DELETE CASCADE,
    "user_id" UUID REFERENCES "public"."players"("id") ON DELETE CASCADE,
    UNIQUE("post_id", "user_id")
);
ALTER TABLE "public"."community_likes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read likes" ON "public"."community_likes" FOR
SELECT USING (true);
CREATE POLICY "Users insert likes" ON "public"."community_likes" FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete likes" ON "public"."community_likes" FOR DELETE USING (auth.uid() = user_id);
-- TRIGGERS FOR COUNTS (SYNC)
CREATE OR REPLACE FUNCTION public.handle_new_like() RETURNS trigger AS $$ BEGIN
UPDATE public.community_posts
SET likes_count = likes_count + 1
WHERE id = NEW.post_id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION public.handle_un_like() RETURNS trigger AS $$ BEGIN
UPDATE public.community_posts
SET likes_count = likes_count - 1
WHERE id = OLD.post_id;
RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_like_added
AFTER
INSERT ON public.community_likes FOR EACH ROW EXECUTE PROCEDURE public.handle_new_like();
CREATE TRIGGER on_like_removed
AFTER DELETE ON public.community_likes FOR EACH ROW EXECUTE PROCEDURE public.handle_un_like();
CREATE OR REPLACE FUNCTION public.handle_new_comment() RETURNS trigger AS $$ BEGIN
UPDATE public.community_posts
SET comments_count = comments_count + 1
WHERE id = NEW.post_id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION public.handle_un_comment() RETURNS trigger AS $$ BEGIN
UPDATE public.community_posts
SET comments_count = comments_count - 1
WHERE id = OLD.post_id;
RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_comment_added
AFTER
INSERT ON public.community_comments FOR EACH ROW EXECUTE PROCEDURE public.handle_new_comment();
CREATE TRIGGER on_comment_removed
AFTER DELETE ON public.community_comments FOR EACH ROW EXECUTE PROCEDURE public.handle_un_comment();
-- IMPORTANT: AFTER CREATING USERS manually (or via script), 
-- you can manually insert posts using their IDs.
-- 10. DUMMY COMMUNITY POSTS
----------------------------------------------------------------
INSERT INTO "public"."community_posts" (
        "content",
        "category",
        "likes_count",
        "comments_count",
        "image_url",
        "created_at"
    )
VALUES (
        'Just spotted a pod of dolphins near Sector 7! The water clarity is amazing today.',
        'Sighting',
        24,
        5,
        'https://images.unsplash.com/photo-1570701564993-e00652af8aa7?q=80',
        NOW() - INTERVAL '2 hours'
    ),
    (
        'Found a huge ghost net entangled in the reef. Need backup for extraction!',
        'Alert',
        56,
        12,
        'https://images.unsplash.com/photo-1621451537084-482c73073a0f?q=80',
        NOW() - INTERVAL '5 hours'
    ),
    (
        'Anyone up for a beach cleanup this weekend at Pangandaran?',
        'General',
        18,
        8,
        NULL,
        NOW() - INTERVAL '1 day'
    ),
    (
        'Successfully deployed 50 mangrove saplings with the Maung Laut clan!',
        'Milestone',
        89,
        2,
        'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?q=80',
        NOW() - INTERVAL '3 days'
    );
----------------------------------------------------------------
-- 10. ROLE MANAGEMENT (MANUAL PROMOTION)
----------------------------------------------------------------
-- To make a user an ADMIN, run this SQL command in your Supabase SQL Editor:
-- 1. Find the User ID (UUID) from the 'Authentication' tab or 'players' table.
-- 2. Run:
-- UPDATE public.players SET role = 'Admin' WHERE id = 'YOUR_USER_UUID_HERE';
-- Example:
-- UPDATE public.players SET role = 'Admin' WHERE email = 'admin@hiro.com';
-- (Note: 'email' is not in players table by default unless you joined it, so ID is safer)
----------------------------------------------------------------
-- 11. SHOP SYSTEM
----------------------------------------------------------------
CREATE TABLE "public"."shop_items" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL CHECK ("type" IN ('Frame', 'Title', 'Badge')),
    "cost" INTEGER NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "rarity" TEXT DEFAULT 'Common',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE "public"."shop_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read shop items" ON "public"."shop_items" FOR
SELECT USING (true);
CREATE POLICY "Admin manage shop" ON "public"."shop_items" FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TABLE "public"."user_inventory" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "user_id" UUID REFERENCES "public"."players"("id") ON DELETE CASCADE,
    "item_id" UUID REFERENCES "public"."shop_items"("id") ON DELETE CASCADE,
    "equipped" BOOLEAN DEFAULT false,
    "purchased_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("user_id", "item_id")
);
ALTER TABLE "public"."user_inventory" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own inventory" ON "public"."user_inventory" FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "users purchase items" ON "public"."user_inventory" FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update equip" ON "public"."user_inventory" FOR
UPDATE USING (auth.uid() = user_id);
-- SEED SHOP ITEMS
INSERT INTO "public"."shop_items" (
        "name",
        "type",
        "cost",
        "description",
        "image_url",
        "rarity"
    )
VALUES (
        'Neon Cyber',
        'Frame',
        500,
        'A glowing neon frame for the digital age.',
        'frame_neon_cyber',
        'Rare'
    ),
    (
        'Deep Diver',
        'Title',
        200,
        'Show your depth mastery.',
        'title_deep_diver',
        'Common'
    ),
    (
        'Abyssal Void',
        'Frame',
        1000,
        'Stare into the abyss.',
        'frame_abyssal',
        'Legendary'
    ),
    (
        'Coral Guardian',
        'Badge',
        300,
        'Protector of the reefs.',
        'badge_coral',
        'Uncommon'
    );
-- SQUAD SYSTEM
CREATE TABLE "public"."squads" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "leader_id" UUID REFERENCES "public"."players"("id"),
    "member_count" INTEGER DEFAULT 1,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE "public"."squad_members" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "squad_id" UUID REFERENCES "public"."squads"("id") ON DELETE CASCADE,
    "user_id" UUID REFERENCES "public"."players"("id") ON DELETE CASCADE,
    "role" TEXT DEFAULT 'Member',
    -- 'Leader', 'Member'
    "joined_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("user_id") -- Enforce one squad per user
);
ALTER TABLE "public"."squads" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read squads" ON "public"."squads" FOR
SELECT USING (true);
CREATE POLICY "Authenticated create squads" ON "public"."squads" FOR
INSERT WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "Leader update squads" ON "public"."squads" FOR
UPDATE USING (auth.uid() = leader_id);
ALTER TABLE "public"."squad_members" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read squad members" ON "public"."squad_members" FOR
SELECT USING (true);
CREATE POLICY "Join squad" ON "public"."squad_members" FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leave squad" ON "public"."squad_members" FOR DELETE USING (auth.uid() = user_id);
-- SEED SQUADS
INSERT INTO "public"."squads" (
        "name",
        "description",
        "leader_id",
        "member_count"
    )
VALUES (
        'Deep Sea Vanguards',
        'Exploring the deepest trenches.',
        NULL,
        5
    ),
    (
        'Coral Defenders',
        'Protecting the reefs at all costs.',
        NULL,
        12
    ),
    (
        'Abyssal Walkers',
        'We fear no darkness.',
        NULL,
        8
    );