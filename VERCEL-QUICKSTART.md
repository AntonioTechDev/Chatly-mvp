# ⚡ Vercel Quick Start - Chatly

## 🎯 Deployment in 5 Minuti

### 1️⃣ Push su GitHub (1 min)
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin Documental-Area
```

### 2️⃣ Importa su Vercel (2 min)
1. Vai su [vercel.com/new](https://vercel.com/new)
2. Click "Import" sul repo `Chatly-mvp`
3. Framework: **Vite** (auto-detected)
4. Click "Deploy" (per ora senza env vars)

### 3️⃣ Aggiungi Environment Variables (2 min)
Dopo il primo deploy (anche se fallisce):

**Dashboard → Settings → Environment Variables**

Copia-incolla TUTTE queste variabili (una per riga):

```bash
VITE_SUPABASE_URL=https://dstzlwmumpbcmrncujft.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdHpsd211bXBiY21ybmN1amZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzODYxODEsImV4cCI6MjA3Nzk2MjE4MX0.E705lg_bj2-L6FLW7hS5B3MR-xtF1aA73eXDoRGpaAM
VITE_APP_NAME=Chatly MVP
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
VITE_DEBUG_MODE=false
```

**Per ogni variabile:**
- Seleziona: ✅ Production ✅ Preview ✅ Development
- Click "Save"

### 4️⃣ Redeploy
**Deployments → Latest → Redeploy**

### 5️⃣ Configura Supabase
**Supabase Dashboard → Authentication → URL Configuration**

Aggiungi il tuo URL Vercel:
```
https://chatly-mvp-[tuo-username].vercel.app
```

---

## ✅ Checklist Post-Deploy

- [ ] App si apre senza errori
- [ ] Login funziona
- [ ] Real-time updates funzionano
- [ ] Upload documenti funziona
- [ ] Mobile responsive

---

## 🆘 Problemi Comuni

### ❌ Build Failed
```bash
# Testa localmente
npm run build

# Se funziona, problema è env vars
```

### ❌ "Variable undefined"
Hai dimenticato di aggiungere una variabile `VITE_*` su Vercel

### ❌ CORS Error
Aggiungi URL Vercel su Supabase Authentication settings

### ❌ 404 su tutte le route
Verifica che `vercel.json` sia committato nel repo

---

## 📱 URL della Tua App

Dopo il deploy trovi l'URL qui:
```
https://chatly-mvp-[username].vercel.app
```

Salvalo nel tuo `.env` locale:
```bash
PRODUCTION_URL=https://chatly-mvp-[username].vercel.app
```

---

**🎉 Fatto! La tua app è online!**

Per la guida completa vedi: [DEPLOYMENT.md](./DEPLOYMENT.md)
