# Supabase Storage Setup for Space Images

This guide will help you set up Supabase Storage to store images for desks, meeting rooms, and parking spots.

## Step 1: Create Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Set the following:
   - **Name**: `space-images`
   - **Public bucket**: ✅ Enable (checked)
   - Click **Create bucket**

## Step 2: Set Up Storage Policies

Run the SQL script `database/setup-storage.sql` in your Supabase SQL Editor, or manually create the following policies:

### Policy 1: Allow authenticated users to upload images
```sql
CREATE POLICY "Authenticated users can upload space images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'space-images');
```

### Policy 2: Allow everyone to view images
```sql
CREATE POLICY "Everyone can view space images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'space-images');
```

### Policy 3: Allow authenticated users to update images
```sql
CREATE POLICY "Authenticated users can update space images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'space-images');
```

### Policy 4: Allow authenticated users to delete images
```sql
CREATE POLICY "Authenticated users can delete space images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'space-images');
```

## Step 3: Add image_url Column to Desks Table

Run the SQL script `database/add-image-url.sql` in your Supabase SQL Editor:

```sql
ALTER TABLE desks 
ADD COLUMN IF NOT EXISTS image_url TEXT;
```

Or if you're setting up from scratch, the `database/schema.sql` already includes the `image_url` column.

## Verification

After setup:
1. Go to **Storage** → **space-images** bucket
2. Try uploading a test image manually
3. Check that the image is accessible via public URL

## Image Requirements

- **Accepted formats**: JPG, PNG, WebP
- **Maximum size**: 5MB per image
- **Recommended dimensions**: 800x600px or higher (will be automatically resized for display)

## Troubleshooting

### Images not uploading
- Check that the bucket is public
- Verify storage policies are correctly set
- Check browser console for errors

### Images not displaying
- Verify the `image_url` column exists in the `desks` table
- Check that image URLs are valid and accessible
- Ensure the bucket is set to public

### Permission errors
- Verify you're logged in as an authenticated user
- Check that all storage policies are correctly configured

