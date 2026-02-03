-- 1. ADD MISSING COLUMNS TO PLAYERS
ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS shells INTEGER DEFAULT 0;
-- 2. ENSURE FOREIGN KEYS REFERENCE PLAYERS (The Central Hub)
-- We drop existing constraints if they point to auth.users and recreate them pointing to public.players
-- This ensures 'players' is the source of truth for application logic.
-- Mission Submissions
ALTER TABLE public.mission_submissions DROP CONSTRAINT IF EXISTS mission_submissions_player_id_fkey;
ALTER TABLE public.mission_submissions
ADD CONSTRAINT mission_submissions_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE;
-- Community Comments
ALTER TABLE public.community_comments DROP CONSTRAINT IF EXISTS community_comments_user_id_fkey;
ALTER TABLE public.community_comments
ADD CONSTRAINT community_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.players(id) ON DELETE CASCADE;
-- Community Likes
ALTER TABLE public.community_likes DROP CONSTRAINT IF EXISTS community_likes_user_id_fkey;
ALTER TABLE public.community_likes
ADD CONSTRAINT community_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.players(id) ON DELETE CASCADE;
-- 3. AUTOMATIC SYNC: TRIGGERS FOR LIKES & COMMENTS COUNTS
-- These triggers ensure the counts in 'community_posts' are ALWAYS accurate and in-sync.
-- Function: Like Added
CREATE OR REPLACE FUNCTION public.handle_new_like() RETURNS trigger AS $$ BEGIN
UPDATE public.community_posts
SET likes_count = likes_count + 1
WHERE id = NEW.post_id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function: Like Removed
CREATE OR REPLACE FUNCTION public.handle_un_like() RETURNS trigger AS $$ BEGIN
UPDATE public.community_posts
SET likes_count = likes_count - 1
WHERE id = OLD.post_id;
RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Triggers for Likes
DROP TRIGGER IF EXISTS on_like_added ON public.community_likes;
CREATE TRIGGER on_like_added
AFTER
INSERT ON public.community_likes FOR EACH ROW EXECUTE PROCEDURE public.handle_new_like();
DROP TRIGGER IF EXISTS on_like_removed ON public.community_likes;
CREATE TRIGGER on_like_removed
AFTER DELETE ON public.community_likes FOR EACH ROW EXECUTE PROCEDURE public.handle_un_like();
-- Function: Comment Added
CREATE OR REPLACE FUNCTION public.handle_new_comment() RETURNS trigger AS $$ BEGIN
UPDATE public.community_posts
SET comments_count = comments_count + 1
WHERE id = NEW.post_id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function: Comment Removed
CREATE OR REPLACE FUNCTION public.handle_un_comment() RETURNS trigger AS $$ BEGIN
UPDATE public.community_posts
SET comments_count = comments_count - 1
WHERE id = OLD.post_id;
RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Triggers for Comments
DROP TRIGGER IF EXISTS on_comment_added ON public.community_comments;
CREATE TRIGGER on_comment_added
AFTER
INSERT ON public.community_comments FOR EACH ROW EXECUTE PROCEDURE public.handle_new_comment();
DROP TRIGGER IF EXISTS on_comment_removed ON public.community_comments;
CREATE TRIGGER on_comment_removed
AFTER DELETE ON public.community_comments FOR EACH ROW EXECUTE PROCEDURE public.handle_un_comment();
-- 4. REFRESH SCHEMA CACHE
NOTIFY pgrst,
'reload schema';