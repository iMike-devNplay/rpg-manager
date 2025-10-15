# RPG Manager - Instructions pour Copilot

## Vue d'ensemble du projet
Application de gestion de jeu de rôle construite avec Node.js (backend simple) et Angular (frontend).

## Architecture technique
- **Frontend**: Angular (TypeScript)
- **Backend**: Node.js simple (serveur de fichiers statiques)
- **Stockage**: localStorage du navigateur
- **Pas de base de données**

## Fonctionnalités principales
- Gestion d'utilisateur unique par session (nom d'utilisateur seulement)
- Mode Joueur et Mode Maître de jeu
- Dashboard avec zones configurables (haut, gauche, droite, bas, centre)
- Données numériques et textuelles avec drag & drop
- Export/Import JSON
- Écran de combat (mode Maître)
- Onglets par joueur (mode Maître)

## Structure des données
- Stockage local via localStorage
- Format JSON pour export/import
- Pas d'authentification requise
- Session basée sur le navigateur uniquement

## Conventions de développement
- Utiliser TypeScript strict
- Composants Angular modulaires
- Services pour la gestion des données
- Interfaces TypeScript pour typage fort