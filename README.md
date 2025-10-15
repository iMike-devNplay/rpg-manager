# 🎲 RPG Manager

Une application web moderne pour la gestion de parties de jeu de rôle, construite avec Node.js et Angular.

## 🚀 Fonctionnalités

### Mode Joueur
- **Dashboard personnalisable** avec 5 zones configurables (haut, gauche, droite, bas, centre)
- **Gestion des données numériques** (attributs comme Force, Constitution, etc.)
- **Gestion des données textuelles** (armes, sorts, capacités avec descriptions)
- **Système de groupes** pour organiser les données par catégories
- **Drag & Drop** pour réorganiser les éléments (à implémenter)

### Mode Maître de Jeu
- Toutes les fonctionnalités du mode Joueur
- **Écran de combat** dédié (à implémenter)
- **Gestion des joueurs** avec onglets individuels (à implémenter)
- **Vue d'ensemble des sessions** de jeu

### Fonctionnalités Communes
- **Stockage local** : toutes les données restent dans votre navigateur
- **Export/Import JSON** : sauvegardez et partagez vos données facilement
- **Session utilisateur** : un nom d'utilisateur suffit, pas de mot de passe
- **Interface responsive** : fonctionne sur ordinateur, tablette et mobile

## 🛠️ Technologies

- **Frontend** : Angular 18+ (TypeScript)
- **Backend** : Node.js + Express (serveur de fichiers statiques)
- **Stockage** : localStorage du navigateur
- **Styles** : SCSS + CSS Grid/Flexbox
- **Pas de base de données** : tout reste local

## 📦 Installation

### Prérequis
- Node.js 18+ 
- npm 8+

### Installation complète
```bash
# Cloner le projet
git clone <url-du-repo>
cd rpg-manager

# Installer toutes les dépendances
npm run setup
```

### Installation manuelle
```bash
# Installer les dépendances du backend
npm install

# Installer les dépendances du frontend
cd frontend
npm install
cd ..
```

## 🚀 Utilisation

### Mode Développement

#### Option 1 : Frontend seul (recommandé)
```bash
cd frontend
ng serve --port 4201
```
Puis ouvrir http://localhost:4201

#### Option 2 : Serveur complet
```bash
# Construire le frontend
npm run build

# Démarrer le serveur
npm start
```
Puis ouvrir http://localhost:3000

### Mode Production
```bash
# Construire l'application
npm run build

# Démarrer le serveur
npm start
```

## 📁 Structure du Projet

```
rpg-manager/
├── frontend/                 # Application Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/   # Composants Angular
│   │   │   ├── services/     # Services (stockage, utilisateur)
│   │   │   ├── models/       # Interfaces TypeScript
│   │   │   └── guards/       # Guards de route
│   │   └── styles.scss       # Styles globaux
│   └── angular.json
├── server.js                 # Serveur Node.js Express
├── package.json             # Dépendances backend
└── README.md
```

## 🎮 Guide d'utilisation

### Première connexion
1. Ouvrir l'application
2. Entrer votre nom d'utilisateur (2 caractères minimum)
3. Choisir votre mode : **Joueur** ou **Maître de jeu**
4. Cliquer sur "Se connecter"

### Gestion des données
1. Choisir une zone du dashboard (haut, gauche, droite, bas, centre)
2. Cliquer sur "**+ Ajouter**" dans la zone souhaitée
3. Remplir les informations :
   - **Nom** : nom de l'élément (ex: "Force", "Épée longue")
   - **Type** : Numérique (ex: 15) ou Texte (ex: "Épée +1")
   - **Valeur** : la valeur de l'attribut ou la description
   - **Description** : informations supplémentaires (optionnel)

### Export/Import
- **Export** : bouton "📤 Exporter" pour télécharger vos données en JSON
- **Import** : bouton "📥 Importer" pour charger un fichier JSON

### Changement de mode
- Utiliser le bouton "🔄 Mode Maître/Joueur" pour basculer entre les modes

## 🔧 Développement

### Scripts NPM disponibles
```bash
npm start              # Démarrer le serveur de production
npm run dev            # Démarrer le serveur en mode développement
npm run build          # Construire l'application frontend
npm run setup          # Installation complète des dépendances
npm run install-frontend  # Installer seulement les dépendances frontend
```

### Architecture des données
Les données sont stockées localement dans le `localStorage` du navigateur avec la structure suivante :

```typescript
interface User {
  id: string;
  username: string;
  mode: 'player' | 'gamemaster';
  createdAt: Date;
}

interface DataItem {
  id: string;
  name: string;
  type: 'numeric' | 'text';
  value: string | number;
  description?: string;
  zone: 'top' | 'left' | 'right' | 'bottom' | 'center';
  order: number;
  userId: string;
}
```

### Fonctionnalités à implémenter
- [ ] Drag & Drop pour réorganiser les éléments
- [ ] Système de groupes dans les zones
- [ ] Écran de combat pour les maîtres de jeu
- [ ] Gestion des joueurs avec onglets
- [ ] Système de notifications
- [ ] Thèmes personnalisables
- [ ] Sauvegarde automatique
- [ ] Historique des modifications

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifiez que Node.js et npm sont installés
2. Effacez le localStorage de votre navigateur si nécessaire
3. Redémarrez le serveur de développement
4. Consultez la console du navigateur pour les erreurs JavaScript

## 🎯 Roadmap

### Version 1.1
- [ ] Système de drag & drop
- [ ] Interface de combat
- [ ] Gestion multi-joueurs

### Version 1.2
- [ ] Thèmes personnalisables
- [ ] Export en PDF
- [ ] Sauvegarde cloud optionnelle

---

**Fait avec ❤️ pour la communauté du jeu de rôle**