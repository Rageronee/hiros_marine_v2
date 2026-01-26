-- ================================================================
-- HIRO MARINE // DATA PURGE PROTOCOL
-- ================================================================
-- WARNING: THIS WILL DELETE ALL DATA IN THE SYSTEM.
-- USE ONLY FOR RESETTING THE PROTOTYPE DATABASE.
-- ================================================================
BEGIN;
-- 1. Truncate all content tables (Cascade will handle dependent relations)
TRUNCATE TABLE "public"."news" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "public"."locations" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "public"."events" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "public"."specimens" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "public"."missions" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "public"."mission_submissions" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "public"."community_posts" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "public"."community_comments" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "public"."community_likes" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "public"."clans" RESTART IDENTITY CASCADE;
-- 2. NOTE: We do NOT delete 'players' (Users) automatically 
-- to prevent locking you out of Auth. 
-- If you want to delete players too, uncomment the line below:
-- TRUNCATE TABLE "public"."players" RESTART IDENTITY CASCADE;
COMMIT;
-- PROTOCOL COMPLETE