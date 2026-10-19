# Demandas — melhorias para facilitar a viagem

Diretriz: **custo zero** (planos gratuitos e APIs públicas sem cadastro). Opções pagas só como sugestão.
Viagem: setembro de 2027. Ordem sugerida: 1 → 2 → 3 → 4 → 5.

| # | Demanda | Status |
|---|---|---|
| 1 | Modo offline | ✅ Concluída |
| 2 | Tela "Hoje" + Carteira de viagem | ✅ Concluída |
| 3 | Planejamento mais rápido | A fazer |
| 4 | Lembretes + gasto rápido | A fazer |
| 5 | Pós-viagem: resumo e diário | A fazer |

---

## 1. Modo offline ✅

**Objetivo:** o app funciona sem internet e sincroniza sozinho quando a conexão volta.

- [x] Dados das viagens salvos no aparelho (cache do React Query persistido; ao abrir uma viagem, todas as listas dela são carregadas).
- [x] Fila de alterações offline, enviada em ordem quando a internet volta — mesmo se o app for fechado no meio:
      gastos, roteiro, checklist e anotações (criar, editar, excluir). A mudança aparece na tela na hora.
- [x] Reservas e documentos avisam que precisam de internet (a reserva mexe junto no gasto e no roteiro; documento é arquivo).
- [x] Aviso discreto: "Sem conexão · N alterações na fila" / "Enviando…".
- [x] Versão web/iPhone (Tela de Início) abre sem internet: service worker (`public/sw.js`) guarda os arquivos do app.
- [x] Ao sair ou trocar de conta, o cache salvo é apagado.

**Pronto quando:** em modo avião, o app abre, mostra tudo e aceita um gasto novo; ao religar a internet, o gasto
aparece para os outros viajantes. *(Testado: 7 passos, na versão de produção com o Supabase local.)*

## 2. Tela "Hoje" + Carteira de viagem ✅

**Objetivo:** abriu o app durante a viagem, já sabe o que fazer.

- [x] **Hoje:** nas datas da viagem, a Visão geral começa pela agenda do dia (atividades, reservas, check-out e devoluções), com "Como chegar", copiar código e previsão do tempo (Open-Meteo, grátis). O clima também aparece em cada dia do Roteiro.
- [x] **Carteira:** códigos de reserva em destaque (toque para copiar), próximas primeiro, "Como chegar" e documentos (passaporte, seguro, visto, vouchers).
- [x] **Emergência:** telefones do país do destino (tabela no app, funciona offline), contatos da viagem com ligar, e link para o Portal Consular do Itamaraty (o telefone do consulado fica nos contatos).

**Pronto quando:** nas datas da viagem a Visão geral abre no "Hoje" e qualquer código fica a 2 toques. *(Testado: 8 passos.)*

## 3. Planejamento mais rápido

**Objetivo:** menos digitação e menos esquecimentos antes de viajar.

- [ ] **Importar reserva:** colar o texto do e-mail da reserva e o Tripi preenche data, horário, código, local e valor (leitura no próprio app, sem IA paga; você confere antes de salvar).
- [ ] **Prazos de documentos:** alerta se o passaporte vence a menos de 6 meses da volta; lembretes de seguro, ETIAS e visto.
- [ ] **Checklist inteligente:** sugestões pelo destino e mês (adaptador de tomada, casaco etc.).

**Pronto quando:** colando o e-mail de uma reserva aérea ou de hotel, a reserva aparece preenchida para revisar.

## 4. Lembretes + gasto rápido

**Objetivo:** não perder horários e registrar gastos na hora.

- [ ] **Lembretes:** "Voo em 3 h", "Check-out até 11h", "Atividade em 1 h" — configuráveis por viagem.
- [ ] **Gasto rápido:** lançar valor e categoria em 2 toques, com foto do recibo opcional.

**Pronto quando:** o celular avisa antes de um compromisso e um gasto é lançado em menos de 5 segundos.
**Custo:** começar pela notificação gratuita da versão web/PWA (limitada no iPhone). Notificação completa exige app via TestFlight (US$ 99/ano) — só se decidirmos.

## 5. Pós-viagem: resumo e diário

**Objetivo:** fechar a viagem com tudo organizado.

- [ ] **Resumo:** total em reais, média por dia, por categoria e por pessoa, acerto final.
- [ ] **Diário:** uma anotação e fotos por dia, exportáveis em PDF/álbum (fotos comprimidas para caber no 1 GB grátis do Supabase).

**Pronto quando:** ao terminar a viagem o app mostra o resumo e gera o PDF com o diário.
