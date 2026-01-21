-- Migration: Add separate field for second tag
-- This allows independent configuration of Tag 1 and Tag 2

ALTER TABLE cart_abandonment_settings 
ADD COLUMN IF NOT EXISTS manychat_tag_name_second VARCHAR(255);

-- Set default for existing rows (append _2 to current tag)
UPDATE cart_abandonment_settings 
SET manychat_tag_name_second = CONCAT(COALESCE(manychat_tag_name, 'abandono_carrinho'), '_2')
WHERE manychat_tag_name_second IS NULL;
