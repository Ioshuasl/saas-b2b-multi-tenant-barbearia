# ADR-0011 — UUID v7 gerado na aplicação

- **Status:** Aceito
- **Data:** 2026-08-12

## Contexto

A arquitetura define IDs como **UUID v7** (ordenáveis por tempo, bons para índice B-tree, não sequenciais previsíveis). Alternativas: gerar na aplicação (biblioteca) ou no Postgres (extensão/função).

## Decisão

1. **UUID v7 é gerado na aplicação** via biblioteca TypeScript (ex.: pacote `uuid` com API v7, ou equivalente mantida).
2. Serviços/actions obtêm ID por port ou helper `IdGenerator` / `ids.next()` — não espalhar `uuidv7()` solto nas bordas.
3. No Prisma/Postgres: coluna `id UUID PRIMARY KEY` **sem** depender de extensão de UUID v7 no banco para o caminho feliz.
4. Testes unitários de domínio usam o mesmo gerador (ou fake injetável).

## Consequências

**Positivas:** comportamento idêntico em local/VPS/CI; sem extensão Postgres extra; alinhado ao fluxo `Entity.create(id, …)`.

**Negativas:** se alguém inserir SQL manual sem ID, falha — aceitável; inserts administrativos usam a app ou geram v7 explicitamente.

## Alternativa rejeitada

**Geração no Postgres:** rejeitada — acopla a extensão/versão do servidor e complica testes sem banco.

## Verificação

- Todo `create` de agregado passa por `IdGenerator`.
- Lint/revisão: sem `uuidv4` como PK de entidade de domínio.
- Migrações não exigem `pg_uuidv7` nem similar.

## Referências

- [docs/05-arquitetura.md](../05-arquitetura.md) §9
- [docs/07-modelo-de-dados.md](../07-modelo-de-dados.md)
