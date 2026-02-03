-- 1. ALLOW NPC CREATION (Remove strict auth.users link)
-- We need to drop the Foreign Key that forces every player to be a real auth user.
-- This allows us to create "NPC" accounts for the community.
ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_id_fkey;
-- 2. IDENTIFY REAL USER (Your Account) & PROMOTE TO ADMIN
-- We assume the first user created is YOU. We make you an Admin.
UPDATE public.players
SET role = 'Admin',
    rank_title = 'Fleet Admiral',
    level = 50,
    xp = 99999
WHERE id = (
        SELECT id
        FROM public.players
        ORDER BY created_at ASC
        LIMIT 1
    );
-- 3. CREATE NPC USERS (Profiles only)
INSERT INTO public.players (
        id,
        name,
        role,
        rank_title,
        level,
        avatar_url,
        bio
    )
VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Captain Sarah',
        'Moderator',
        'Deep Sea Captain',
        25,
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80',
        'Serving the ocean for 10 years. Respect the reef.'
    ) ON CONFLICT (id) DO
UPDATE
SET name = EXCLUDED.name;
INSERT INTO public.players (
        id,
        name,
        role,
        rank_title,
        level,
        avatar_url,
        bio
    )
VALUES (
        '00000000-0000-0000-0000-000000000002',
        'Ranger Mike',
        'User',
        'Scout',
        12,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80',
        'Always looking for new species. Photography enthusiast.'
    ) ON CONFLICT (id) DO
UPDATE
SET name = EXCLUDED.name;
INSERT INTO public.players (
        id,
        name,
        role,
        rank_title,
        level,
        avatar_url,
        bio
    )
VALUES (
        '00000000-0000-0000-0000-000000000003',
        'Dr. Aris',
        'User',
        'Marine Biologist',
        30,
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80',
        'Studying coral bleaching patterns. Data saves lives.'
    ) ON CONFLICT (id) DO
UPDATE
SET name = EXCLUDED.name;
-- 4. ASSIGN POSTS TO NPCs
UPDATE public.community_posts
SET user_id = '00000000-0000-0000-0000-000000000001'
WHERE id IN (
        SELECT id
        FROM public.community_posts
        ORDER BY created_at DESC
        LIMIT 1 OFFSET 0
    );
UPDATE public.community_posts
SET user_id = '00000000-0000-0000-0000-000000000002'
WHERE id IN (
        SELECT id
        FROM public.community_posts
        ORDER BY created_at DESC
        LIMIT 1 OFFSET 1
    );
UPDATE public.community_posts
SET user_id = '00000000-0000-0000-0000-000000000003'
WHERE id IN (
        SELECT id
        FROM public.community_posts
        ORDER BY created_at DESC
        LIMIT 1 OFFSET 2
    );
-- 5. CREATE DUMMY COMMENTS FROM NPCs
INSERT INTO public.community_comments (post_id, user_id, content)
SELECT id,
    '00000000-0000-0000-0000-000000000002',
    'Great find! Reporting this to the central database.'
FROM public.community_posts
WHERE user_id != '00000000-0000-0000-0000-000000000002'
    AND NOT EXISTS (
        SELECT 1
        FROM public.community_comments
        WHERE post_id = public.community_posts.id
            AND user_id = '00000000-0000-0000-0000-000000000002'
    )
LIMIT 1;
INSERT INTO public.community_comments (post_id, user_id, content)
SELECT id,
    '00000000-0000-0000-0000-000000000003',
    'Be careful, currents are strong in that sector today.'
FROM public.community_posts
WHERE user_id != '00000000-0000-0000-0000-000000000003'
    AND NOT EXISTS (
        SELECT 1
        FROM public.community_comments
        WHERE post_id = public.community_posts.id
            AND user_id = '00000000-0000-0000-0000-000000000003'
    )
LIMIT 1;
-- 6. RECALCULATE COUNTS
UPDATE public.community_posts p
SET likes_count = (
        SELECT COUNT(*)
        FROM public.community_likes
        WHERE post_id = p.id
    ),
    comments_count = (
        SELECT COUNT(*)
        FROM public.community_comments
        WHERE post_id = p.id
    );