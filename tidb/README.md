# Migracao Supabase para TiDB

Este projeto hoje usa Supabase como banco, autenticacao, RLS e Edge Functions. O TiDB Cloud e compativel com MySQL, entao a migracao do banco exige duas frentes:

1. Criar/importar o schema e os dados no TiDB.
2. Trocar o acesso direto `supabase-js` no frontend por uma API backend segura.

Nao coloque `DB_HOST`, `DB_USERNAME` ou `DB_PASSWORD` em variaveis `VITE_*`: tudo que usa `VITE_*` vai para o navegador.

## Banco de destino

As credenciais informadas apontam para:

```env
DB_HOST=gateway01.us-east-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USERNAME=wkF6X7PzDYQDfce.root
DB_DATABASE=sys
```

Recomendacao: nao use `sys` para as tabelas da aplicacao. O arquivo `001_schema.sql` cria e usa um banco chamado `parkinlog`. Se voce realmente quiser usar `sys`, altere as linhas `CREATE DATABASE` e `USE`, mas isso nao e recomendado.

## Criar o schema

Com o cliente MySQL instalado:

```bash
mysql -h gateway01.us-east-1.prod.aws.tidbcloud.com -P 4000 -u 'wkF6X7PzDYQDfce.root' -p --ssl-mode=REQUIRED < tidb/001_schema.sql
```

Quando solicitado, informe a senha real do TiDB Cloud.

Depois de executar, confira se as tabelas foram criadas:

```sql
USE parkinlog;
SHOW TABLES;
SHOW CREATE TABLE movements;
```

O resultado esperado em `SHOW TABLES` inclui:

- `app_users`
- `profiles`
- `user_roles`
- `vehicles`
- `drivers`
- `movements`
- `deletion_logs`
- `user_action_logs`

## Ordem de importacao dos dados

Importe os dados nesta ordem para respeitar as dependencias:

1. `app_users`
2. `profiles`
3. `user_roles`
4. `vehicles`
5. `drivers`
6. `movements`
7. `deletion_logs`
8. `user_action_logs`

## Observacao sobre usuarios e senhas

No Supabase, os usuarios ficam em `auth.users`, fora do schema `public`. O novo schema cria `app_users` para substituir essa dependencia, mas as senhas nao podem ser migradas diretamente pelo frontend.

Caminhos seguros:

- recriar usuarios no TiDB e forcar redefinicao de senha;
- exportar hashes de `auth.users` apenas com acesso administrativo controlado e adaptar a API para validar o mesmo algoritmo;
- manter Supabase Auth temporariamente e migrar so os dados operacionais primeiro.

## O que ainda precisa mudar no app

O frontend atual chama:

- `supabase.auth.signInWithPassword`
- `supabase.auth.getSession`
- `supabase.from(...)`
- `supabase.functions.invoke(...)`

Para TiDB, isso deve virar endpoints backend, por exemplo:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/me`
- `GET/POST/PATCH/DELETE /api/vehicles`
- `GET/POST/PATCH/DELETE /api/drivers`
- `GET/POST/PATCH/DELETE /api/movements`
- `GET/POST/PATCH/DELETE /api/users`

As regras que hoje estavam no RLS do Supabase precisam ser aplicadas nessa API.

## Observacoes sobre TiDB

- O schema usa `DEFAULT (UUID())` em IDs `CHAR(36)`, recurso suportado por TiDB para colunas string.
- As foreign keys foram declaradas para preservar integridade. Em versoes atuais do TiDB Cloud elas sao suportadas, mas em clusters antigos podem ser ignoradas ou depender da variavel `tidb_enable_foreign_key`.
- TiDB nao substitui RLS do Supabase. O backend deve validar papeis (`dev`, `admin`, `office`, `gate`) antes de qualquer operacao.
