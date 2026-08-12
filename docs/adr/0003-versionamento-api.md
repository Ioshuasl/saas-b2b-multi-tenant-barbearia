# ADR-0003 — Versionamento da API por prefixo de URL

- **Status:** Aceito
- **Data:** 2026-08-12

## Contexto

A API é consumida pelo frontend web e, no futuro, por aplicativos móveis e integrações. Precisamos de versionamento explícito antes do primeiro cliente.

## Decisão

**Versionamento por prefixo de URL: `/api/v1/...`**, com as seguintes regras:

1. `v1` cobre toda a API pública desde o primeiro dia (nada de rota sem versão).
2. Mudanças **aditivas** não mudam a versão.
3. Mudanças **incompatíveis** exigem `v2`.
4. Ao lançar `v2`, `v1` é mantida por no mínimo **6 meses**, com `Deprecation` e `Sunset`.
5. A versão vive na **camada de interface**: rotas e schemas por versão; `services/` e `models/` são compartilhados.
6. Rotas experimentais/internas ficam em `/api/v1/internal/*`, sem garantia de estabilidade.
7. O contrato é gerado do código (Zod → OpenAPI) e verificado no CI.

```
backend/src/
├── routes/index.ts
└── modules/<dominio>/
    ├── routes/
    │   ├── v1/<dominio>.routes.ts
    │   └── v2/<dominio>.routes.ts        # criado só quando necessário
    ├── controllers/ · schemas/
    └── services/ · models/               # sem noção de versão
```

Três superfícies sob `/api/v1`:

| Superfície | Prefixo | Auth |
| --- | --- | --- |
| Pública | `/api/v1/public/{tenantSlug}[/{locationSlug}]` | nenhuma (rate-limited) |
| Painel | `/api/v1/*` | Bearer JWT |
| Plataforma | `/api/v1/platform/*` | JWT `platform_admin` |

## Consequências

**Positivas:** explícito, fácil de rotear/documentar, convenção de mercado.

**Negativas / custos aceitos:** duplicação de controllers/DTOs quando `v2` existir; no máximo duas versões ativas.

## Alternativas rejeitadas

Cabeçalho customizado, `Accept` versionado, query param, ou não versionar.

## Verificação

- CI compara OpenAPI gerado com baseline; mudança incompatível sem bump falha.
- Nenhuma rota fora de um router versionado.

## Referências

- [docs/08-api-v1.md](../08-api-v1.md) (será reescrito na Parte 2)
- RFC 8594 (`Sunset`); RFC 9745 (`Deprecation`)
