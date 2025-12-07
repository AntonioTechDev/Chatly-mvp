# 🚀 Guida Deployment Chatly su Vercel

Questa guida ti mostra come deployare Chatly su Vercel in modo sicuro e professionale.

## 📋 Pre-requisiti

- ✅ Account Vercel (gratuito su [vercel.com](https://vercel.com))
- ✅ Account GitHub con repository Chatly
- ✅ File `.env` con tutte le variabili configurate localmente

---

## 🔐 Step 1: Prepara le Variabili d'Ambiente

### Variabili OBBLIGATORIE (Pubbliche - Frontend):

```bash
VITE_SUPABASE_URL=https://dstzlwmumpbcmrncujft.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_NAME=Chatly MVP
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
```

### Variabili OPZIONALI (Feature Flags):

```bash
VITE_ENABLE_AI_ASSISTANT=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_WHATSAPP=true
VITE_ENABLE_INSTAGRAM=true
VITE_ENABLE_MESSENGER=true
VITE_DEBUG_MODE=false
VITE_SHOW_QUERY_LOGS=false
VITE_SESSION_TIMEOUT=60
```

⚠️ **IMPORTANTE**: NON includere variabili segrete come:
- `SUPABASE_SERVICE_ROLE_KEY` (solo backend/n8n)
- `OPENAI_API_KEY` (solo backend/n8n)
- Token di accesso privati

Queste chiavi vanno **SOLO su n8n** o backend server, MAI nel frontend!

---

## 📦 Step 2: Push su GitHub

```bash
# Assicurati di essere sul branch corretto
git status

# Aggiungi i file di configurazione Vercel
git add vercel.json .gitignore DEPLOYMENT.md
git commit -m "Add Vercel deployment configuration"

# Push su GitHub
git push origin Documental-Area
```

---

## 🌐 Step 3: Deploy su Vercel

### Opzione A: Deploy tramite Dashboard (Consigliato)

1. **Vai su [vercel.com](https://vercel.com)** e fai login
2. **Click su "Add New Project"**
3. **Importa da GitHub:**
   - Seleziona il repository `Chatly-mvp`
   - Click su "Import"

4. **Configura il Progetto:**
   - **Framework Preset:** Vite (auto-detected)
   - **Root Directory:** `.` (lascia vuoto)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)

5. **Aggiungi Environment Variables:**
   - Click su "Environment Variables"
   - Per OGNI variabile dal tuo `.env` locale:
     - Name: `VITE_SUPABASE_URL`
     - Value: `https://dstzlwmumpbcmrncujft.supabase.co`
     - Environment: Production, Preview, Development (seleziona tutti)
   - Ripeti per TUTTE le variabili `VITE_*`

6. **Deploy:**
   - Click su "Deploy"
   - Aspetta 2-3 minuti

### Opzione B: Deploy tramite CLI

```bash
# Installa Vercel CLI globalmente
npm i -g vercel

# Login
vercel login

# Deploy production
vercel --prod

# Segui il prompt e configura le env vars
```

---

## ✅ Step 4: Configura il Dominio (Opzionale)

1. **Dashboard Vercel → Settings → Domains**
2. Aggiungi il tuo dominio custom (es: `chatly.tuodominio.com`)
3. Configura i DNS records presso il tuo provider:
   ```
   Type: CNAME
   Name: chatly (o @)
   Value: cname.vercel-dns.com
   ```

---

## 🔒 Step 5: Configura Supabase per Produzione

### 1. Aggiungi il dominio Vercel agli URL autorizzati:

**Vai su Supabase Dashboard → Authentication → URL Configuration:**

Aggiungi questi URL:
```
https://tuo-progetto.vercel.app
https://tuo-dominio-custom.com (se configurato)
```

### 2. Verifica RLS Policies:

Assicurati che le Row Level Security policies siano attive su tutte le tabelle:

```sql
-- Verifica RLS è abilitato
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

Tutte le tabelle devono avere `rowsecurity = true`.

---

## 🧪 Step 6: Test dell'Applicazione

### Checklist Testing:

- [ ] **Login**: Prova login con credenziali reali
- [ ] **Real-time**: Verifica che le conversazioni si aggiornino in tempo reale
- [ ] **Upload Documenti**: Carica un documento e verifica webhook n8n
- [ ] **Download Documenti**: Scarica un documento
- [ ] **Responsive**: Testa su mobile e tablet
- [ ] **Performance**: Controlla velocità caricamento (<3s first load)
- [ ] **HTTPS**: Verifica che tutte le richieste siano HTTPS

---

## 🔧 Troubleshooting

### Problema: "Failed to load resource: 404"

**Soluzione**: Verifica che `vercel.json` abbia le rewrites corrette:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Problema: "CORS error"

**Soluzione**: Aggiungi il dominio Vercel a Supabase URL configuration

### Problema: "Environment variable undefined"

**Soluzione**:
1. Verifica che TUTTE le variabili `VITE_*` siano su Vercel
2. Redeploy: Dashboard → Deployments → Latest → Redeploy

### Problema: Build fallisce

**Soluzione**:
```bash
# Testa build localmente
npm run build

# Se funziona localmente, controlla:
# 1. Node version su Vercel (Settings → General → Node.js Version)
# 2. Dependencies in package.json
```

---

## 📊 Monitoraggio

### Analytics Vercel (Gratuito):

1. **Dashboard → Analytics**
2. Monitora:
   - Page views
   - Performance metrics (Web Vitals)
   - Geography users
   - Errors (4xx, 5xx)

### Logs in Tempo Reale:

```bash
# Vedi logs in tempo reale
vercel logs tuo-deployment-url --follow
```

---

## 🔄 Deploy Automatico (CI/CD)

Vercel fa deploy automatico:
- ✅ **Production**: Ogni push su `main`
- ✅ **Preview**: Ogni push su altri branch + PR

Per disabilitare/configurare:
**Settings → Git → Production Branch**

---

## 🛡️ Security Best Practices

### ✅ Fatto:
- Headers di sicurezza configurati in `vercel.json`
- HTTPS forzato automaticamente
- Environment variables sicure
- `.env` in `.gitignore`

### ⚠️ Da Verificare:

1. **Supabase RLS attivo su TUTTE le tabelle**
2. **Service Role Key NON nel frontend**
3. **Rate limiting configurato su Supabase**
4. **2FA attivo su account Vercel**
5. **Backup database regolari**

---

## 💰 Costi

### Vercel Free Tier:
- ✅ 100 GB bandwidth/month
- ✅ Deploy illimitati
- ✅ HTTPS gratuito
- ✅ Preview deployments
- ✅ Analytics base

### Quando fare Upgrade:
- Se superi 100 GB/month bandwidth
- Se vuoi password protection su preview
- Se vuoi analytics avanzati

---

## 📞 Supporto

- **Documentazione Vercel**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Community Vercel**: https://github.com/vercel/vercel/discussions

---

## ✨ Post-Deployment

Dopo il primo deploy:

1. **Salva l'URL Vercel** nel tuo `.env.example`:
   ```bash
   # Production URL
   PRODUCTION_URL=https://chatly-mvp.vercel.app
   ```

2. **Aggiorna la documentazione** con il nuovo URL

3. **Comunica il nuovo URL** agli utenti/team

4. **Configura monitoring** (Vercel Analytics + Supabase Metrics)

---

🎉 **Congratulazioni! Chatly è online!**
