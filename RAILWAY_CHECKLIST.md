# ✅ Checklist de Deploy no Railway

## Arquivos Criados
- [x] **Procfile** - Instruções para iniciar o bot
- [x] **.env.example** - Modelo de variáveis de ambiente
- [x] **railway.json** - Configuração do Railway
- [x] **RAILWAY_DEPLOY.md** - Guia completo de deploy

## Configuração do Projeto
- [x] PORT configurado dinamicamente (`process.env.PORT`)
- [x] Node.js 20.x especificado no package.json
- [x] Express server pronto
- [x] .gitignore com .env ignorado

## Próximos Passos

### 1️⃣ Prepare o GitHub
```bash
git add .
git commit -m "chore: prepare for Railway deployment"
git push origin main
```

### 2️⃣ Crie Projeto no Railway
- Vá para https://railway.app
- Clique "New Project" → "Deploy from GitHub"
- Selecione este repositório

### 3️⃣ Configure Variáveis
No Railway Dashboard → Variables:
```
TOKEN=seu_token_do_bot
OWNER=seu_owner_id
PERMISSION=seu_permission_id
```

### 4️⃣ Inicie o Deploy
- Railway detectará automaticamente
- Instalará dependências
- Iniciará o bot

## 🔍 Verificação

Após deploy, verifique nos **Logs**:
```
[Database] Verificando arquivos JSON...
[Slash] Iniciando carregamento de comandos...
Servidor online na porta XXXX
```

## ⚙️ Configurações Importantes

### Armazenamento de Dados
- Railway usa storage ephemeral (dados temporários)
- Para dados persistentes: Configure um Volume Storage
- Mapeie: `/workspaces/Black-store/DataBaseJson` → `/data`

### Recursos Recomendados
- **Memory**: 512MB (mínimo)
- **CPU**: Shared (gratuito)
- **Replicas**: 1

### Variáveis Sensíveis
- Use **Secrets** para TOKEN (não aparece em logs)
- Use **Variables** para valores públicos

---

**Status**: ✅ Projeto pronto para Railway!
