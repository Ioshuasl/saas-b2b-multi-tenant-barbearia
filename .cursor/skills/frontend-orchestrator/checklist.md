# Checklist de conformidade — Frontend

**Ler só no gate final.**

## Pré

- [ ] Package, entidade, tipo de tela e ops identificados
- [ ] Rules `frontend-*.mdc` usadas
- [ ] Shard UI lido só se necessário (máx. 1–2)
- [ ] Alinhado a `docs/16` / `docs/09`

## Por camada

- [ ] Types em `types/`; enums em `enum/`; sem `interfaces/`
- [ ] Data único HTTP; Service thin; Hook com Query/Mutation
- [ ] Index não chama API; modais condicionais
- [ ] Form vs FormDialog corretos
- [ ] Page só compõe

## Final

- [ ] Fluxo Page → … → Data intacto
- [ ] Package não importa outro package
- [ ] queryKeys invalidados após mutações
