-- Allow null status_id in leads table (to show "-selecione-" in UI)
ALTER TABLE public.leads 
ALTER COLUMN status_id DROP NOT NULL;
