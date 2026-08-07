
# Mapa de Permissões — Estado Atual do Sistema

Visão consolidada do que cada perfil pode fazer hoje, considerando UI (menus e botões), regras do servidor (RLS no banco) e edge functions.

## Hierarquia

```text
DEV  (super-admin, inclui ErikDEV protegido)
 └── Admin
      ├── Escritório
      └── Portaria
```

---

## Resumo rápido (matriz)

| Recurso / Ação                          | DEV | Admin | Escritório | Portaria |
|-----------------------------------------|:---:|:-----:|:----------:|:--------:|
| **Dashboard**                           | ver | ver   | —          | —        |
| **Veículos** — visualizar               | sim | sim   | —          | —        |
| **Veículos** — criar / editar           | sim | sim   | não        | não      |
| **Veículos** — excluir                  | sim | sim   | não        | não      |
| **Motoristas** — visualizar             | sim | sim   | —          | —        |
| **Motoristas** — criar / editar         | sim | sim   | não        | não      |
| **Motoristas** — excluir                | sim | sim   | não        | não      |
| **Portaria** — lançar entrada/saída     | sim | sim   | não        | sim      |
| **Movimentações** — visualizar          | sim | sim   | sim        | sim      |
| **Movimentações** — editar              | sim | sim   | não        | não      |
| **Movimentações** — excluir             | sim | sim   | não        | não      |
| **Movimentações** — exportar .xlsm      | sim | sim   | sim        | sim      |
| **Usuários** — acessar a aba            | sim | sim   | não        | não      |
| **Usuários** — criar DEV                | sim | não   | —          | —        |
| **Usuários** — criar Admin              | sim | não   | —          | —        |
| **Usuários** — criar Escritório/Portaria| sim | sim   | —          | —        |
| **Usuários** — alterar permissão        | sim (exceto DEV) | sim (só Office/Gate) | — | — |
| **Usuários** — alterar senha            | sim (exceto DEV) | sim (só Office/Gate) | — | — |
| **Usuários** — excluir                  | sim (exceto DEV e ErikDEV) | sim (só Office/Gate) | — | — |
| **Logs de exclusão / ações**            | sim | sim   | não        | não      |

Legenda: "—" = nem aparece no menu para esse perfil.

---

## Detalhe por perfil

### DEV (controle total)
- Vê todos os menus: Dashboard, Veículos, Motoristas, Movimentações, Portaria, Usuários.
- Carros/Motoristas: cria, edita e exclui.
- Movimentações: lança, edita, exclui e exporta o relatório `.xlsm` respeitando filtros.
- Usuários: cria qualquer perfil (inclusive outros DEV), troca senha e permissão de Admin/Escritório/Portaria.
- Não pode excluir outro DEV nem excluir o usuário protegido **ErikDEV**, nem alterar a permissão dele.
- Acessa logs de auditoria (exclusões e ações de usuários).

### Admin
- Vê os mesmos menus que o DEV.
- Carros e Motoristas: cria, edita e exclui livremente.
- Movimentações: lança, edita, exclui e exporta `.xlsm`.
- Usuários: só pode criar/editar/excluir/alterar senha de **Escritório** e **Portaria**.
- Não pode tocar em DEV nem em outros Admin (criar Admin, promover a Admin, alterar senha de Admin ou excluir Admin é bloqueado).
- Vê logs de auditoria.

### Escritório (só leitura + relatório)
- Menu mostra apenas **Movimentações**.
- Pode visualizar todas as movimentações e exportar o relatório `.xlsm` com os filtros aplicados (data, carro, busca).
- Não cria, não edita e não exclui nada.
- Não tem acesso à aba Usuários, nem aos logs.

### Portaria (operacional)
- Menu mostra **Portaria** e **Movimentações**.
- Pode lançar entradas e saídas pela tela Portaria (selecionando carro e motorista existentes).
- Em Movimentações: apenas visualiza e pode exportar `.xlsm`.
- Não edita nem exclui registros, não cadastra carros/motoristas, não acessa Usuários.

---

## Regras especiais e segurança

- **ErikDEV** é o usuário-raiz: nunca pode ser excluído nem ter o cargo alterado, mesmo por outro DEV.
- Todo lançamento de movimentação grava automaticamente **quem registrou** (usuário + perfil). Esses campos aparecem na tabela e na exportação `.xlsm`.
- **Exclusões** (carro, motorista, movimentação) pedem confirmação e geram registro em `deletion_logs` (quem, quando, dados removidos).
- **Ações sobre usuários** (criar, excluir, mudar senha, mudar permissão) geram registro em `user_action_logs` (quem fez, perfil, alvo, data/hora).
- As regras valem em três camadas: UI esconde o que o perfil não pode fazer, edge functions validam a hierarquia no servidor, e o banco aplica RLS — então mesmo uma chamada direta à API é bloqueada.

---

## Pontos de atenção que encontrei (sugestões de ajuste)

Na revisão, achei dois detalhes que talvez você queira corrigir num próximo passo. Eles **não quebram a segurança** (o servidor bloqueia), mas afetam a experiência:

1. **Páginas de Veículos e Motoristas não escondem os botões "Novo" e "Editar" para perfis sem permissão.** Hoje quem protege é só o menu lateral (Portaria e Escritório não veem o link). Se um usuário Portaria digitar `/vehicles` na URL, ele consegue abrir a tela e clicar em "Novo Veículo" — a ação falha pelo RLS, mas aparece um erro em vez de o botão ficar oculto.
2. **Não há um "guard" por rota.** Bloqueio é por menu + RLS. Posso adicionar um redirect automático para a Home/Login se um perfil acessar uma rota fora do escopo dele.

Se quiser, no próximo passo eu fecho esses dois pontos e adiciono também a página `/audit-log` para você visualizar os logs de exclusão e de ações de usuário pela interface.
