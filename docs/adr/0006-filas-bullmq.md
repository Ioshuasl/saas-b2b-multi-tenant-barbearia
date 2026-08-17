# ADR-0006 — Filas com BullMQ + Redis e padrão Outbox transacional

- **Status:** Aceito
- **Data:** 2026-08-17
- **Contexto do projeto:** SaaS B2B multi-tenant para barbearias, MVP

## Contexto

Várias operações não podem (nem devem) acontecer dentro do ciclo de requisição HTTP:

- enviar WhatsApp de confirmação e lembretes 24h e 2h antes (agendados no futuro, com horário exato);
- processar webhooks do WhatsApp sem bloquear a resposta ao gateway;
- expirar trial, marcar `PAST_DUE` e aplicar `grace_until` (cron por tenant, respeitando timezone da unidade);
- gerar exportações CSV e miniaturas de imagem;
- entregar eventos de domínio entre módulos.

Duas questões distintas precisam de resposta: **qual mecanismo de fila** e **como garantir que um evento não se perca** quando a transação de banco comita mas o publish falha (ou vice-versa).

## Decisão

### 1. BullMQ sobre Redis como mecanismo de fila

Já usamos Redis para cache e rate limit; BullMQ oferece jobs com delay (essencial para lembretes 24h/2h), repetição por cron, retry com backoff exponencial, prioridade, concorrência controlada, `jobId` para deduplicação e uma UI de inspeção. O worker roda **o mesmo artefato** da API com outro comando — sem duplicação de código nem pipeline extra.

Filas: `messaging`, `scheduling`, `billing`, `reporting`, `platform` (detalhes em [doc 11 §7](../11-infra-devops.md)).

### 2. Outbox transacional como fonte da verdade dos eventos

Eventos de domínio **nunca** são publicados diretamente no Redis dentro de um use case. Eles são gravados em `outbox_event` na **mesma transação** do agregado:

```ts
await this.uow.run(ctx, async (tx) => {
  await this.appointments.save(ctx, appointment);
  await this.outbox.append(tx, appointment.pullEvents());   // mesma transação
});
// dispatcher (a cada 5s) lê o outbox e enfileira no BullMQ
```

Assim, ou o dado e o evento existem juntos, ou nenhum dos dois existe. Nunca há confirmação de agendamento sem agendamento, nem agendamento sem notificação agendada.

### 3. Regras obrigatórias para todo job

1. **Idempotência sempre.** A entrega é *at-least-once*: todo handler precisa tolerar reexecução (chave natural, `jobId`, unique index ou verificação de estado).
2. **Contexto de tenant explícito** no payload; o handler abre o contexto RLS como qualquer outra operação.
3. **Payload pequeno e por referência** (IDs, não objetos inteiros) — evita dado obsoleto e Redis inflado. Nunca PII desnecessária no payload (telefone, nome, notas).
4. **Retry com backoff exponencial** e limite; falha definitiva vai para DLQ com alerta.
5. **Timeout por job** e log estruturado com `requestId` propagado.
6. **Cron por tenant respeitando timezone da unidade** (não do servidor).
7. Job que envia mensagem verifica **janela de silêncio**, consentimento (marketing), kill switch e sessão `CONNECTED` antes de enviar.

## Consequências

**Positivas**

- Sem evento perdido nem "fantasma": a garantia é do banco, não da ordem das chamadas.
- Requisições HTTP rápidas: o usuário não espera e-mail ou WhatsApp.
- Retry automático absorve indisponibilidade temporária de provedor externo.
- Jobs com delay resolvem elegantemente lembretes agendados (sem tabela de polling própria).
- Reprocessamento é possível: o outbox é histórico auditável de eventos.
- Fila e worker isolam falha: um provedor lento não derruba a API.

**Negativas / custos aceitos**

- Redis passa a ser dependência crítica de operação assíncrona. Mitigação: Redis com persistência; se cair, o outbox retém os eventos e a entrega acontece na volta (a operação síncrona continua funcionando).
- Latência de até ~5 s entre o commit e a entrega do evento. Aceitável para tudo que é assíncrono; o que precisa ser imediato usa port síncrono.
- Complexidade extra: uma tabela, um dispatcher, disciplina de idempotência. Aceito — a alternativa é perder mensagem.
- Ordem só é garantida por tenant/agregado (entrega ordenada por `created_at` na fila do tenant), não globalmente.
- Mais uma coisa para monitorar (tamanho de fila, idade de job, DLQ, lag do outbox). Já previsto nos alertas.

## Alternativas rejeitadas

**Publicar direto no Redis dentro do use case:** duas fontes de verdade sem transação comum. Cenários reais de falha: commit ok + publish falha (cliente nunca recebe confirmação) ou publish ok + rollback (cliente recebe confirmação de horário que não existe). Inaceitável.

**Postgres como fila (`SELECT … FOR UPDATE SKIP LOCKED`):** elimina o Redis e é perfeitamente viável nesta escala. Rejeitado por falta de suporte nativo a delay/cron/retry/prioridade — teríamos que construir e manter isso, e já temos Redis por outros motivos.

**Serviço gerenciado (SQS/Pub-Sub):** acopla a um provedor, complica o desenvolvimento local e não oferece jobs com delay longo de forma tão direta. Reavaliar em escala muito maior.

**Fazer tudo síncrono na requisição:** timeouts, experiência ruim e impossibilidade de lembrete agendado. Descartado de imediato.

## Verificação

- Falha no dispatcher mantém o evento pendente e o reentrega depois (teste com dispatcher derrubado).
- Handler executado duas vezes com o mesmo payload produz um único efeito (teste por job).
- Job que falha 5 vezes vai para a DLQ e gera alerta.
- Cancelar agendamento remove os jobs de notificação pendentes.
- Cron de assinatura/inadimplência respeita timezone da unidade (teste com unidades em fusos diferentes).
- Nenhum payload de job contém PII desnecessária (teste de schema).

## Referências

- [docs/05-arquitetura.md](../05-arquitetura.md)
- [docs/11-infra-devops.md](../11-infra-devops.md)
- Padrão *Transactional Outbox*
