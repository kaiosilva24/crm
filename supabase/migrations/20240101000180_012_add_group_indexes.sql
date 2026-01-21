-- Migration: Add indexes for faster group synchronization
-- Date: 2024-01-05

-- Index for filtering leads by group status
CREATE INDEX IF NOT EXISTS idx_leads_in_group ON leads(in_group);

-- Index for looking up leads by phone number (used heavily during sync)
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
