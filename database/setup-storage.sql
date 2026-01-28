-- Setup Supabase Storage for Space Images
-- Run this in Supabase SQL Editor to create the storage bucket

-- Create storage bucket for space images
INSERT INTO storage.buckets (id, name, public)
VALUES ('space-images', 'space-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload space images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'space-images');

-- Create storage policy to allow everyone to view images
CREATE POLICY "Everyone can view space images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'space-images');

-- Create storage policy to allow authenticated users to update their images
CREATE POLICY "Authenticated users can update space images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'space-images');

-- Create storage policy to allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete space images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'space-images');

