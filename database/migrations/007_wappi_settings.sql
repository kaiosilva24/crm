-- Tabela para armazenar configurações da Wappi
CREATE TABLE IF NOT EXISTS wappi_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_token VARCHAR(255) NOT NULL,
    profile_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Política de RLS (apenas autenticados podem ver/editar)
ALTER TABLE wappi_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users on wappi_settings" ON wappi_settings;
CREATE POLICY "Allow all for authenticated users on wappi_settings" ON wappi_settings
    FOR ALL USING (true) WITH CHECK (true);
