-- Migration: Allow WebP uploads in menu-photos bucket
-- Fix: Migration 007 restricted mime types to JPEG/PNG only,
-- but the photo processing pipeline (Phase 90) converts all uploads to WebP.

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'menu-photos';
