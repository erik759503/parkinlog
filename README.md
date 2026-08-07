# Parkinlog (ParkControl)

## Como o sistema funciona

O Parkinlog e uma aplicacao web para controle de frota em portaria, com autenticacao, perfis de acesso e registro de entradas/saidas de veiculos.

Fluxo principal:

1. O usuario faz login com usuario e senha. O frontend converte o usuario para o dominio interno `@parkcontrol.internal` quando necessario.
2. A aplicacao consulta o perfil do usuario (`dev`, `admin`, `office` ou `gate`).
3. Rotas privadas sao liberadas apos autenticacao.
4. O menu e as telas visiveis mudam conforme o papel.
5. Os dados (veiculos, motoristas, movimentacoes e logs de auditoria) sao lidos e gravados por uma API backend conectada ao TiDB.
6. Ao registrar uma movimentacao:
	 - `entry` marca o veiculo como no patio (`in_yard = true`)
	 - `exit` marca o veiculo como fora do patio (`in_yard = false`)

Resumo de permissao:

- `dev`: acesso mais amplo, incluindo dashboard, cadastro de veiculos/motoristas, usuarios e logs de auditoria.
- `admin`: acesso operacional completo, com gestao de veiculos, motoristas, movimentacoes, portaria e usuarios de nivel `office`/`gate`.
- `office`: acesso restrito a consultas e operacao em `movements`.
- `gate`: foco operacional em portaria e consulta de movimentacoes.
- A seguranca efetiva deve ser reforcada na API backend (nao apenas no frontend).

## Visao geral

- Frontend: React + TypeScript + Vite
- UI: Tailwind + shadcn/ui (Radix)
- Estado de servidor e cache: TanStack Query
- Roteamento: React Router
- Backend e Auth: API propria conectada ao TiDB
- Testes: Vitest + Testing Library

## Modulos funcionais

### 1) Dashboard

- Mostra indicadores do dia: entradas, saidas, total e veiculos no patio.
- Lista ultimas movimentacoes com veiculo e motorista.

### 2) Veiculos

- Cadastro e edicao de veiculos.
- Filtros por numero interno, placa e modelo.
- Controle de status (`active`/`inactive`) e presenca no patio (`inYard`).
- Apenas `dev` e `admin` podem criar, editar ou excluir.

### 3) Motoristas

- Cadastro e edicao de motoristas.
- Filtro por nome e matricula.
- Controle de status (`active`/`inactive`).
- Apenas `dev` e `admin` podem criar, editar ou excluir.

### 4) Movimentacoes

- Historico de entradas e saidas com filtros por texto, tipo e data.
- Exportacao Excel (`.xlsm`).
- Exibe metodo de identificacao (`automatic`/`manual`) e confirmacao (`camera`/`gate`).
- Qualquer usuario autenticado pode registrar movimentacoes; a API deve gravar `registered_by` com o usuario autenticado.
- Apenas `dev` e `admin` podem corrigir/excluir movimentacoes pela interface.
- O export inclui `registeredByUsername` e `registeredByRole` quando disponiveis.

### 5) Portaria

- Registro manual de entrada/saida.
- Selecao de veiculo e motorista ativos.
- Correcao de movimentacoes do dia.
- A rota e visivel para `dev`, `admin` e `gate`.

### 6) Usuarios

- Listagem de usuarios com perfil.
- Criacao de novos usuarios.
- Alteracao de permissao com hierarquia: `dev` pode criar/editar/excluir todos os perfis; `admin` pode gerenciar apenas `office` e `gate`.
- Acesso restrito para `dev` e `admin`.

## Arquitetura tecnica

### Autenticacao e contexto

- `AuthContext`:
	- Mantem sessao e usuario logado.
	- Faz login com usuario ou email e logout.
	- Busca papel do usuario na tabela `user_roles`, usando `gate` como fallback quando nao ha registro.
- `ProtectedRoute`:
	- Bloqueia rotas privadas para usuarios nao autenticados.
- `AppRole`:
	- Considera `dev`, `admin`, `office` e `gate`.
- `AppContext`:
	- Centraliza carregamento e operacoes de `vehicles`, `drivers` e `movements`.
	- Executa refresh apos inserts/updates.

### Roteamento

- Publica: `/login`
- Privadas:
	- `/` dashboard para `dev` e `admin`
	- `/vehicles` para `dev` e `admin`
	- `/drivers` para `dev` e `admin`
	- `/movements` para todos os usuarios autenticados
	- `/gate` para `dev`, `admin` e `gate`
	- `/users` para `dev` e `admin`
- Fallback: rota `*` para pagina 404.

### Banco de dados (TiDB)

Tabelas principais:

- `profiles`: dados basicos do usuario
- `user_roles`: papel de acesso (`dev`, `admin`, `office` ou `gate`)
- `vehicles`: cadastro de veiculos
- `drivers`: cadastro de motoristas
- `movements`: historico operacional de entrada/saida
- `user_action_logs`: auditoria de acoes de usuarios
- `deletion_logs`: auditoria de exclusoes

Schema TiDB:

- `tidb/001_schema.sql` cria o banco `parkinlog` e as tabelas da aplicacao.
- `tidb/README.md` descreve como importar o schema no TiDB Cloud.

## Regras de seguranca

- Leitura de `vehicles`, `drivers` e `movements`: usuarios autenticados.
- Escrita de `vehicles` e `drivers`: `dev` e `admin`.
- Insert de `movements`: usuario autenticado, obrigando `registered_by` igual ao usuario logado.
- Update/Delete de `movements`: `dev` e `admin`.
- Gestao de papeis em `user_roles`: `dev` pode gerir todos os perfis; `admin` pode gerir apenas `office` e `gate`.
- Logs de auditoria: acesso restrito a `dev` e `admin`.
- Essas regras devem ser implementadas na API backend. TiDB nao possui RLS equivalente ao Supabase.

## Requisitos

- Node.js 18+ (recomendado 20+)
- npm 9+ (ou bun, se preferir)
- API backend configurada com conexao TiDB

## Configuracao de ambiente

Crie um arquivo `.env` na raiz com:

```env
VITE_API_URL=http://localhost:3000/api
```

Nao coloque `DB_HOST`, `DB_USERNAME` ou `DB_PASSWORD` em variaveis `VITE_*`: variaveis Vite sao enviadas ao navegador.

## Instalacao e execucao

1. Instale dependencias:

```bash
npm install
```

2. Rode em desenvolvimento:

```bash
npm run dev
```

3. Gere build de producao:

```bash
npm run build
```

4. Rode preview local da build:

```bash
npm run preview
```

## Scripts disponiveis

- `npm run dev`: servidor local Vite
- `npm run build`: build de producao
- `npm run build:dev`: build em modo desenvolvimento
- `npm run lint`: analise ESLint
- `npm run test`: executa testes uma vez
- `npm run test:watch`: modo watch de testes

## Estrutura do projeto

```text
src/
	components/        componentes reutilizaveis e layout
	contexts/          AuthContext e AppContext
	data/              mocks de apoio
	pages/             telas da aplicacao
	test/              setup e testes
	types/             tipos de dominio
tidb/
	001_schema.sql     schema TiDB/MySQL da aplicacao
```

## Observacoes importantes

- O controle visual de menu por perfil acontece no frontend, mas a seguranca de dados deve ser garantida pela API.
- A criacao de usuario deve ser feita pela API, validando a hierarquia de perfis e gravando logs de auditoria.
- O login usa um identificador curto de usuario e senha; a API deve validar o hash armazenado em `app_users.password_hash`.
- Existe um usuario protegido por regra de negocio (`erikdev`) que nao pode ser excluido.
- Para ambiente produtivo, configure confirmacao de email, politicas de senha e auditoria no Supabase.

## Testes

Executar:

```bash
npm run test
```

Obs.: atualmente existe um teste de exemplo em `src/test/example.test.ts`.
