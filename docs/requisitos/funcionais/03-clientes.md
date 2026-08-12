# RF — Clientes (E3)

**Módulo:** `customers` · **Detalhe:** [modulos/03-clientes.md](../../modulos/03-clientes.md)

| ID | Requisito | Prioridade | Rastreabilidade |
| --- | --- | --- | --- |
| RF-E3-01 | Cliente final é identificado por telefone normalizado E.164; cadastro mínimo: nome + telefone | Must | US-02, E6 |
| RF-E3-02 | Unicidade `(tenant_id, phone)` — mesmo telefone em redes diferentes são clientes distintos | Must | doc 07, LGPD |
| RF-E3-03 | Na primeira reserva (página pública ou painel), o sistema cria o cliente automaticamente se não existir | Must | E6, J2 |
| RF-E3-04 | Base de clientes é **única na rede**; histórico mostra em qual unidade cada atendimento ocorreu | Must | E1b, US-07 |
| RF-E3-05 | `OWNER`/`MANAGER`/`RECEPTIONIST` listam e buscam clientes por nome parcial ou telefone | Must | E6 |
| RF-E3-06 | Ficha do cliente exibe histórico de atendimentos (unidade, profissional, serviços, valor) e total gasto | Must | E6 |
| RF-E3-07 | E-mail é opcional; CPF **não** é coletado no MVP | Must | doc 10 (minimização) |
| RF-E3-08 | `marketing_opt_in` separado; sem opt-in, mensagens de marketing não são enviadas (transacionais permitidas) | Must | doc 10 |
| RF-E3-09 | Observações administrativas no cadastro (não são prontuário clínico) | Should | módulo customers |
| RF-E3-10 | Exclusão de cliente é inativação/anonimização via fluxo LGPD; agendamentos históricos preservados para integridade | Must | doc 10, RF-E9 |
| RF-E3-11 | `first_location_id` registra a unidade onde o cliente apareceu pela primeira vez | Must | doc 07 |
| RF-E3-12 | Telefone inválido é rejeitado na borda (Zod) com mensagem clara | Must | US-02 |

## Critérios de aceite transversais (E3)

- Cliente da unidade A aparece com histórico completo ao agendar na unidade B (mesma rede).
- Página pública não expõe telefone/e-mail de outros clientes.
- Aviso de privacidade na página pública deixa claro que os dados ficam com a **rede**.

## Fora do MVP (rastreio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-E3-13 | Programa de fidelidade / cupons | Could (fase 2) |
| RF-E3-14 | Fusão de duplicatas | Could (fase 2) |
| RF-E3-15 | Conta/login do cliente final | Won't (MVP — anti-fricção) |
