# Discord Me### 📊 **Sistema de Análise Completo**
- ✅ **Formulário Completo de Candidato**:
  - Nome do Personagem (obrigatório)
  - ID do Servidor
  - Nome Real
  - Data de Nascimento
  - Discord ID (obrigatório)
  - Set no Servidor
  - Link da Stream
  - Horário de Login
- ✅ **Busca Dual Automatizada**:
  - **Nome do Personagem**: 30 dias nos 2 canais de Connect/Desconect
  - **Discord ID**: 45 dias no canal de Banimentos
- ✅ **Página de Resultados**: Histórico separado com controles de data
- ✅ **Sistema de Webhooks**: Notificações automáticas via Discord
- ✅ **Botões de Ação**: Aprovar/Reprovar com envio de embeds
- ✅ **Refresh Customizável**: Atualizar busca com datas personalizadaslter

Uma aplicação Next.js que permite filtrar e buscar mensagens do Discord de uma guilda específica usando a API do Discord.

## 📋 Funcionalidades

### 🔐 **Sistema de Autenticação**
- ✅ **OAuth2 Discord**: Login seguro com Discord
- ✅ **Autorização por Cargo**: Apenas usuários com cargo específico têm acesso
- ✅ **Middleware de Proteção**: Rotas protegidas automaticamente
- ✅ **Verificação de Permissões**: Validação em servidor terceiro

### 📊 **Sistema de Análise Completo**
- ✅ **Dashboard Intuitivo**: Interface para análise de candidatos
- ✅ **Histórico de Logins do MySQL**: 
  - Consulta direta ao banco de dados
  - Logins organizados por dia
  - Contador total de logins
  - Horários detalhados de cada login
- ✅ **Busca de Mensagens Discord**:
  - **Connect/Disconnect**: Logs de entrada e saída
  - **Banimentos**: Histórico de punições
  - Filtros de data personalizados
- ✅ **Página de Resultados**: Histórico separado com controles de data
- ✅ **Botões de Ação**: Aprovar/Reprovar candidatos
- ✅ **Sistema de Webhooks**: Notificações automáticas via Discord

### 🎨 **Interface e UX**
- ✅ **Design Responsivo**: Funciona perfeitamente em desktop e mobile
- ✅ **Tema Dark/Light**: Toggle de tema com persistência
- ✅ **Interface Moderna**: Boxes elegantes com sombra e bordas
- ✅ **Loading States**: Feedback visual durante operações
- ✅ **Tratamento de Erros**: Mensagens claras de erro

### 💾 **Integração com Banco de Dados**
- ✅ **MySQL Connection Pool**: Conexões otimizadas
- ✅ **Histórico de Logins**: Tabela `login_history` com timestamps Unix
- ✅ **Queries Otimizadas**: Buscas indexadas por Discord ID
- ✅ **Agrupamento por Dia**: Organização automática dos logins

## Pré-requisitos

1. **Node.js** (versão 18 ou superior)
2. **MySQL** (versão 5.7 ou superior)
3. **Bot do Discord** configurado com as permissões necessárias
4. **Guild ID** do servidor Discord que você deseja monitorar

## 📦 Instalação

### 1. Clone o repositório
```bash
git clone <seu-repositorio>
cd discord-bot
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o Banco de Dados MySQL

Execute o seguinte SQL no seu servidor MySQL:

```sql
CREATE DATABASE IF NOT EXISTS discord_bot;
USE discord_bot;

CREATE TABLE `login_history` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `discordId` VARCHAR(255) NOT NULL DEFAULT '0' COLLATE 'utf8mb4_general_ci',
    `loginAt` INT(11) NOT NULL DEFAULT unix_timestamp(),
    PRIMARY KEY (`id`) USING BTREE,
    INDEX `discordId` (`discordId`) USING BTREE
)
COLLATE='utf8mb4_general_ci'
ENGINE=InnoDB
AUTO_INCREMENT=1016;
```

### 4. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` e preencha com suas credenciais:

```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN=seu_token_do_bot_aqui
DISCORD_CLIENT_ID=seu_client_id_aqui
DISCORD_CLIENT_SECRET=seu_client_secret_aqui

# MySQL Database Configuration
DB_HOST=localhost          # ou IP do seu servidor MySQL
DB_USER=root              # seu usuário MySQL
DB_PASSWORD=sua_senha     # sua senha MySQL
DB_NAME=discord_bot       # nome do banco de dados
DB_PORT=3306             # porta do MySQL (padrão 3306)
```

### 5. Execute o projeto

**Modo de desenvolvimento:**
```bash
npm run dev
```

**Modo de produção:**
```bash
npm run build
npm start
```

Acesse: `http://localhost:3000`

## Pré-requisitos

## Configuração do Bot Discord

### 1. Criar um Bot Discord

1. Acesse o [Discord Developer Portal](https://discord.com/developers/applications)
2. Clique em "New Application" e dê um nome ao seu bot
3. Vá para a aba "Bot" e clique em "Add Bot"
4. Copie o **Token** do bot (você precisará dele)

### 2. Configurar Permissões

Na aba "Bot", certifique-se de que as seguintes permissões estão habilitadas:
- `Read Message History`
- `View Channels`
- `Read Messages/View Channels`

### 3. Adicionar o Bot ao Servidor

1. Vá para a aba "OAuth2" > "URL Generator"
2. Selecione o escopo "bot"
3. Selecione as permissões:
   - Read Message History
   - View Channels
4. Use o link gerado para adicionar o bot ao seu servidor

### 4. Obter o Guild ID

1. No Discord, vá em Configurações > Avançado > Modo Desenvolvedor
2. Clique com o botão direito no seu servidor e selecione "Copiar ID"

## Instalação e Configuração

### 1. Clone e instale dependências

```bash
# As dependências já foram instaladas durante a criação do projeto
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env.local`:

```bash
copy .env.example .env.local
```

Edite o arquivo `.env.local` com suas informações:

```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN=seu_token_do_bot_aqui
DISCORD_CLIENT_ID=seu_client_id_aqui
DISCORD_CLIENT_SECRET=seu_client_secret_aqui

# Guild Configuration
DISCORD_GUILD_ID=seu_guild_id_aqui

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua_chave_secreta_aqui
```

### 3. Executar o projeto

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## Configuração dos Servidores

Esta aplicação está configurada para buscar mensagens em **2 servidores Discord específicos**, cada um com **2 canais**, e **período de 45 dias**:

### 📝 **Configuração Completa:**

#### 1. **Configurar Variáveis de Ambiente (.env.local):**

```bash
# Discord Bot Configuration
DISCORD_BOT_TOKEN=seu_token_do_bot_aqui
DISCORD_CLIENT_ID=seu_client_id_aqui
DISCORD_CLIENT_SECRET=seu_client_secret_aqui

# Permission Configuration  
PERMISSION_GUILD_ID=seu_guild_id_de_permissoes_aqui
REQUIRED_ROLE_ID=seu_role_id_necessario_aqui

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua_chave_secreta_aqui
```

#### 2. **Configurar IDs dos Servidores (src/config/discord.ts):**

```typescript
export const DISCORD_SERVERS = {
  SERVER1: {
    guildId: 'SEU_GUILD_ID_1',                      // ID do primeiro servidor
    channelIds: ['CHANNEL_ID_1A', 'CHANNEL_ID_1B'], // IDs dos 2 canais do servidor 1
    name: 'Nome do Servidor 1',                     // Nome amigável
    daysBack: 45                                    // Buscar mensagens dos últimos 45 dias
  },
  SERVER2: {
    guildId: 'SEU_GUILD_ID_2',                      // ID do segundo servidor
    channelIds: ['CHANNEL_ID_2A'],                  // ID de apenas 1 canal do servidor 2
    name: 'Nome do Servidor 2',                     // Nome amigável
    daysBack: 30                                    // Buscar mensagens dos últimos 30 dias
  }
};
```

### 🔍 **Como Obter os IDs:**

1. **Ative o Modo Desenvolvedor** no Discord (Configurações > Avançado > Modo Desenvolvedor)
2. **Guild ID**: Clique com botão direito no servidor → "Copiar ID"
3. **Channel IDs**: Clique com botão direito em cada canal → "Copiar ID" (2 IDs para SERVER1, 1 ID para SERVER2)
4. **Role ID**: Clique com botão direito no cargo → "Copiar ID"

### 🔗 **Configurar Webhooks do Discord:**

1. **No canal de aprovações**: Configurações do Canal → Integrações → Webhooks → Criar Webhook
2. **No canal de reprovações**: Configurações do Canal → Integrações → Webhooks → Criar Webhook
3. **Copiar a URL** completa de cada webhook
4. **Adicionar no .env.local** as URLs nas variáveis `APPROVAL_WEBHOOK_URL` e `REJECTION_WEBHOOK_URL`

## Como Usar

### 🚀 **Fluxo do Sistema:**

1. **Acesse a aplicação** em http://localhost:3000
2. **Faça login com Discord** (apenas usuários autorizados)
3. **No Dashboard**: Insira Discord ID e nome do personagem
4. **Análise Automática**:
   - Sistema busca automaticamente nos canais configurados
   - **Connect/Disconnect**: Busca por nome do personagem (30 dias, 2 canais)
   - **Banimentos**: Busca por Discord ID (45 dias, 1 canal)
5. **Página de Resultados**:
   - Visualize histórico separado dos dois tipos de busca
   - Ajuste datas e clique em "Atualizar Busca"
   - Use botões "Aprovar" ou "Reprovar" para tomar decisão

### 🔧 **Configuração de Permissões:**

- **PERMISSION_GUILD_ID**: ID do servidor onde estão os cargos de permissão
- **REQUIRED_ROLE_ID**: ID do cargo necessário para acessar o sistema
- Apenas usuários com o cargo específico podem fazer login

### 📊 **Tipos de Busca:**

- **Por Nome do Personagem**: Busca textual em mensagens dos canais de log
- **Por Discord ID**: Busca numérica no canal de banimentos
- **Datas Customizáveis**: Altere período de busca conforme necessário

## Estrutura do Projeto

```
src/
  ├── app/
  │   ├── api/messages/          # API routes para buscar mensagens
  │   └── page.tsx              # Página principal
  ├── components/
  │   └── DiscordMessageFilter.tsx  # Componente principal da interface
  ├── services/
  │   └── discordService.ts     # Serviço para interagir com a API do Discord
  └── types/
      └── discord.ts            # Definições de tipos TypeScript
```

## Tecnologias Utilizadas

- **Next.js 14**: Framework React com App Router
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Estilização
- **Discord.js**: Biblioteca para interação com a API do Discord
- **Axios**: Cliente HTTP para requisições

## Limitações e Considerações

- A API do Discord tem rate limits - a aplicação inclui delays entre requisições
- O bot precisa estar presente no servidor e ter as permissões adequadas
- Mensagens muito antigas podem não estar disponíveis dependendo das configurações do servidor
- O limite padrão é de 500 mensagens por busca

## Troubleshooting

### Bot não tem permissões
- Verifique se o bot foi adicionado ao servidor com as permissões corretas
- Confirme se o Guild ID está correto

### Erro de token inválido
- Verifique se o token do bot está correto no arquivo `.env.local`
- Certifique-se de que não há espaços extras no token

### Nenhuma mensagem encontrada
- Verifique se os filtros não estão muito restritivos
- Confirme se o bot pode ver os canais do servidor
- Teste sem filtros primeiro para ver se as mensagens são carregadas

## 🎯 Fluxo Completo do Sistema

```
🔐 Login Discord → 📋 Dashboard → 📊 Análise → ✅/❌ Decisão → 📨 Webhook → 🏠 Dashboard
```

### 📝 **Passo a Passo:**

1. **Login**: Usuário faz login com Discord OAuth2
2. **Verificação**: Sistema verifica se usuário tem cargo necessário
3. **Dashboard**: Preenchimento do formulário completo do candidato
4. **Análise**: Busca automática em dois sistemas diferentes
5. **Resultados**: Visualização lado a lado com controles de data
6. **Decisão**: Botões de aprovar/reprovar
7. **Webhook**: Envio automático de embed para canal apropriado
8. **Retorno**: Volta ao dashboard para nova análise

### 📨 **Sistema de Webhooks:**

- **Aprovação**: Embed verde enviado para canal de aprovações
- **Reprovação**: Embed vermelho enviado para canal de reprovações
- **Dados inclusos**: Todos os campos preenchidos + contagem de mensagens
- **Rodapé**: Nome do analisador que tomou a decisão

## Desenvolvimento

Para contribuir com o projeto:

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.
