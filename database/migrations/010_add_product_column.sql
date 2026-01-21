-- Add product column to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS product TEXT;

-- Index for searching by product
CREATE INDEX IF NOT EXISTS idx_leads_product ON public.leads(product);
