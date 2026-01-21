-- Verificar estrutura da tabela api_settings
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'api_settings' 
ORDER BY ordinal_position;
