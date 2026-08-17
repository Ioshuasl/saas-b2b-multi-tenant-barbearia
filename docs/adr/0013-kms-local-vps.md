# ADR-0013 — Chaves e segredos: master key local na VPS agora; self-hosted depois

- **Status:** Aceito
- **Data:** 2026-08-17

## Contexto

O envelope encryption ([ADR-0007](./0007-criptografia-envelope-tenant.md)) exige KEK para wrap/unwrap das DEK por tenant, e a aplicação precisa de segredos de runtime (JWT, Resend, S3, WAHA, etc.). Candidatos: AWS KMS + Secrets Manager, master key local na VPS, ou Vault self-hosted. Já há conta AWS só para S3; a VPS Hostinger hospeda o app.

## Decisão

1. **Agora (MVP):**
   - **KEK (envelope):** chave mestra **local na VPS** — material só em arquivo ou variável de ambiente com permissão restrita (root/app user), **nunca** no repositório Git.
   - **Segredos de app:** arquivo `.env` / env injetado pelo EasyPanel na VPS (mesmo rigor: permissões, sem commit).
   - **DEK por tenant:** gerada na app, armazenada **wrapped** em `tenant_crypto_key` (plaintext DEK só em memória/cache curto).
2. **Futuro (intenção):** migrar KEK + segredos para solução **self-hosted** (ex.: **HashiCorp Vault** ou equivalente na VPS/stack própria), reduzindo dependência de arquivo plano e melhorando rotação/auditoria.
3. Tudo atrás de **`KeyManagementPort`** (+ loader de segredos), para trocar o adapter local → Vault (ou KMS) sem reescrever domínio/repositórios.
4. **AWS KMS não é adotado agora** (pode ser reconsiderado se a conta AWS crescer); prioridade declarada do time é self-hosted, não AWS.

### Controles obrigatórios enquanto a KEK for local

- Backup cifrado e separado da KEK (procedimento documentado; perda da KEK = dados envelope irrecuperáveis).
- Acesso à VPS com SSH por chave; sem KEK em ticket/chat/backup de disco sem criptografia.
- Rotação: rewrap de DEKs quando a KEK mudar (runbook).
- Dois ambientes = duas KEKs (staging ≠ production).
- Listar no threat model: compromisso da VPS implica compromisso da KEK — mitigar com menor privilégio e monitoramento.

## Consequências

**Positivas:** zero custo AWS além do S3; setup rápido no MVP; caminho explícito para Vault.

**Negativas:** sem HSM; blast radius se a VPS for comprometida é alto para dados cifrados com envelope; disciplina operacional é crítica. Aceito temporariamente com os controles acima.

## Alternativas

- **AWS KMS agora:** rejeitado por ora (preferência self-hosted futuro).
- **Vault já no MVP:** rejeitado temporariamente por carga de ops; permanece o **destino desejado**.

## Verificação

- CI/gitleaks: nenhuma KEK/DEK no repo.
- Teste: app não sobe em produção sem KEK configurada.
- Runbook de backup/restore da KEK escrito antes do primeiro tenant com notas reais.
- Adapter `LocalKeyManagementAdapter` isolado; interface estável para `VaultKeyManagementAdapter` futuro.

## Referências

- [ADR-0007 — Envelope por tenant](./0007-criptografia-envelope-tenant.md)
- [ADR-0008 — VPS + S3](./0008-hospedagem-vps-hostinger-s3.md)
- [docs/17-seguranca-baseline.md](../17-seguranca-baseline.md)
