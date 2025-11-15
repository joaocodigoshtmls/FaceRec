# 🚀 FaceRec - Quick Reference Card

> Guia de referência rápida para deploy e troubleshooting

---

## 📚 Documentação

| Arquivo | Use Quando |
|---------|------------|
| [DEPLOY_RAPIDO.md](./DEPLOY_RAPIDO.md) | Primeira vez fazendo deploy |
| [GUIA_DEPLOY_COMPLETO.md](./GUIA_DEPLOY_COMPLETO.md) | Precisa de detalhes/troubleshooting |
| [DATABASE_CONFIG.md](./DATABASE_CONFIG.md) | Problemas com banco de dados |
| [CORS_CONFIG.md](./CORS_CONFIG.md) | Erros de CORS no frontend |
| [README_DEPLOY.md](./README_DEPLOY.md) | Visão geral e índice |

---

## 🔑 Variáveis de Ambiente

### Netlify (Frontend)
```bash
VITE_API_URL=https://seu-backend.railway.app/api
VITE_CAM_BASE=https://seu-backend.railway.app
VITE_SOCKET_BASE=https://seu-backend.railway.app
VITE_CLASSROOM_CODE=3AT.I
```

### Railway (Backend)
```bash
DATABASE_URL=mysql://facerec:senha@mysql-facerec.alwaysdata.net:3306/facerec_1
JWT_SECRET=GERE_COM_openssl_rand_-base64_32
CORS_ORIGINS=https://seu-site.netlify.app
NODE_ENV=production
```

---

## ⚡ Comandos Rápidos

### Gerar JWT_SECRET
```bash
openssl rand -base64 32
```

### Testar Backend
```bash
curl https://seu-backend.railway.app/health
```

### Testar CORS
```bash
curl -I -X OPTIONS https://backend.railway.app/api/login \
  -H "Origin: https://frontend.netlify.app"
```

### Forçar Redeploy
```bash
git commit --allow-empty -m "redeploy" && git push
```

---

## 🚨 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| **CORS Error** | Adicione URL do Netlify ao `CORS_ORIGINS` no Railway |
| **500 Error** | Verifique `DATABASE_URL` e logs do Railway |
| **404 após refresh** | Certifique-se de que `netlify.toml` existe |
| **Build falha** | Limpe cache: Netlify > Trigger deploy > Clear cache |
| **Dados não aparecem** | Verifique logs do Railway e ownership no banco |

---

## 📋 Checklist Rápido

### AlwaysData
- [ ] Banco criado
- [ ] Connection string anotada

### Railway
- [ ] Projeto criado
- [ ] Variáveis configuradas
- [ ] Build/Start configurados
- [ ] `/health` retorna 200

### Netlify
- [ ] Site criado
- [ ] Variáveis configuradas
- [ ] Build bem-sucedido
- [ ] Site abre sem erro

### Final
- [ ] CORS atualizado
- [ ] Login funciona
- [ ] Dados carregam
- [ ] Senhas alteradas

---

## 🔗 URLs Importantes

- **Netlify:** https://www.netlify.com/
- **Railway:** https://railway.app/
- **AlwaysData:** https://admin.alwaysdata.com/

---

## 💡 Dicas

1. **Sempre teste localmente antes de fazer deploy**
2. **Mantenha .env no .gitignore**
3. **Use JWT_SECRET forte (32+ chars)**
4. **Configure CORS apenas com domínios necessários**
5. **Monitore logs do Railway regularmente**

---

## 📞 Onde Buscar Ajuda

- **Problema com CORS?** → [CORS_CONFIG.md](./CORS_CONFIG.md)
- **Problema com Banco?** → [DATABASE_CONFIG.md](./DATABASE_CONFIG.md)
- **Problema geral?** → [GUIA_DEPLOY_COMPLETO.md](./GUIA_DEPLOY_COMPLETO.md) (seção Troubleshooting)
- **Primeira vez?** → [DEPLOY_RAPIDO.md](./DEPLOY_RAPIDO.md)

---

**Tempo estimado de deploy:** 25 minutos  
**Custo mensal:** $0-5  
**Status:** ✅ Production Ready

**Próximo passo:** Leia [DEPLOY_RAPIDO.md](./DEPLOY_RAPIDO.md) 🚀
