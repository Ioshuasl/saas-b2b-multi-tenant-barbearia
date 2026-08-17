# ADR-0007 — Envelope encryption por tenant (modelo enterprise)

- **Status:** Aceito
- **Data:** 2026-08-17
- **Contexto do projeto:** SaaS B2B multi-tenant para barbearias

## Contexto

Precisamos proteger dado pessoal livre (notas, observações) além do isolamento por RLS e da criptografia de volume do provedor. Três abordagens foram consideradas:

1. **Somente TLS + at-rest de infra + RLS** — necessário, mas insuficiente se um backup ou dump vazar em plaintext de aplicação.
2. **Envelope encryption por tenant (AES-GCM, KEK no KMS)** — servidor descriptografa em memória no request autorizado.
3. **E2EE verdadeira no cliente** — servidor só armazena ciphertext; chave com o usuário/dispositivo.

O produto exige busca de cliente por telefone, agenda operacional, relatórios, WhatsApp (WAHA), exportação LGPD e break-glass auditado — todos incompatíveis com E2EE completa no MVP sem redesenhar o domínio.

## Decisão

Adotamos o **modelo enterprise (opção 2)**:

1. TLS 1.2+ em todos os hops externos e para serviços gerenciados.
2. Criptografia em repouso do provedor (banco, backups, object storage SSE).
3. **Envelope encryption por tenant** para campos de texto livre definidos no [doc 17](../17-seguranca-baseline.md):
   - DEK (AES-256-GCM) por tenant
   - KEK **local na VPS** no MVP ([ADR-0013](./0013-kms-local-vps.md)); intenção futura: Vault self-hosted
   - DEK armazenada apenas wrapped (`tenant_crypto_key`)
   - AAD ligando ciphertext a `tenantId` + recurso
4. Decrypt somente após contexto de tenant (RLS) + autorização RBAC.
5. Port `KeyManagementPort` isola o provedor (`LocalKeyManagementAdapter` agora).
6. **Não** adotamos E2EE no cliente no MVP. Qualquer mudança futura exige novo ADR.

### Campos cifrados no MVP (mínimo)

- `customer.notes`
- `appointment.notes`

Campos de busca/operação (nome, telefone E.164, agenda, valores em centavos, status) permanecem plaintext sob RLS.

## Consequências

**Positivas**

- Dump de banco ou backup sem KEK não expõe notas em plaintext.
- Mantém busca, relatórios, WhatsApp, exportação e suporte controlado.
- Alinhado ao prontuário odontológico de referência (mesmo modelo, campos do domínio da barbearia).
- Rotação de KEK via rewrap; auditoria de uso de chave possível no KMS/Vault.

**Negativas / custos aceitos**

- A plataforma ainda processa plaintext em memória (somos operador LGPD) — mitigado por RBAC, RLS, audit, anomalias e menor privilégio.
- Latência e complexidade de unwrap/cache de DEK — mitigado com cache curto em memória por processo e métricas.
- Busca full-text nas notas não é trivial sem plaintext — aceito: notas não são campo de busca do MVP.
- Implementação incorreta (logar plaintext, decrypt cedo demais) é risco — mitigado por lint/revisão e testes.

## Alternativas rejeitadas

**E2EE no cliente:** máximo sigilo contra operador, porém inviabiliza ou encarece demais busca server-side, relatórios, templates WhatsApp, exportação LGPD automatizada e break-glass. Rejeitado para o MVP.

**Somente criptografia de volume:** rejeitado como camada única — não protege contra vazamento lógico de linhas em plaintext na aplicação/backup lógico.

**Uma DEK global da aplicação:** rejeitado — blast radius de um vazamento de chave seria toda a base; por tenant limita o impacto e facilita offboarding/anonimização.

## Verificação

- Teste: campo cifrado no banco não é plaintext legível (grep/SQL direto).
- Teste: decrypt sem contexto de tenant / sem permissão falha.
- Teste: ciphertext e DEK nunca aparecem em logs (fixture + assert no logger fake).
- Teste: AAD incorreto (tenant errado) falha a autenticação GCM.
- CI: gitleaks; sem chave KMS/DEK no repositório.
- Runbook: rotação de KEK e backup da KEK documentados antes do primeiro cliente pagante.

## Referências

- [docs/17-seguranca-baseline.md](../17-seguranca-baseline.md)
- [docs/10-seguranca-lgpd-compliance.md](../10-seguranca-lgpd-compliance.md)
- [ADR-0002 — Multi-tenancy RLS](./0002-multi-tenancy-rls.md)
- [ADR-0013 — KEK local na VPS](./0013-kms-local-vps.md)
- [15 — Glossário](./15-glossario.md) §4
- NIST SP 800-57 (key management); OWASP Cryptographic Storage Cheat Sheet
