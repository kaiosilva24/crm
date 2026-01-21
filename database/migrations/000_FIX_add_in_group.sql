-- FIX: Add missing in_group column to leads
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE leads ADD COLUMN in_group BOOLEAN DEFAULT false;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;
