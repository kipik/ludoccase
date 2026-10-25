# 🎲 Ludoccase

Plateforme communautaire **100 % gratuite et sans commission** d'achat et de vente de jeux de société d'occasion.
Propulsée par la base de données de jeux et d'éditions **CWOWD** (`cms-jeux` / Strapi 5).

---

## 🚀 Installation pour travailler en équipe

### 1. Prérequis
- **Node.js** `>= 20` (ou `22`)
- **Yarn** (`1.22+`)
- Accès au backend Strapi (`cms-jeux` en local sur `http://127.0.0.1:1337` ou serveur de dev/prod)

### 2. Cloner et installer
```bash
git clone https://github.com/kipik/Ludoccase.git
cd Ludoccase
cp .env.example .env
yarn install
```

### 3. Lancer le serveur de développement
Par défaut, Ludoccase tourne sur le port **`3001`** (pour pouvoir tourner en parallèle de `cms-frontend` sur `3000` et de Strapi sur `1337`) :
```bash
yarn dev
```
Ouvrir [http://localhost:3001](http://localhost:3001).

---

## 🏗️ Fonctionnalités du MVP
- **Recherche structurée par jeu & édition** (connectée à Strapi `cms-jeux`).
- **Dépôt d'annonce en 15 secondes** : Recherche par titre ou **scan du code-barres EAN** par caméra (`EanScannerModal.vue`).
- **Vitrine vendeur & Créateur de lots** (`/vendeur/[username]`) : Sélection multiple de jeux chez un même vendeur pour négocier un lot et mutualiser les frais de port.
- **Messagerie interne & Notifications Email** (`/messages`) : Discussions d'achat/vente, réservation d'annonce, confirmation de vente et envoi d'emails via SMTP (Brevo / Amazon SES).
- **Authentification Hybride & Badge CWOWD** : Inscription ouverte à tous par email, ou connexion SSO via le forum CWOWD avec attribution automatique du badge **Membre CWOWD vérifié**.
- **Synchronisation CWOWD 1-clic** (`/profil`) : Importe automatiquement les jeux marqués *"À vendre"* sur `cwowd.fr`.
