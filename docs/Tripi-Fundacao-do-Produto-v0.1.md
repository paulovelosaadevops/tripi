# Tripi — Fundação do Produto

**Versão:** 0.6  
**Data:** 18 de setembro de 2026  
**Status:** Decisões iniciais aprovadas

## Visão

O Tripi será desenvolvido como um produto comercial orientado à produção, desde a estratégia e validação até a publicação na App Store e no Google Play.

O produto deve centralizar o planejamento e o acompanhamento de viagens, reduzindo a dispersão de informações entre planilhas, anotações, aplicativos bancários, documentos e mensagens.

## Público inicial

O mercado pretendido é o de viajantes em geral, mas o primeiro perfil priorizado será o **viajante organizador**: a pessoa que planeja a própria viagem, individualmente ou para acompanhantes, sem depender de uma agência.

## Problema central

Informações essenciais de uma viagem ficam distribuídas em várias ferramentas, dificultando o planejamento, o controle financeiro e o acompanhamento durante a viagem.

## Proposta de valor

> O Tripi reúne planejamento e controle financeiro da viagem em um único lugar, permitindo que o organizador acompanhe tudo e compartilhe informações com seus acompanhantes.

## Núcleo da primeira versão

1. **Viagens**
   - Destino, datas, moeda, participantes e status.
2. **Roteiros**
   - Programação por dia, horários, lugares e observações.
3. **Orçamento previsto**
   - Planejamento por categorias e visão do custo total.
4. **Gastos realizados**
   - Lançamentos, comparação entre previsto e realizado e saldo disponível.
5. **Convites**
   - O organizador controla a viagem e convida acompanhantes.

## Jornada principal

1. Criar uma viagem.
2. Definir orçamento e categorias.
3. Montar o roteiro por dia.
4. Registrar gastos durante a viagem.
5. Comparar valores previstos e realizados.
6. Convidar acompanhantes.
7. Manter o histórico e iniciar novas viagens.

## Direção de monetização

- O modelo deverá incentivar o uso recorrente e o planejamento de várias viagens.
- A hipótese inicial é oferecer os planos **Tripi Free** e **Tripi Premium**.
- A cobrança Premium deverá considerar assinatura anual como oferta principal e assinatura mensal como alternativa.
- Os limites, preços e benefícios definitivos ainda serão validados por pesquisa de mercado e testes com usuários.

## Regra aprovada para convidados

- O usuário que organiza a viagem pode convidar outras pessoas.
- Um convidado no plano **Free** terá acesso a uma experiência limitada.
- O convidado poderá contratar seu próprio plano **Premium** para desbloquear benefícios adicionais.
- Os benefícios Premium do organizador não serão automaticamente transferidos aos convidados.
- O detalhamento das permissões de visualização, edição e recursos financeiros de cada plano será definido na matriz de acesso do produto.

## Princípios do produto

- Desenvolvimento orientado à produção.
- Aplicativo para Android e iOS.
- Nada de funcionalidades simuladas na versão publicável.
- Segurança, privacidade, LGPD, testes e monitoramento desde a fundação.
- Inteligência artificial somente quando entregar valor real.
- Controle dos custos operacionais desde o início.
- Experiência simples, moderna e agradável.
- Decisões de produto e arquitetura documentadas e versionadas.

## Posicionamento atual

> **Tripi é o painel central da sua viagem: acompanhe roteiro, orçamento, gastos e próximos compromissos em um único lugar.**

**Posicionamento internacional:**

> **Tripi is your travel control center — itinerary, budget, expenses, and everything ahead in one clear dashboard.**

## Mercado inicial

- O lançamento será planejado como **global desde o início**.
- Português e inglês estarão disponíveis na primeira versão.
- A arquitetura deverá permitir a inclusão de novos idiomas sem textos fixos no código.
- O produto deverá tratar moedas, datas, horários e fusos de forma localizada.
- A precificação poderá variar por país e pelas regras das lojas.
- Privacidade e tratamento de dados considerarão LGPD e GDPR desde a fundação.

## Experiência central: painel contextual

O dashboard será o principal motivo para o usuário abrir o Tripi durante toda a viagem. Seu conteúdo mudará conforme o momento da jornada.

### Antes da viagem

- Contagem regressiva.
- Orçamento planejado.
- Pendências e checklist.
- Situação do roteiro.
- Próximas reservas e pagamentos.

### Durante a viagem

- Roteiro do dia.
- Próxima atividade.
- Gastos do dia e acumulados.
- Saldo disponível.
- Alertas e pendências importantes.

### Depois da viagem

- Total previsto e realizado.
- Resumo por categoria.
- Lugares visitados.
- Linha do tempo e recordações.
- Histórico comparativo entre viagens.

## Pilares oficiais

1. **Planejar:** criar viagem, orçamento e roteiro.
2. **Acompanhar:** visualizar tudo no painel contextual.
3. **Controlar:** registrar gastos e comparar previsto e realizado.
4. **Compartilhar:** convidar acompanhantes com permissões específicas.
5. **Relembrar:** manter histórico e resultados das viagens.

## Matriz inicial Free × Premium

| Capacidade | Free | Premium |
| --- | --- | --- |
| Criar primeira viagem completa | Sim | Sim |
| Viagens ativas simultâneas | 1 | Ilimitadas |
| Histórico de viagens | Visualização básica | Completo e comparativo |
| Roteiro e painel | Essencial | Avançado |
| Orçamento e gastos | Essencial | Relatórios e múltiplas moedas |
| Convidados | Visualização limitada | Permissões e colaboração |
| Anexos e documentos | Limite reduzido | Limite ampliado |
| Uso offline | Não | Sim |
| Exportação | Não | PDF e CSV |
| Indicadores financeiros | Básicos | Detalhados |

Esta matriz foi aprovada como direção inicial. Quantidades, limites técnicos e regras detalhadas ainda serão definidos antes da implementação.

## Papéis e autorização

- **Organizador:** proprietário da viagem e responsável por conteúdo, convites e permissões.
- **Convidado Viewer:** acompanha somente as informações compartilhadas.
- **Convidado Collaborator:** usuário Premium autorizado pelo organizador a editar módulos específicos.
- O plano da conta define os recursos comerciais disponíveis.
- O papel na viagem define o que o usuário está autorizado a visualizar ou alterar.
- Ser Premium nunca concede acesso automático a dados privados de outra pessoa.
- No MVP não haverá coorganizador.

## Matriz de permissões aprovada

| Ação | Organizador Free | Organizador Premium | Convidado Free | Convidado Premium |
| --- | :---: | :---: | :---: | :---: |
| Visualizar painel completo | Sim | Sim | Não | Sim |
| Visualizar painel resumido | Sim | Sim | Sim | Sim |
| Visualizar roteiro do dia | Sim | Sim | Sim | Sim |
| Visualizar roteiro completo | Sim | Sim | Não | Sim |
| Criar e editar roteiro | Sim | Sim | Não | Com autorização |
| Visualizar orçamento | Sim | Sim | Não | Com autorização |
| Visualizar gastos | Sim | Sim | Não | Com autorização |
| Registrar gastos | Sim | Sim | Não | Com autorização |
| Editar gastos próprios | Sim | Sim | Não | Com autorização |
| Editar gastos de terceiros | Sim | Sim | Não | Não |
| Convidar participantes | Sim | Sim | Não | Não |
| Alterar permissões | Sim | Sim | Não | Não |
| Remover participantes | Sim | Sim | Não | Não |
| Excluir a viagem | Sim | Sim | Não | Não |

## Regras dos convidados

- O convidado Free visualiza apenas o painel resumido e o roteiro do dia.
- Somente o organizador e convidados Premium autorizados podem editar informações.
- Orçamento e gastos nunca aparecem para convidados Free.
- Para acessar dados financeiros, o convidado precisa ser Premium e receber autorização explícita do organizador.
- Informações financeiras ficam ocultas por padrão.
- O convidado Premium autorizado pode registrar e editar os próprios gastos.
- Convidados não podem editar gastos de terceiros, excluir a viagem, gerenciar participantes ou alterar permissões.
- O organizador pode revogar qualquer autorização ou remover um convidado.
- Alterações feitas por convidados devem registrar autor, data e horário para auditoria.

## Modelo comercial aprovado

### Preços de referência

| Plano | Preço de referência |
| --- | ---: |
| Tripi Free | Gratuito |
| Tripi Premium mensal | US$ 4,99 por mês |
| Tripi Premium anual | US$ 29,99 por ano |
| Teste Premium | 7 dias grátis |

- O plano anual será a oferta principal e recomendada.
- Os valores serão localizados pelas lojas para cada país.
- O produto não terá plano vitalício.
- O lançamento não utilizará publicidade.

### Limites comerciais

| Recurso | Free | Premium |
| --- | --- | --- |
| Viagens ativas | 1 | Ilimitadas |
| Viagens concluídas | Histórico básico | Histórico completo |
| Convidados por viagem | 2 | Ilimitados |
| Moedas por viagem | 1 | Múltiplas |
| Painel | Essencial | Completo e comparativo |
| Roteiro | Completo para o organizador | Completo e colaborativo |
| Orçamento e gastos | Essencial | Avançado |
| Relatórios | Não | Sim |
| Exportação | Não | PDF e CSV |
| Uso offline | Não | Sim |
| Permissões de convidados | Básicas | Granulares |

O termo “convidados ilimitados” será utilizado comercialmente. Controles internos de uso justo, segurança e combate a automações ou convites em massa deverão existir sem limitar o uso legítimo.

### Teste Premium

- Disponível uma única vez por conta.
- Libera todos os recursos Premium por sete dias.
- O plano anual será destacado como opção recomendada.
- Preço, data de cobrança e renovação automática deverão ser apresentados de forma clara.
- O usuário poderá cancelar antes da cobrança.

### Cancelamento e downgrade

- Nenhum dado será excluído por cancelamento ou término do Premium.
- O usuário escolherá uma viagem para permanecer ativa no Free.
- As demais viagens ficarão em modo de consulta.
- Exportações, múltiplas moedas, offline e demais recursos Premium serão bloqueados.
- Um convidado que perder o Premium deixará de editar e de acessar informações financeiras.
- Após o downgrade, o convidado continuará vendo o painel resumido e o roteiro do dia.

## Escopo do MVP publicável

### Conta e acesso

- Cadastro, login, verificação de e-mail e recuperação de senha.
- Perfil, idioma e moeda preferencial.
- Exclusão da conta e exportação dos dados pessoais.
- Sessões seguras e gerenciamento de dispositivos.

### Viagens

- Criar, editar, concluir e excluir viagem.
- Destino com autocomplete.
- Datas, moeda principal e fuso horário.
- Status: planejamento, próxima, em andamento e concluída.
- Capa da viagem.
- Aplicação dos limites Free e Premium.

### Dashboard contextual

Antes da viagem:

- Contagem regressiva.
- Resumo do orçamento.
- Progresso do roteiro.
- Pendências essenciais.

Durante a viagem:

- Roteiro do dia.
- Próxima atividade.
- Gastos do dia e acumulados.
- Saldo disponível.

Depois da viagem:

- Previsto e realizado.
- Gastos por categoria.
- Resumo da viagem.
- Acesso ao histórico.

### Roteiro

- Dias gerados pelas datas da viagem.
- Atividades com horário, título, local e observação.
- Reordenação das atividades.
- Autocomplete de lugares.
- Abertura do local no Google Maps ou Apple Maps.
- O MVP não terá mapa completo dentro do Tripi.

### Financeiro

- Orçamento total e categorias planejadas.
- Gastos realizados.
- Comparação entre previsto e realizado.
- Indicadores por categoria.
- Uma moeda por viagem no Free.
- Múltiplas moedas e registro da taxa de conversão no Premium.
- Relatórios e exportações no Premium.

### Convites e colaboração

- Envio, aceite e revogação de convites.
- Aplicação dos papéis e permissões aprovados.
- Auditoria das alterações.
- Dois convidados no Free e convidados ilimitados no Premium.

### Assinaturas

- Planos Free e Premium.
- Teste Premium de sete dias.
- Compra e restauração de assinatura pelas lojas.
- Tratamento de renovação, cancelamento, período de tolerância e downgrade.

### Requisitos de produção

- Backend e banco de dados reais.
- Sincronização entre dispositivos.
- Português e inglês.
- Analytics de produto, crash reporting e observabilidade.
- Feature flags, rate limiting e proteção contra abuso.
- Backups e recuperação.
- Termos, privacidade, consentimentos e exclusão de dados.
- Acessibilidade mínima e temas claro e escuro.
- Nenhuma funcionalidade simulada ou fluxo principal sem funcionamento.

## Estratégia de beta

1. Beta interna com o fundador e usuários próximos.
2. Beta fechada via TestFlight e Google Play.
3. Correção dos problemas críticos.
4. Validação de retenção e uso do dashboard.
5. Homologação definitiva das assinaturas.
6. Publicação comercial global.

Durante a beta:

- Não haverá cobrança real.
- Participantes receberão acesso Premium temporário.
- Permissões utilizarão entitlements reais de beta.
- Usuários serão avisados antes do início da cobrança.
- Nenhum dado será perdido na transição para o lançamento comercial.

### Primeira rodada

- Beta fechada com cinco pessoas próximas ao fundador.
- Duração de quatro semanas.
- Viagens reais e simuladas serão aceitas e identificadas separadamente nas métricas.
- Feedback por formulário estruturado.
- WhatsApp reservado para falhas urgentes.
- Entregas corretivas semanais e correção imediata de erros críticos.
- Cold start da API é aceitável somente durante essa etapa.
- Infraestrutura com meta de US$ 0 por mês e URLs gratuitas dos provedores.

### Critérios de sucesso

- Pelo menos quatro dos cinco participantes criam uma viagem.
- Pelo menos quatro utilizam roteiro, orçamento, gastos e painel.
- Pelo menos três retornam ao Tripi em semanas diferentes.
- Pelo menos três afirmam que utilizariam o Tripi em uma viagem real.
- Os fluxos principais podem ser concluídos sem ajuda do fundador.
- Nenhuma perda ou exposição indevida de dados.
- Nenhum erro crítico pendente ao término da rodada.

## Privacidade, idade e direitos

- Somente maiores de 18 anos poderão criar contas.
- Menores poderão ser incluídos como viajantes dependentes, sem login próprio.
- Para dependentes, o MVP aceitará nome ou apelido, data de nascimento opcional e relação com o adulto responsável.
- Não serão coletados documentos de dependentes no MVP.
- Localização será usada somente em primeiro plano e quando necessária para uma ação solicitada pelo usuário.
- Não haverá rastreamento em segundo plano.
- Termos de Uso e Política de Privacidade deverão ser aceitos desde o cadastro da beta.
- O aceite será versionado por documento, idioma, data e hora.
- Exportação dos próprios dados estará disponível para usuários Free e Premium.
- A exclusão terá janela de recuperação de 30 dias.
- Backups poderão reter cópias inacessíveis operacionalmente por até 90 dias após a exclusão definitiva.
- Organizadores deverão transferir viagens compartilhadas antes de excluir a conta.

## Segurança e confiança

- Bloqueio opcional por biometria ou código do dispositivo para todos os usuários.
- Conta conectada em múltiplos dispositivos, com gerenciamento e encerramento remoto de sessões.
- Avisos por e-mail para novo login e alterações sensíveis da conta.
- Ações sensíveis serão auditadas.
- Acessibilidade WCAG 2.2 nível AA será perseguida nos fluxos principais.
- Suporte inicial por e-mail em português e inglês, com objetivo de resposta em até dois dias úteis.
- A beta operará em melhor esforço; o lançamento comercial terá meta mínima de disponibilidade mensal de 99,5%.

## Fora do MVP

- Reservas e transportes como módulos próprios.
- Documentos e anexos.
- Checklist.
- Mapa completo dentro do aplicativo.
- Importação automática de e-mails.
- Alertas de voos.
- Otimização de rotas.
- Inteligência artificial.
- Divisão de contas e acertos entre participantes.
- Recordações e diário avançado.

Hospedagens, voos e deslocamentos poderão ser registrados como atividades comuns do roteiro, sem módulos especializados no MVP.

## Próximas decisões

1. Definir o design system e os fluxos de navegação.
2. Especificar histórias de usuário e critérios de aceite do MVP.
3. Modelar entidades, contratos de API e sincronização offline.
4. Elaborar o plano incremental de implementação.
5. Preparar os materiais e processos de publicação nas lojas.
   