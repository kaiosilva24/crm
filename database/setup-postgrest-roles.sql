-- SQL para configurar permissões no PostgreSQL do Render
-- Execute este script no Neon SQL Editor ou via psql

-- 1. Criar role anon (usuário anônimo para queries via PostgREST)
CREATE ROLE anon NOLOGIN;

-- 2. Criar role service_role (admin para operações privilegiadas)
CREATE ROLE service_role NOLOGIN;

-- 3. Dar permissões básicas ao anon
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 4. Dar permissões completas ao service_role
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 5. Garantir permissões para tabelas futuras (anon)
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT USAGE, SELECT ON SEQUENCES TO anon;

-- 6. Garantir permissões para tabelas futuras (service_role)
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT ALL ON SEQUENCES TO service_role;

-- 7. Verificar roles criadas
SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'service_role');

-- 8. Verificar permissões
\dp

-- ✅ Configuração concluída!
-- Agora você pode usar PostgREST com estas roles
