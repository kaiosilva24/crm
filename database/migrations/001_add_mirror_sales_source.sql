ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS mirror_sales_source_id INTEGER REFERENCES campaigns(id);
COMMENT ON COLUMN campaigns.mirror_sales_source_id IS 'ID of the campaign to mirror sales from. If a lead enters that campaign, it will be marked as sold in this campaign.';
