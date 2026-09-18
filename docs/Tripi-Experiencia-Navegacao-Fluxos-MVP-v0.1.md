# Tripi — Experiência, Navegação e Fluxos do MVP

**Versão:** 0.1  
**Data:** 18 de setembro de 2026  
**Status:** Especificação inicial aprovada por direção recomendada

## Objetivo

Definir a experiência funcional do Tripi antes do design visual e da implementação, garantindo que mobile, backend, testes e analytics utilizem os mesmos fluxos e estados.

Este documento cobre o MVP publicável para Android e iOS. Funcionalidades fora do MVP não deverão aparecer como botões sem funcionamento, telas simuladas ou promessas dentro do aplicativo.

## Princípios de experiência

- O painel da viagem ativa é o centro do produto.
- As ações frequentes devem exigir poucos passos.
- A experiência deve continuar compreensível durante deslocamentos e sob conexão instável.
- Informações financeiras devem ser legíveis, discretas e protegidas.
- Recursos Premium serão explicados no contexto, sem bloquear a navegação de forma agressiva.
- Estados vazios devem ensinar o próximo passo.
- Erros devem explicar o ocorrido, preservar os dados preenchidos e oferecer recuperação.
- Português e inglês terão a mesma cobertura funcional.
- Temas claro e escuro serão suportados desde o MVP.
- Acessibilidade WCAG 2.2 nível AA será perseguida nos fluxos principais.

## Arquitetura de navegação

### Área não autenticada

1. Abertura.
2. Apresentação curta do valor do Tripi.
3. Entrar.
4. Criar conta.
5. Verificar e-mail.
6. Recuperar senha.
7. Consultar Termos de Uso e Política de Privacidade.

A apresentação poderá ser ignorada. Usuários que já concluíram essa etapa irão diretamente para autenticação ou para o aplicativo, quando houver sessão válida.

### Navegação autenticada

A barra inferior terá cinco destinos:

| Destino | Responsabilidade |
| --- | --- |
| Painel | Situação contextual da viagem ativa |
| Roteiro | Programação diária da viagem ativa |
| Viagens | Criar, alternar, concluir e consultar viagens |
| Financeiro | Orçamento, gastos e comparativos da viagem ativa |
| Perfil | Conta, assinatura, preferências, segurança e suporte |

Um botão flutuante contextual permitirá:

- Criar viagem, quando não houver viagem ativa.
- Adicionar atividade, dentro de roteiro.
- Registrar gasto, dentro de financeiro ou durante a viagem.
- Exibir um menu curto quando mais de uma ação for igualmente relevante.

O botão nunca poderá esconder conteúdo, competir com a navegação do sistema ou apresentar ações sem permissão.

### Viagem ativa

- Painel, Roteiro e Financeiro sempre operam sobre uma viagem ativa.
- O cabeçalho exibirá a viagem ativa e permitirá alterná-la.
- Ao concluir uma viagem, o Tripi selecionará a próxima viagem elegível.
- Se não existir outra, será exibido o estado sem viagem ativa.
- No Free, somente uma viagem poderá permanecer ativa.
- Viagens excedentes após downgrade ficarão em consulta, conforme a regra comercial.

## Inventário de telas

### 1. Abertura e introdução

#### Splash

- Marca do Tripi.
- Verificação silenciosa da sessão e da configuração local.
- Nenhuma espera artificial.
- Em falha de rede, uma sessão local válida poderá abrir dados sincronizados.

#### Introdução

No máximo três páginas:

1. Planeje roteiro e compromissos.
2. Controle orçamento e gastos.
3. Acompanhe tudo em um painel e compartilhe a viagem.

Ações: `Começar`, `Entrar` e `Pular` quando aplicável.

### 2. Conta e autenticação

#### Entrar

- E-mail e senha.
- Continuar com Google.
- Continuar com Apple.
- Recuperar senha.
- Link para criação de conta.
- Mensagens de erro sem revelar se uma conta existe indevidamente.

#### Criar conta

- Nome.
- E-mail.
- Senha e confirmação.
- Idioma sugerido pelo dispositivo.
- Confirmação de idade mínima de 18 anos.
- Aceite obrigatório e versionado dos Termos e da Política de Privacidade.
- Google e Apple como alternativas.

#### Verificar e-mail

- Explicação objetiva.
- Reenvio com contagem regressiva e proteção contra abuso.
- Troca do e-mail digitado quando permitido.
- Atualização automática após retorno ao aplicativo.

#### Recuperar senha

- Solicitação por e-mail.
- Confirmação neutra da solicitação.
- Definição de nova senha por link seguro.
- Revogação das sessões existentes após a troca.

### 3. Primeiro uso

Depois da primeira autenticação, o usuário poderá:

1. Criar a primeira viagem.
2. Explorar uma explicação curta do painel vazio.

O caminho principal destacará `Criar minha primeira viagem`. Não haverá dados fictícios persistidos na conta.

### 4. Viagens

#### Lista de viagens

Agrupamentos:

- Em andamento.
- Próximas.
- Em planejamento.
- Concluídas.
- Somente leitura por downgrade, quando existir.

Cada item exibirá destino, período, status, capa e indicador financeiro resumido quando o usuário tiver permissão.

#### Criar ou editar viagem

Campos do MVP:

- Nome da viagem.
- Destino principal com autocomplete.
- Data inicial e final.
- Fuso horário principal sugerido pelo destino.
- Moeda principal.
- Capa opcional dentre opções seguras do produto.
- Viajantes e dependentes.

Regras:

- A data final não pode anteceder a inicial.
- Alterações de data devem informar o impacto nos dias do roteiro.
- Mudança de moeda não recalculará silenciosamente registros históricos.
- O limite Free será verificado antes da criação de outra viagem ativa.

#### Detalhes e configurações da viagem

- Resumo.
- Participantes.
- Permissões.
- Moeda e fuso.
- Concluir viagem.
- Excluir viagem com confirmação reforçada.
- Transferir propriedade quando necessário para exclusão da conta.

### 5. Painel contextual

#### Sem viagem ativa

- Explicação curta do valor do Tripi.
- Ação para criar ou selecionar uma viagem.
- Nenhum gráfico vazio decorativo.

#### Antes da viagem

- Contagem regressiva.
- Período e destino.
- Orçamento previsto e realizado, conforme permissão.
- Progresso de preenchimento do roteiro.
- Próxima atividade cadastrada.
- Ações rápidas para roteiro e gastos.

O MVP não terá módulo próprio de checklist ou reservas. Pendências serão derivadas apenas de dados que realmente existam no escopo aprovado.

#### Durante a viagem

- Data local da viagem.
- Roteiro do dia.
- Próxima atividade.
- Gastos do dia e acumulados.
- Saldo do orçamento.
- Ação destacada para registrar gasto.
- Estado da sincronização quando houver operações offline.

#### Depois da viagem

- Total previsto e realizado.
- Diferença e percentual.
- Gastos por categoria.
- Resumo do roteiro executado.
- Acesso ao histórico.
- Ação para iniciar nova viagem.

#### Painel do convidado Free

- Destino e período.
- Status da viagem.
- Roteiro do dia.
- Próxima atividade permitida.
- Nenhum orçamento, gasto ou indicador financeiro.

### 6. Roteiro

#### Visão por dia

- Seletor horizontal ou calendário compacto dos dias da viagem.
- Lista cronológica de atividades.
- Destaque da próxima atividade no dia atual.
- Reordenação quando o usuário tiver permissão.
- Estado vazio com ação `Adicionar atividade`.

#### Criar ou editar atividade

- Título.
- Data.
- Horário inicial e final opcionais.
- Local com autocomplete opcional.
- Observação.
- Categoria visual simples.
- Ação para abrir o local no Google Maps ou Apple Maps.

Conflitos de horário poderão gerar aviso, mas não impedirão o salvamento.

#### Permissões

- Organizador pode criar e editar.
- Convidado Premium autorizado pode criar e editar.
- Convidado Free vê somente o dia atual.
- Alterações registram autor, data e hora.

### 7. Financeiro

#### Visão geral

- Orçamento total.
- Total realizado.
- Saldo.
- Percentual consumido.
- Comparação por categoria.
- Gastos recentes.
- Indicador claro da moeda de referência.

Valores não devem depender somente de cor. Ícones, textos e sinais também indicarão a situação.

#### Orçamento

- Definir valor total.
- Distribuir valores por categoria.
- Exibir valor ainda não distribuído.
- Permitir categorias padrão e personalizadas.
- Impedir totais inconsistentes somente quando a regra realmente exigir.

#### Gastos

- Lista por data.
- Filtros por categoria, participante e período.
- Busca por descrição.
- Identificação de lançamentos pendentes de sincronização.

#### Registrar ou editar gasto

- Descrição.
- Valor.
- Moeda original.
- Categoria.
- Data e hora.
- Responsável pelo gasto.
- Observação opcional.
- Taxa de câmbio sugerida ou manual quando houver múltiplas moedas.

Um gasto criado offline será salvo imediatamente no dispositivo, marcado como pendente e sincronizado de forma idempotente.

#### Privacidade financeira

- Informações financeiras ficam ocultas para convidados por padrão.
- Convidado Free nunca acessa orçamento ou gastos.
- Convidado Premium precisa de autorização explícita.
- Um convidado autorizado edita apenas os próprios gastos.
- O organizador visualiza e administra o conjunto da viagem.

### 8. Participantes e convites

#### Participantes

- Organizador.
- Convidados com plano e papel visíveis.
- Dependentes sem conta.
- Estado de convites pendentes.

#### Convidar

- E-mail do convidado.
- Explicação do acesso inicial.
- Respeito ao limite de dois convidados no Free.
- Proteções contra envio em massa e abuso.

#### Aceitar convite

- Identificação da viagem e do organizador.
- Resumo das permissões oferecidas.
- Entrada ou criação de conta.
- Aceite explícito.

#### Gerenciar permissão

- Somente o organizador altera permissões.
- Acesso financeiro começa desativado.
- Colaboração exige conta Premium do convidado e autorização do organizador.
- Revogação tem efeito imediato após sincronização.

### 9. Premium e assinatura

#### Paywall contextual

O paywall será exibido somente após uma intenção relacionada ao Premium, como:

- Criar mais de uma viagem ativa.
- Usar múltiplas moedas.
- Ativar colaboração avançada.
- Usar recursos offline Premium.
- Acessar relatórios ou exportações comerciais.

Conteúdo:

- Benefícios diretamente relacionados à ação.
- Plano anual em destaque.
- Plano mensal como alternativa.
- Teste grátis de sete dias, quando elegível.
- Preço localizado, renovação e regras de cancelamento.
- Restaurar compras.
- Links para termos e privacidade.

Durante a beta, o entitlement `BETA_PREMIUM` desbloqueará os recursos sem cobrança e sem simular uma compra.

#### Estado de assinatura

- Plano atual.
- Próxima renovação quando disponível.
- Gerenciar na loja.
- Restaurar compras.
- Situações de tolerância, expiração e cancelamento com mensagens claras.

### 10. Perfil e configurações

Seções:

- Dados pessoais.
- Idioma.
- Moeda preferencial.
- Tema claro, escuro ou sistema.
- Bloqueio por biometria ou código do aparelho.
- Sessões e dispositivos.
- Métodos de login vinculados.
- Assinatura.
- Exportar meus dados.
- Ajuda e suporte.
- Termos e privacidade.
- Excluir conta.
- Sair.

#### Sessões e dispositivos

- Dispositivo atual identificado.
- Última atividade aproximada.
- Encerramento de uma sessão ou de todas as outras.
- Aviso por e-mail para novos logins.

#### Excluir conta

- Explicação da janela de recuperação de 30 dias.
- Exigência de transferir viagens compartilhadas.
- Confirmação com autenticação recente.
- Encerramento das sessões.
- Opção de cancelar a exclusão durante o prazo permitido.

## Fluxos principais

### Fluxo A — primeira viagem

1. Criar conta e verificar e-mail.
2. Criar viagem.
3. Informar destino, datas, moeda e viajantes.
4. Abrir o painel contextual.
5. Definir orçamento.
6. Adicionar primeira atividade.
7. Registrar primeiro gasto.

Conclusão: painel apresenta dados reais dos módulos preenchidos.

### Fluxo B — acompanhar durante a viagem

1. Abrir o aplicativo.
2. Visualizar roteiro e próxima atividade no painel.
3. Abrir local no aplicativo de mapas.
4. Registrar gasto.
5. Confirmar atualização do saldo.

Sem internet, o Premium conclui os passos possíveis localmente e informa a sincronização pendente.

### Fluxo C — convidar acompanhante

1. Abrir participantes.
2. Informar e-mail.
3. Enviar convite.
4. Convidado aceita e entra na viagem.
5. Convidado Free acessa painel resumido e roteiro do dia.
6. Organizador poderá ampliar permissões somente se o convidado for Premium.

### Fluxo D — conversão Premium

1. Usuário tenta um recurso Premium.
2. Tripi explica o benefício contextual.
3. Usuário visualiza planos e condições.
4. Loja processa compra ou teste.
5. Backend confirma o entitlement.
6. Recurso é liberado e o usuário retorna à intenção original.

### Fluxo E — downgrade

1. Entitlement expira.
2. Usuário é informado sem perder dados.
3. Escolhe uma viagem ativa para permanecer no Free.
4. Outras viagens ficam em consulta.
5. Recursos Premium ficam indisponíveis.
6. Convidado rebaixado perde edição e acesso financeiro imediatamente após atualização do entitlement.

## Estados obrigatórios de interface

Toda tela conectada a dados remotos deverá prever:

- Carregamento inicial com skeleton adequado.
- Atualização sem bloquear conteúdo já disponível.
- Estado vazio orientado à ação.
- Erro recuperável com tentativa novamente.
- Erro de autorização sem exposição de dados.
- Estado offline.
- Alteração pendente de sincronização.
- Sucesso discreto e inequívoco.
- Limite Free atingido.
- Recurso Premium indisponível.
- Sessão expirada com preservação segura do contexto possível.

Formulários preservarão dados em falhas recuperáveis. Ações destrutivas usarão confirmação proporcional ao risco.

## Padrões visuais iniciais

- Cor principal: azul profundo.
- Cor de destaque: turquesa.
- Superfícies neutras com contraste alto.
- Estados positivos, preventivos e críticos acompanhados de texto ou ícone.
- Cards compactos e hierarquia tipográfica clara.
- Gráficos simples, com legenda e alternativa textual.
- Alvos de toque adequados e suporte à ampliação de fonte.
- Movimento reduzido respeitado quando configurado no sistema.
- Efeitos visuais nunca prejudicarão desempenho ou leitura.

Os tokens definitivos de cor, tipografia, espaçamento, elevação e movimento serão definidos no design system.

## Analytics de experiência

Eventos mínimos, sem conteúdo privado:

- Cadastro iniciado e concluído.
- Verificação de e-mail concluída.
- Primeira viagem criada.
- Primeiro orçamento criado.
- Primeira atividade criada.
- Primeiro gasto registrado.
- Convite enviado e aceito.
- Painel aberto por fase da viagem.
- Recurso Premium solicitado.
- Paywall visualizado.
- Teste iniciado e assinatura confirmada.
- Operação offline criada e sincronizada.
- Erro de fluxo classificado tecnicamente.

Não serão enviados nomes, e-mails, destinos, valores, descrições, observações ou conteúdo do roteiro.

## Critérios transversais de aceite

- Nenhum fluxo principal depende de dados mockados.
- Todo acesso respeita plano, papel e permissão no backend.
- O aplicativo não concede Premium sozinho.
- Dados financeiros nunca aparecem a convidados sem autorização válida.
- Fluxos essenciais funcionam em português e inglês.
- Temas claro e escuro preservam contraste e legibilidade.
- Estados offline e de sincronização são compreensíveis.
- Ações destrutivas exigem autenticação ou confirmação compatível com o risco.
- Telas essenciais funcionam com leitor de tela, fonte ampliada e navegação por foco.
- Erros não apagam silenciosamente dados preenchidos.

## Fora desta especificação

- Mapa completo embutido.
- Reservas e transportes como módulos próprios.
- Documentos e anexos.
- Checklist dedicado.
- Importação de e-mails.
- Alertas de voos.
- Otimização de rotas.
- Inteligência artificial.
- Divisão e acerto de contas.
- Diário avançado e recordações.

## Próximo checkpoint

1. Criar o mapa detalhado de rotas e hierarquia de telas.
2. Definir o design system e os componentes fundamentais.
3. Escrever histórias de usuário e critérios de aceite por módulo.
4. Modelar entidades e contratos de API com base nos fluxos aprovados.
5. Montar o plano incremental de implementação.
