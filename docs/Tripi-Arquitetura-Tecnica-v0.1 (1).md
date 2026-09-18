# Tripi — Arquitetura Técnica

**Versão:** 0.4  
**Data:** 18 de setembro de 2026  
**Status:** Baseline técnico aprovado

## Objetivo

Definir uma fundação técnica orientada à produção para o Tripi, mantendo baixo acoplamento com fornecedores, custos controláveis durante a beta e capacidade de evolução sem reescrita prematura.

## Princípios

- Um único aplicativo multiplataforma para Android e iOS.
- Backend próprio em Java.
- Monólito modular antes de qualquer divisão em microserviços.
- Contratos de API explícitos e versionados.
- Segurança, testes, observabilidade e automação desde a fundação.
- Infraestrutura portátil e configurada por ambiente.
- Nenhum Redis, broker ou Kubernetes sem necessidade comprovada.
- Custo mensal-alvo de US$ 0 durante a primeira beta, com contratação somente após necessidade comprovada e aprovação do fundador.

## Aplicativo mobile

- React Native com Expo.
- TypeScript em modo estrito.
- Expo Router.
- Development Builds para desenvolvimento e homologação.
- EAS Build, Submit e Update para compilação, distribuição e atualizações.
- TanStack Query para estado remoto e cache da API.
- Zustand somente para estado local de interface.
- React Hook Form e Zod para formulários e validações.
- SecureStore para segredos e credenciais locais.
- SQLite para persistência local e suporte ao modo offline.
- Internacionalização em português e inglês desde a fundação.
- Temas claro e escuro.
- Acessibilidade considerada nos componentes e fluxos essenciais.

A versão estável do Expo SDK disponível no momento da criação do projeto será fixada no repositório e atualizada de forma controlada.

## Backend

- Java 25 LTS, usando uma distribuição OpenJDK adequada para produção.
- Spring Boot 4.1.x.
- Maven Wrapper.
- API REST versionada.
- OpenAPI como contrato oficial.
- Cliente TypeScript gerado a partir do OpenAPI.
- Spring Security.
- Access token de curta duração e refresh token rotativo.
- Flyway para versionamento do banco.
- JPA/Hibernate para persistência comum e SQL explícito quando necessário.
- Testcontainers para testes de integração.
- Docker para execução consistente e deploy.

## Banco de dados

- PostgreSQL 18.
- Banco gerenciado em staging e produção.
- Backups automáticos e recuperação testada.
- Migrações exclusivamente pelo Flyway.
- Valores monetários armazenados com precisão decimal e código ISO da moeda.
- Datas e instantes persistidos com regras explícitas de fuso horário.

## Arquitetura lógica

O backend será um monólito modular com os seguintes módulos:

1. **Identity:** autenticação, sessões, tokens e recuperação de conta.
2. **Users:** perfil, idioma, moeda e preferências.
3. **Trips:** viagens, destinos, datas, status e participantes.
4. **Itinerary:** dias, atividades, lugares e ordenação.
5. **Budget:** orçamento planejado e categorias.
6. **Expenses:** gastos, moedas, conversões e indicadores.
7. **Collaboration:** convites, papéis e permissões.
8. **Entitlements:** planos, beta, assinatura e limites comerciais.
9. **Notifications:** comunicações transacionais.
10. **Audit:** histórico de ações relevantes.

Os módulos deverão expor interfaces claras e não acessar diretamente as estruturas internas uns dos outros.

## Integrações previstas

- E-mail transacional.
- Serviço de câmbio.
- Autocomplete de destinos e lugares.
- Google Maps e Apple Maps por deep link.
- App Store e Google Play para assinaturas.
- Monitoramento de erros e performance.
- Analytics de produto.

## Provedores aprovados para a beta

### E-mail transacional — Resend

Usos:

- Verificação de e-mail.
- Recuperação de senha.
- Convites.
- Alertas importantes da conta.
- Comunicações de assinatura quando aplicável.

Regras:

- Domínio próprio autenticado.
- Templates em português e inglês.
- Nenhuma informação financeira sensível no conteúdo.
- Integração encapsulada por uma interface substituível no backend.

### Câmbio — Frankfurter v2

- Taxas diárias de bancos centrais e fontes oficiais.
- Taxa apresentada como referência, não como valor exato cobrado pelo cartão.
- Possibilidade de taxa manual informada pelo usuário.
- Taxa original de cada gasto preservada.
- Cache diário no backend.
- Última taxa conhecida como contingência, com aviso.
- Integração isolada para permitir substituição ou self-hosting.

### Destinos e lugares — Google Places API (New)

Escopo:

- Autocomplete de destinos.
- Autocomplete de lugares do roteiro.
- Identificador, nome, endereço e coordenadas estritamente necessários.
- Abertura por deep link no Google Maps ou Apple Maps.
- Sem mapa completo dentro do Tripi no MVP.

Proteções:

- Mínimo de três caracteres.
- Debounce e tokens de sessão.
- Chaves restritas por aplicativo e ambiente.
- Alertas, cotas rígidas e acompanhamento de custo.
- Coleta somente dos campos necessários.
- Cumprimento das regras de armazenamento do provedor.
- Camada de abstração para troca futura.

### Analytics e feature flags — PostHog

Eventos permitidos incluem ativação, primeira viagem, primeiro item do roteiro, primeiro gasto, convites, uso do dashboard, conversão e retenção.

Não serão enviados valores, destinos vinculáveis, e-mails, nomes, tokens, conteúdo de roteiro ou dados financeiros. Session replay permanecerá desativado em telas sensíveis.

### Erros e performance — Sentry

- Crashes do Android e iOS.
- Erros da API.
- Performance de requisições.
- Releases afetadas e contexto técnico de diagnóstico.

Dados pessoais, tokens, valores financeiros e conteúdo de viagem serão removidos antes do envio.

### Regras transversais

- Segredos de integrações nunca serão incluídos no aplicativo.
- Chaves públicas de cliente terão escopo mínimo e restrições.
- Custos, franquias e erros serão monitorados.
- Integrações externas ficarão atrás de adapters próprios.
- Nenhum provedor externo será a autoridade sobre o domínio do Tripi.

## Offline e sincronização

- O aplicativo utilizará cache local em SQLite.
- Operações offline autorizadas serão registradas em uma fila local.
- A sincronização usará identificadores idempotentes para evitar duplicidade.
- Conflitos terão regras determinísticas por tipo de entidade.
- Recursos offline completos respeitarão os entitlements Premium.
- Dados sensíveis não serão persistidos em texto aberto.

### Escopo offline Premium no MVP

O usuário Premium poderá, sem conexão:

- Consultar viagens previamente sincronizadas.
- Abrir o dashboard.
- Consultar o roteiro completo.
- Consultar orçamento e gastos.
- Registrar novos gastos.

Não será permitido offline:

- Convidar ou remover participantes.
- Alterar permissões.
- Excluir viagem.
- Assinar ou restaurar Premium.
- Executar ações administrativas sensíveis.

Cada gasto offline terá UUID gerado no dispositivo, data e hora da ocorrência, moeda e valor originais, última taxa de câmbio conhecida e estado `PENDING_SYNC`.

Na reconexão, o aplicativo enviará a fila pendente com chave de idempotência. O backend rejeitará duplicidades com segurança, confirmará ou sinalizará cada item e recalculará o dashboard. A taxa usada ficará registrada; nenhuma conversão histórica será alterada silenciosamente.

## Autenticação aprovada

O lançamento oferecerá:

- E-mail e senha.
- Google.
- Sign in with Apple.
- Verificação obrigatória de e-mail.
- Recuperação de senha.
- Vinculação segura de métodos de acesso.
- Encerramento de sessões e exclusão da conta.

O backend do Tripi será a autoridade sobre contas e sessões. Google e Apple comprovarão identidade, mas não substituirão o cadastro interno.

Regras de segurança:

- Senhas armazenadas apenas com hash forte e salt.
- Tokens sociais sempre validados pelo backend.
- Apple Private Relay suportado.
- Contas não serão mescladas automaticamente apenas pela aparência do e-mail.
- Credenciais locais ficarão no SecureStore.
- Alterações sensíveis exigirão autenticação recente.
- Access tokens terão curta duração.
- Refresh tokens serão rotativos, revogáveis e reutilização indevida será detectada.

## Assinaturas aprovadas

O serviço gerenciado será o **RevenueCat**, integrado à App Store e ao Google Play.

Responsabilidades:

- **App Store e Google Play:** processar pagamentos e assinaturas.
- **RevenueCat:** normalizar compras, restaurações, renovações, cancelamentos e períodos de tolerância.
- **Backend Tripi:** persistir entitlements e aplicar as regras comerciais.
- **Aplicativo:** apresentar o estado retornado, sem conceder Premium de forma autônoma.

O aplicativo usará o identificador interno e estável do usuário no RevenueCat. O backend receberá webhooks assinados, processados de forma idempotente, e manterá histórico das mudanças de entitlement.

Durante a beta, o backend concederá `BETA_PREMIUM` sem compras reais. Em produção, o entitlement comercial será separado do entitlement de beta.

## Ambientes

1. **Local:** desenvolvimento com serviços em containers quando necessário.
2. **Staging:** ambiente compartilhado para homologação e beta.
3. **Production:** ambiente isolado com dados reais.

Cada ambiente terá segredos, banco, URLs e telemetria separados.

## Infraestrutura da primeira beta

- Código-fonte em repositório privado no GitHub.
- GitHub Actions para integração contínua dentro da franquia gratuita.
- API Spring Boot no plano gratuito do Render, aceitando cold start durante a beta fechada.
- PostgreSQL no plano gratuito do Neon.
- Expo EAS Free para builds e distribuição enquanto a franquia for suficiente.
- URLs gratuitas dos provedores; domínio próprio será adquirido posteriormente.
- PostHog, Sentry, Resend e RevenueCat utilizados dentro das respectivas franquias gratuitas.
- Nenhum serviço pago será ativado sem necessidade comprovada e aprovação do fundador.

A limitação de memória do ambiente gratuito será considerada no empacotamento e na configuração da JVM. Antes do lançamento comercial, a API deverá migrar para uma instância sem suspensão, com capacidade, backups e disponibilidade adequados à produção.

O ambiente de produção permanecerá isolado da beta, mesmo que utilize os mesmos fornecedores.

## Privacidade e ciclo de vida dos dados

- Somente maiores de 18 anos poderão criar contas.
- Menores poderão existir apenas como viajantes dependentes, sem login próprio.
- De dependentes serão coletados apenas nome ou apelido, data de nascimento opcional e relação com o responsável.
- Localização será utilizada somente em primeiro plano e quando solicitada por uma funcionalidade; não haverá rastreamento em segundo plano.
- Termos de Uso e Política de Privacidade serão aceitos desde a beta, com versão, idioma, data e hora registrados.
- Exportação de dados pessoais estará disponível a todos os usuários, independentemente do plano.
- A exclusão de conta terá janela de recuperação de 30 dias.
- Depois da exclusão definitiva, backups poderão reter dados inacessíveis operacionalmente por até 90 dias.
- Um organizador deverá transferir viagens compartilhadas antes de excluir a conta; viagens sem outros participantes serão excluídas.
- Dados da beta serão preservados no lançamento quando tecnicamente compatíveis e migrados com segurança.

## Segurança da conta

- Bloqueio local opcional por biometria ou código do dispositivo para todos os usuários.
- Múltiplas sessões por conta, com visualização e encerramento remoto.
- Alertas por e-mail para novo login, troca de senha ou e-mail, vinculação de método de acesso, transferência e exclusão da conta.
- Revogação de sessões após troca de senha ou indício de comprometimento.
- Auditoria de ações sensíveis, sem registrar segredos ou conteúdo privado desnecessário.

## Observabilidade e operação

- Logs estruturados com correlação por requisição.
- Métricas técnicas e de negócio.
- Rastreamento de erros no aplicativo e na API.
- Health checks de disponibilidade e prontidão.
- Alertas para falhas críticas.
- Trilhas de auditoria para permissões, financeiro e assinatura.
- Política de retenção sem registrar tokens, senhas ou dados sensíveis nos logs.

## Testes

### Mobile

- Testes unitários.
- Testes de componentes e fluxos essenciais.
- Testes E2E dos principais caminhos antes da publicação.

### Backend

- Testes unitários de domínio.
- Testes de integração com PostgreSQL real via Testcontainers.
- Testes de segurança e autorização.
- Testes de contrato da API.
- Testes de migrations.

## Repositório planejado

```text
C:\tripi
├── apps
│   ├── mobile
│   └── api
├── packages
│   ├── api-client
│   ├── config
│   └── design-tokens
├── docs
├── infrastructure
├── .github
└── README.md
```

Essa estrutura ainda não deve ser criada manualmente. Ela será gerada após a aprovação das decisões restantes e do plano de implementação.

## Decisões adiadas

- Provedor e capacidade definitivos para o lançamento comercial.
- Domínio próprio.
- Limite financeiro após a beta gratuita.
- Estratégia de alta disponibilidade após validação da demanda.

## Próximo checkpoint

Definir o design system, contratos iniciais da API, modelo de dados e plano incremental de implementação.
        