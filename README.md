# Tripi

App para organizar uma viagem inteira: roteiro dia a dia, reservas, gastos divididos entre viajantes, checklist da mala e documentos — tudo sincronizado na nuvem com quem viaja junto.

- **App:** Expo SDK 57 + Expo Router (iOS, Android e web) — no SDK 57 para casar com o Expo Go das lojas
- **Nuvem:** Supabase (login, banco Postgres com RLS, tempo real, arquivos)
- **Visual:** tema claro e escuro "Liquid Glass" (vidro nativo no iOS 26+). Segue o modo do celular; dá para fixar em Perfil › Aparência.
- **Protótipo das telas:** canvas do Tripi no claude.ai (40 telas, claro e escuro).

## Rodando pela primeira vez

1. **Instale as dependências**

   ```bash
   npm install
   ```

2. **Crie o projeto no Supabase** em [supabase.com](https://supabase.com) (o plano gratuito basta).

3. **Crie as tabelas.** No painel do Supabase, abra *SQL Editor*, cole o conteúdo de
   [`supabase/migrations/20261018000000_init.sql`](supabase/migrations/20261018000000_init.sql) e rode.
   Isso cria viagens, membros, roteiro, reservas, gastos, checklist, documentos, as regras de acesso (RLS),
   o bucket de documentos e o tempo real.

4. **Configure o login** em *Authentication*:
   - *URL Configuration › Redirect URLs*: adicione `tripi://auth/callback` e, para testar no navegador,
     `http://localhost:8081/auth/callback`. Com o Expo Go, adicione também `exp://**`.
   - *Providers › Email*: já vem ativo. Para testar sem confirmar e-mail, desligue *Confirm email*.
   - *Providers › Google* e *Apple* (opcional): siga o assistente de cada provedor no painel.

5. **Conecte o app.** Copie `.env.example` para `.env.local` e preencha a URL e a *publishable key*
   (*Project Settings › API*).

6. **Inicie**

   ```bash
   npx expo start
   ```

   Abra no celular com o app **Expo Go** (QR code), ou aperte `w` para o navegador.

## Comandos

```bash
npx expo start        # servidor de desenvolvimento
npm run lint          # lint
npm run typecheck     # TypeScript
npx expo-doctor       # diagnóstico de dependências
```

## Estrutura

```
src/
  app/                    rotas (Expo Router)
    (auth)/               login, criar conta, esqueci a senha
    (app)/                área logada
      index.tsx           Minhas viagens (+ estado vazio e carregamento)
      nova-viagem.tsx
      perfil.tsx, aparencia.tsx
      convite/[code].tsx  entrar numa viagem pelo link
      viagem/[id]/
        (tabs)/           Visão geral · Roteiro · Reservas · Gastos · Mais
        atividade-nova, reserva-nova, gasto-novo, checklist
  components/             UI (vidro, botões, campos, barra de abas…)
  data/                   consultas e gravações no Supabase (React Query) + tempo real
  lib/                    cliente Supabase, formatação pt-BR, rótulos, tipos
  providers/              sessão de login
  theme/                  cores claro/escuro e preferência de tema
supabase/migrations/      esquema do banco
```

## O que já funciona

- Conta: criar conta, login por e-mail, Apple (iOS) e Google, recuperar senha, sair
- Minhas viagens: próxima viagem com contagem regressiva e preparo do checklist, planejando, anteriores, estado vazio
- Nova viagem com destinos, datas, moeda, orçamento e tipo — já cria um checklist sugerido
- Visão geral: dias para ir, duração, viajantes, próximo compromisso, orçamento e atalhos
- Roteiro por dia com nova atividade
- Reservas com filtro por tipo; ao salvar, o valor vira gasto e a reserva pode entrar no roteiro
- Gastos: total, orçamento, por pessoa, por categoria e lista com quem pagou
- Checklist da mala (marcar, adicionar, remover)
- Documentos: enviar PDF/foto/câmera, validade, “só meu” ou “da viagem”, abrir, guardar no aparelho para usar sem internet, excluir
- Contatos de emergência com ligação em um toque
- Anotações compartilhadas
- Mapa da viagem: lugares de cada dia, abrir no app de mapas e rota do dia
- Viajantes: papéis (organizador, pode editar, só visualiza), remover, sair, link de convite liga/desliga
- Configurações da viagem: editar dados, arquivar, excluir
- Exportar roteiro em PDF (escolhendo as seções) e compartilhar
- Atualização em tempo real entre viajantes
- Tema Automático / Claro / Escuro

## Próximas etapas

- Detalhes e edição de reserva, atividade e gasto; exclusão
- Câmbio e totais em reais, acerto de contas
- Mapa com pinos (precisa converter endereços em coordenadas)
- Notificações, importar reservas por e-mail
- Fila offline (salvar sem internet e sincronizar depois)
- Ícone e splash definitivos, builds com EAS
