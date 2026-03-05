# 🛡️ CryptoGuard — Solana Scanner SaaS

Application SaaS complète pour scanner la blockchain Solana en temps réel.

## Stack technique
- **Backend**: Node.js + TypeScript + Express
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Base de données**: MySQL (Railway)
- **Paiements**: Stripe (carte, PayPal, Apple Pay, Google Pay)
- **Scanner**: DexScreener + RugCheck + Helius RPC
- **Langues**: 🇫🇷 FR · 🇬🇧 EN · 🇪🇸 ES · 🇩🇪 DE · 🇧🇷 PT · 🇸🇦 AR

## Structure du projet
```
cryptoguard-app/
├── server/
│   ├── index.ts          # Serveur Express + Cron scanner
│   ├── db.ts             # Connexion MySQL + init tables
│   ├── auth.ts           # Register, Login, JWT
│   ├── api.ts            # Dashboard API (stats, tokens, wallets)
│   ├── scanner.ts        # Scanner DexScreener + Rugger Detector
│   └── stripe.ts         # Paiements Stripe + Webhooks
├── client/
│   └── src/
│       ├── App.tsx        # Routage SPA
│       ├── pages/         # Landing, Auth, Dashboard, Pricing
│       ├── components/    # Header, StatCard
│       └── i18n/          # Traductions 6 langues
└── package.json
```

## Plans tarifaires
| Plan     | Prix     | Tokens | Wallets Ruggers |
|----------|----------|--------|---------------|
| Free     | 0$/mois  | 2 (floutés) | ❌ |
| Pro      | 29$/mois | 50 complets | ❌ |
| Business | 79$/mois | 200 complets | ✅ 100 |

## Installation

### 1. Cloner et installer
```bash
npm install
```

### 2. Variables d'environnement
```bash
cp .env.example .env
# Remplir DATABASE_URL, HELIUS_API_KEY, JWT_SECRET, STRIPE_SECRET_KEY...
```

### 3. Créer les produits Stripe
Dans le dashboard Stripe :
- Créer produit "CryptoGuard Pro" → prix récurrent $29/mois → copier l'ID dans `STRIPE_PRICE_PRO`
- Créer produit "CryptoGuard Business" → prix récurrent $79/mois → copier dans `STRIPE_PRICE_BUSINESS`
- Configurer le webhook Stripe vers `https://ton-domaine.com/api/stripe/webhook`
  - Événements : `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`
  - Copier le webhook secret dans `STRIPE_WEBHOOK_SECRET`

### 4. Démarrer en développement
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### 5. Build production
```bash
npm run build
npm start
```

## Déploiement Railway

1. Créer un nouveau service Railway
2. Connecter ton repo GitHub
3. Ajouter toutes les variables d'environnement
4. `NODE_ENV=production`, `PORT=3001`
5. Build command: `npm run build`
6. Start command: `npm start`

## Fonctionnement du scanner

Le scanner tourne automatiquement toutes les 15 minutes :
1. **DexScreener** → récupère les 30 derniers tokens Solana
2. **RugCheck** → score de risque (danger/warn/info)
3. **Filtre** → score ≥50 + top holder <40% + liquidité ≥$1K = SAFE
4. **Rugger Detector** → analyse les wallets des tokens RISKY via Helius
5. **Stockage** → MySQL tables `scanned_tokens` + `bundle_wallets`
