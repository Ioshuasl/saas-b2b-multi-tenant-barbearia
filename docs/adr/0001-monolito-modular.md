# ADR-0001 — Monólito modular com Clean Architecture e DDD

- **Status:** Aceito
- **Data:** 2026-08-12
- **Contexto do projeto:** SaaS B2B multi-tenant para barbearias, MVP com time pequeno

## Contexto

Precisamos de uma arquitetura que suporte um domínio com invariantes fortes (agenda sem overbooking, isolamento entre redes, billing) com um time de 1–2 desenvolvedores, sem sacrificar a possibilidade de crescer. As alternativas consideradas foram microsserviços desde o início, monólito em camadas técnicas globais e monólito modular com fronteiras de domínio.

## Decisão

Adotamos **monólito modular** com um módulo por bounded context (`identity`, `locations`, `customers`, `scheduling`, `billing`, `messaging`, `reporting`, `subscription`), cada um internamente organizado em camadas de **Clean Architecture**, com modelagem de domínio rica (DDD) e princípios SOLID.

As camadas usam o padrão Orius do time — 1 arquivo por operação (`list`/`get`/`create`/`update`/`delete`), classes curtas (`CreateService`, `ListRepository`), `actions/` só com efeito além do repositório, e `models/` rico (DDD). Nomenclatura de arquivo: `snake_case` no backend. O mapeamento completo e o exemplo canônico `Customer` estão em [16 — Estrutura de Pastas](../16-estrutura-de-pastas.md).

Regras de fronteira:

1. Dependências apontam para dentro: borda → `services/` → `models/`. O domínio não conhece Express, Prisma nem HTTP.
2. Um módulo só acessa outro pelo `<dominio>_public.ts` do outro (ports/DTOs), nunca por internals.
3. Comunicação síncrona por port quando o resultado precisa ser atômico/imediato; assíncrona por eventos de domínio + outbox nos demais casos.
4. Um único banco, mas cada módulo é dono das suas tabelas.
5. Um único artefato de deploy (`api`), com o worker rodando o mesmo código em outro comando.

As regras 1 e 2 são verificadas automaticamente no CI (ESLint boundaries + dependency-cruiser).

## Consequências

**Positivas**

- Uma transação de banco cobre operações que atravessam módulos, sem saga distribuída.
- Um deploy, um ambiente local, um pipeline: custo operacional mínimo para time pequeno.
- Extração futura de um módulo (candidatos: `messaging`, `reporting`) é possível porque a fronteira existe desde o início.
- Testes de domínio rápidos e sem I/O.

**Negativas / custos aceitos**

- Escala é do processo inteiro. Aceitável: o gargalo previsto é banco.
- Exige disciplina e verificação automática de fronteiras.
- Mais cerimônia que um CRUD direto — reservada a onde há invariante (agenda, billing, isolamento).

## Alternativas rejeitadas

**Microsserviços desde o início:** custo operacional desproporcional a um time pequeno sem clientes ainda.

**Monólito em camadas técnicas globais** (um `/controllers`, `/services` na raiz): rápido no mês 1 e lento no mês 12.

**DDD/Clean em tudo, sem exceção:** rejeitado por pragmatismo. Recursos essencialmente CRUD usam versão enxuta.

## Verificação

- `pnpm arch:check` (dependency-cruiser) falha se `models/` importar framework ou se houver ciclo.
- ESLint `boundaries` falha em import de internals de outro módulo.
- Cobertura mínima de 85% em `models/`.

## Referências

- [docs/05-arquitetura.md](../05-arquitetura.md)
- Evans, *Domain-Driven Design*; Martin, *Clean Architecture*
