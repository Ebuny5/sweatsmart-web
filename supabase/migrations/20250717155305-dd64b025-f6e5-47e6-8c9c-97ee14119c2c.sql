
-- Add YouTube URL and website URL columns to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.user_settings.youtube_url IS 'Optional YouTube video URL for sharing hyperhidrosis story';
COMMENT ON COLUMN public.user_settings.website_url IS 'Optional website URL for hyperhidrosis resources and information';
