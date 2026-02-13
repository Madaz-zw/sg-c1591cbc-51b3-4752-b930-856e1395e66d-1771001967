INSERT INTO storage.buckets (id, name, public)
VALUES ('job-photos', 'job-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Attempt to create policy only if it doesn't exist (and ignore errors if we lack permissions)
DO $$
BEGIN
    BEGIN
        CREATE POLICY "Public Access job-photos"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'job-photos' );
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy creation fails due to permissions
    END;
    
    BEGIN
        CREATE POLICY "Authenticated Uploads job-photos"
        ON storage.objects FOR INSERT
        WITH CHECK ( bucket_id = 'job-photos' AND auth.role() = 'authenticated' );
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if policy creation fails due to permissions
    END;
END
$$;