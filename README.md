# FeedbackApp - Plateforme de Feedback Anonyme Interne

[![Version](https://img.shields.io/badge/version-1.0-blue.svg)](https://github.com/sim-assurances/feedback-app)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)

## 📋 Table des Matièress

- [À propos du projet](#-à-propos-du-projet)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Technologies utilisées](#-technologies-utilisées)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [API Documentation](#-api-documentation)
- [Sécurité](#-sécurité)
- [Tests](#-tests)
- [Déploiement](#-déploiement)
- [Contribution](#-contribution)
- [Support](#-support)
- [Licence](#-licence)

## 🎯 À propos du projet

**FeedbackApp** est une plateforme de feedback anonyme développée pour **SIM Assurances**, une startup de micro-assurance digitale basée à Abidjan, Côte d'Ivoire. Cette application web permet aux employés et aux personnes extérieures de soumettre des critiques constructives de manière totalement anonyme, favorisant ainsi une culture d'amélioration continue au sein de l'entreprise.

### Contexte
Dans une démarche d'amélioration continue de la performance collective, SIM Assurances souhaite instaurer un canal de retour d'information bienveillant, sans risque de tensions interpersonnelles, grâce à une anonymisation totale et irréversible de l'identité des auteurs de commentaires.

### Objectifs principaux
- ✅ Permettre à chaque employé de recevoir des retours constructifs
- ✅ Garantir l'anonymat complet des auteurs de commentaires
- ✅ Offrir une vision globale anonymisée à l'administration
- ✅ Instaurer une culture d'amélioration continue

## 🚀 Fonctionnalités

### 👤 Rôles utilisateurs

#### **Utilisateur (Employé connecté)**
- 🔐 Authentification sécurisée (email + mot de passe)
- 👀 Consultation exclusive de ses propres critiques
- �️‍♂️ Ne voit pas l'auteur des critiques, uniquement le texte et la date
- �📅 Filtrage par période (semaine/mois)
- 🔒 Accès en lecture seule (pas de soumission)

#### **Public (Accès libre)**
- 🌐 Accès sans inscription depuis n'importe quel appareil
- ✍️ Soumission de critiques anonymes
- 👁️ Consultation de toutes les critiques publiques
- 🚫 Aucune donnée personnelle collectée

#### **Administrateur (RH/Direction)**
- 🔐 Authentification renforcée
- 📊 Vue globale anonymisée de tous les commentaires
- 🔍 Filtrage avancé (date, mots-clés)
- 🛡️ Modération et suppression de commentaires inappropriés
- 📈 Statistiques et tableaux de bord
- 📤 Export des données (CSV)

### 🎯 Fonctionnalités principales

| Fonctionnalité | User | Public | Admin |
|---------------|------|--------|-------|
| Soumettre une critique anonyme | ❌ | ✅ | ❌ |
| Voir ses propres critiques | ✅ | ❌ | ❌ |
| Filtrer par période | ✅ | ❌ | ✅ |
| Voir toutes les critiques | ❌ | ❌ | ✅ |
| Voir les critiques publiques | ❌ | ✅ | ✅ |
| Modération de contenu | ❌ | ❌ | ✅ |
| Accès sans inscription | ❌ | ✅ | ❌ |
| Tableau de bord statistiques | ❌ | ❌ | ✅ |
| Export des données | ❌ | ❌ | ✅ |

### 🔒 Sécurité et anonymat

- **Anonymisation totale** : Aucune donnée identifiable (IP, session, device)
- **Protection XSS/SQL** : Sanitisation de tous les inputs
- **Rate limiting** : Limitation des soumissions pour éviter le spam
- **CAPTCHA** : Protection anti-bot
- **HTTPS obligatoire** : Chiffrement des communications
- **Audit logging** : Traçabilité des actions administrateur

## 🏗️ Architecture

### Architecture technique
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ - User Interface│    │ - REST API      │    │ - Employees     │
│ - Public Forms  │    │ - Auth System   │    │ - Feedbacks     │
│ - Admin Dashboard│   │ - Anonymization │    │ - Audit Logs    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Modèle de données

#### Table `employees`
```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table `feedbacks`
```sql
CREATE TABLE feedbacks (
  id UUID PRIMARY KEY,
  content TEXT NOT NULL,
  recipient_id UUID REFERENCES employees(id),
  source ENUM('public', 'internal') DEFAULT 'public',
  submitted_at DATE NOT NULL,
  is_moderated BOOLEAN DEFAULT FALSE
);
```

## 🛠️ Technologies utilisées

### Frontend
- **React 18+** - Framework JavaScript
- **TypeScript** - Typage statique
- **Material-UI** - Composants UI
- **React Router** - Navigation
- **Axios** - Requêtes HTTP

### Backend
- **Node.js 18+** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Base de données
- **JWT** - Authentification
- **bcrypt** - Hashage des mots de passe
- **Helmet** - Sécurité HTTP
- **Rate limiting** - Protection anti-spam

### DevOps
- **Docker** - Conteneurisation
- **Docker Compose** - Orchestration
- **Nginx** - Reverse proxy
- **SSL/TLS** - Chiffrement
- **PM2** - Process manager

## 📦 Installation

### Prérequis
- Node.js 18+
- PostgreSQL 13+
- Docker & Docker Compose (optionnel)

### Installation rapide

1. **Installer PostgreSQL**
   ```bash
   # Windows - Télécharger depuis https://www.postgresql.org/download/windows/
   # Ou via Chocolatey : choco install postgresql
   ```

2. **Configurer la base de données**
   ```bash
   # Exécuter le script de configuration
   ./setup-database.ps1

   # Ou manuellement :
   createdb -U postgres feedback_app
   psql -U postgres -c "CREATE USER feedback_user WITH PASSWORD 'feedback_password';"
   psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE feedback_app TO feedback_user;"
   psql -U postgres -d feedback_app -f database/init.sql
   ```

3. **Installer les dépendances**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

4. **Démarrer l'application**
   ```bash
   # Backend
   npm run dev

   # Frontend (dans un autre terminal)
   cd ../frontend
   npm start
   ```

### Voir le contenu de la base de données

```bash
# Exécuter le script de visualisation
./view-database.ps1

# Ou manuellement :
psql -U postgres -d feedback_app -c "SELECT * FROM employees;"
psql -U postgres -d feedback_app -c "SELECT * FROM feedbacks;"
```

### Installation avec Docker

```bash
# Construire et démarrer tous les services
docker-compose up --build

# Ou en arrière-plan
docker-compose up -d --build
```

## ⚙️ Configuration

### Variables d'environnement

Créer un fichier `.env` dans le dossier `backend/` :

```env
# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/feedback_app

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Serveur
PORT=3001
NODE_ENV=development

# Sécurité
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Configuration avancée

- **Rate limiting** : Configurable via `RATE_LIMIT_WINDOW` et `RATE_LIMIT_MAX`
- **CAPTCHA** : Intégration Google reCAPTCHA v3
- **Logs** : Rotation automatique avec Winston
- **Backup** : Scripts automatisés PostgreSQL

## 🧪 Comptes de test

Pour tester l'application, des comptes de démonstration sont disponibles :

### Compte Administrateur
- **Email** : `admin@sim-assurances.ci`
- **Mot de passe** : `admin123`
- **Rôle** : Administrateur (accès au tableau de bord de modération)

### Compte Utilisateur
- **Email** : `test@sim-assurances.ci`
- **Mot de passe** : `test123`
- **Rôle** : Employé (accès aux fonctionnalités utilisateur)

### Création du compte test
```bash
cd backend
npm run seed
```

## 💻 Utilisation

### Pour les employés (User)

1. **Connexion**
   - Accéder à `/login`
   - Utiliser email professionnel et mot de passe

2. **Consulter ses feedbacks**
   - Dashboard personnel
   - Filtrage par semaine/mois
   - Lecture seule
   - Affichage strictement anonymisé : auteur non accessible

### Pour le public

1. **Accès direct**
   - Page publique accessible sans connexion
   - Formulaire de soumission anonyme

2. **Soumettre un feedback**
   - Sélectionner l'employé destinataire
   - Rédiger un commentaire constructif (20-500 caractères)
   - Validation CAPTCHA
   - Soumission anonyme

### Pour les administrateurs

1. **Connexion admin**
   - Accès via `/admin/login`

2. **Tableau de bord**
   - Vue globale anonymisée
   - Statistiques et métriques
   - Modération de contenu

3. **Gestion**
   - Filtrage avancé
   - Export CSV
   - Audit logs

## 📚 API Documentation

### Endpoints principaux

#### Authentification
```http
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
```

#### Feedbacks
```http
GET  /api/feedbacks/public          # Liste publique
POST /api/feedbacks/submit          # Soumission anonyme
GET  /api/feedbacks/user/:userId    # Feedbacks d'un user (auth requis)
GET  /api/feedbacks/admin           # Tous les feedbacks (admin)
DELETE /api/feedbacks/:id           # Suppression (admin)
```

#### Administration
```http
GET  /api/admin/stats               # Statistiques
GET  /api/admin/export              # Export CSV
GET  /api/admin/audit               # Logs d'audit
```

### Exemple d'utilisation API

```javascript
// Soumission anonyme
const response = await fetch('/api/feedbacks/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipientId: 'uuid-employe',
    content: 'Commentaire constructif...',
    captchaToken: 'recaptcha-token'
  })
});
```

## 🔐 Sécurité

### Mesures d'anonymisation
- ❌ **Adresse IP** : Jamais stockée
- ❌ **Cookies/Session** : Non créés pour soumissions publiques
- ❌ **User-Agent/Device ID** : Non enregistrés
- ✅ **Horodatage** : Arrondi à la journée
- ✅ **Destinataire** : Pseudonymisé dans vues admin

### Protection applicative
- 🛡️ **OWASP Top 10** : Protection contre les vulnérabilités communes
- 🔒 **CORS** : Configuration restrictive
- 🚦 **Rate limiting** : Protection anti-abus
- 🤖 **CAPTCHA** : Prévention du spam automatisé
- 📝 **Input validation** : Sanitisation côté client et serveur

### Conformité
- ✅ **RGPD** : Minimisation des données collectées
- ✅ **Anonymisation** : Conformité aux standards de confidentialité
- ✅ **Audit** : Traçabilité des actions sensibles

## 🧪 Tests

### Tests unitaires
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Tests d'intégration
```bash
npm run test:integration
```

### Tests de sécurité
```bash
npm run test:security
```

### Couverture de code
```bash
npm run test:coverage
```

## 🚀 Déploiement

### Environnements
- **Développement** : `NODE_ENV=development`
- **Production** : `NODE_ENV=production`

### Déploiement Docker
```bash
# Build production
docker-compose -f docker-compose.prod.yml up --build

# Avec SSL
docker-compose -f docker-compose.ssl.yml up --build
```

### Configuration production
- **SSL/TLS** : Certificats Let's Encrypt
- **CDN** : Cloudflare pour les assets statiques
- **Monitoring** : Prometheus + Grafana
- **Backup** : Sauvegarde automatique PostgreSQL

## 🤝 Contribution

### Processus de contribution
1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Standards de code
- **ESLint** : Respect des règles définies
- **Prettier** : Formatage automatique
- **Husky** : Pre-commit hooks
- **Conventional Commits** : Format des messages

### Tests requis
- ✅ Tests unitaires pour nouvelles fonctionnalités
- ✅ Tests d'intégration pour les APIs
- ✅ Tests de sécurité pour les changements sensibles

## 📞 Support

### Contacts
- **Équipe Technique** : tech@sim-assurances.ci
- **Département RH** : rh@sim-assurances.ci
- **Direction** : direction@sim-assurances.ci

### Documentation
- [Guide utilisateur](./docs/user-guide.md)
- [Guide administrateur](./docs/admin-guide.md)
- [API Documentation](./docs/api.md)
- [FAQ](./docs/faq.md)

### Issues et bugs
- Utiliser GitHub Issues pour signaler les problèmes
- Fournir le maximum de détails (logs, screenshots, étapes de reproduction)

## 📈 Métriques de succès

| Indicateur | Objectif | Fréquence |
|------------|----------|-----------|
| Participation employés | > 80% | Mensuelle |
| Commentaires soumis | > 10/employé/mois | Mensuelle |
| Commentaires modérés | < 5% | Mensuelle |
| Satisfaction employés | > 7/10 | Trimestrielle |
| Incidents anonymat | 0 | Continue |
| Uptime plateforme | > 99% | Continue |

## 📄 Licence

**Propriétaire - SIM Assurances © 2026**

Tous droits réservés. Ce projet est confidentiel et destiné à un usage interne uniquement.

---

*Développé avec ❤️ par l'équipe technique de SIM Assurances*

*Abidjan, Côte d'Ivoire - Mai 2026*</content>
<parameter name="filePath">c:\Users\SIM ASSURANCES\OneDrive\Documentos\Feedback_Simas\README.md