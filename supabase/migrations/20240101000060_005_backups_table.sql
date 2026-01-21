-- Tabela para armazenar backups no Supabase
CREATE TABLE IF NOT EXISTS backups (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    total_leads INTEGER DEFAULT 0,
    total_schedules INTEGER DEFAULT 0,
    data JSONB NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscar backups por data
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at DESC);

-- RLS para backups
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON backups
    FOR ALL USING (true) WITH CHECK (true);
