# Sidebar 360 e Details

Norma: `docs/09` (atendimento, inbox) · `docs/16`.

A **Sidebar de página** é a coluna sticky à **direita** (360px). Não confundir com a sidebar global do app (`shared/layout`).

## 1. Anatomia

```
[ main flex-1 min-w-0 ]   [ aside 360px ]
  conteúdo                 Card sticky
                           → navegação OU ações
```

```tsx
<div className="flex gap-4">
  <main className="flex min-w-0 flex-1 flex-col gap-4">{/* ... */}</main>
  <aside className="hidden w-[360px] shrink-0 lg:block">
    <div className="sticky top-4 z-10 max-h-[calc(100vh-2rem)] overflow-auto">
      <Card>{/* nav ou ações */}</Card>
    </div>
  </aside>
</div>
```

Regras: `aside` a partir de `lg`; sticky; um Card; main com `min-w-0`.

## 2. Dois conteúdos (não misturar no mesmo Card)

| Conteúdo | Quando | Exemplo |
|---|---|---|
| **Navegação** | Form longo (seções) | Orçamento: itens → descontos → pagamento |
| **Ações** | Details / pós-registro | Cliente: agendar, enviar WhatsApp |

## 3. Details

- Coluna principal: dados + timeline / histórico
- Sidebar: ações contextuais + destrutivas com ConfirmDialog
- Sem edição “silenciosa” de dado clínico — evolução usa amend

## 4. Atendimento clínico (referência `docs/09`)

Layout de três áreas na rota de atendimento (não é Sidebar 360 clássica, mas o mesmo princípio de foco):

```
Alertas clínicos (topo, sempre visíveis)
Histórico de atendimentos | Próximos agendamentos
Histórico / anexos
```

Alertas `CRITICAL` não são dispensáveis.

## 5. Inbox WhatsApp

Três colunas: conversas | thread | painel do cliente (ações rápidas).  
Indicador explícito da janela de 24h. Ver `docs/09` §4.3.
