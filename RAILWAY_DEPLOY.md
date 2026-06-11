# Guia de Deploy no Railway

## 📋 Pré-requisitos

- Conta no [Railway.app](https://railway.app)
- Token do bot Discord
- GitHub com o repositório conectado (recomendado)

## 🚀 Passos para Deploy

### 1. Via Dashboard do Railway

1. Acesse [railway.app](https://railway.app)
2. Clique em **"New Project"** → **"Deploy from GitHub Repo"**
3. Selecione este repositório
4. Configure as variáveis de ambiente (abra a aba "Variables")

### 2. Configurar Variáveis de Ambiente

No dashboard do Railway, defina:

```
TOKEN=seu_token_do_bot
OWNER=seu_user_id
PERMISSION=seu_user_id
```

### 3. Deploy Automático

- Railway detectará o `Procfile` ou `package.json`
- Instalará dependências automaticamente (`npm install`)
- Iniciará o bot com `node index.js`

## 💾 Armazenamento de Dados

O Railway oferece storage ephemeral por padrão. Para dados persistentes:

### Opção 1: PostgreSQL (Recomendado)
- Railway oferece PostgreSQL integrado
- Considere migrar de JSON para um banco de dados

### Opção 2: Volume de Armazenamento
- Crie um volume no Railway
- Mapeie para `/DataBaseJson` (ou outro diretório de dados)

```yaml
volumes:
  - source: /DataBaseJson
    destination: data
```

## 📊 Monitoramento

- Acesse a aba **Logs** para ver a saída do bot
- A porta será atribuída automaticamente por variável `$PORT`
- Você verá "Servidor online na porta XXXX" nos logs

## ⚠️ Problemas Comuns

### Módulo não encontrado
- Verifique se o `package.json` está na raiz
- Limpe cache: Menu → Delete → Delete Deployment

### Token inválido
- Confirme que copiou o token corretamente
- Tokens com "." no final não funcionam

### Dependências nativas falhando
- `better-sqlite3` e `canvas` podem precisar de build
- Railway tenta compilar automaticamente, mas pode falhar
- Considere usar alternativas como `sqlite3` ou `pngjs`

## 🔄 Deploy Manual (CLI)

Se preferir usar a CLI do Railway:

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

## ✅ Verificar se está rodando

```bash
railway logs
```

Você deve ver:
```
[Database] Verificando arquivos JSON...
[Slash] Iniciando carregamento de comandos...
Servidor online na porta XXXX
```

## 🔑 Secrets vs Variables

- **Variables**: Valores públicos (use para padrões)
- **Secrets**: Valores privados como TOKEN (use para dados sensíveis)

Configure o TOKEN como **Secret** no Railway.

---

**Dicas:** Railway inclui 5GB de armazenamento ephemeral grátis. Para apps maiores, considere upgrade ou usar bancos de dados externos.
