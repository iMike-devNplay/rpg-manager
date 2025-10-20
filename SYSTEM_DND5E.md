# Système D&D 5e - Guide d'utilisation

## Vue d'ensemble

L'application RPG Manager intègre maintenant un support spécialisé pour Donjons & Dragons 5e qui automatise la création et les calculs des personnages selon les règles officielles.

## Fonctionnalités D&D 5e

### Initialisation automatique d'un personnage

Lorsque vous créez un nouveau personnage avec le système "Donjons & Dragons 5e", l'application initialise automatiquement :

#### 4a - Bonus de maîtrise
- **Valeur par défaut** : +2
- **Zone** : Top (en haut du dashboard)
- **Modifiable** : Oui (pour ajuster selon le niveau)

#### 4b - Caractéristiques (Attributs)
- **Zone** : Left (zone de gauche)
- **Attributs créés** : Force, Dextérité, Constitution, Intelligence, Sagesse, Charisme
- **Valeur par défaut** : 10 pour chaque attribut
- **Calculs automatiques** :
  - Modificateurs : (valeur - 10) ÷ 2 (arrondi vers le bas)
  - Jets de sauvegarde : modificateur + bonus de maîtrise (si maîtrisé)

#### 4c - Compétences
- **Zone** : Center (zone centrale)
- **Compétences créées** : Toutes les compétences D&D 5e (Acrobaties, Arcanes, Athlétisme, etc.)
- **Calculs automatiques** :
  - Valeur = modificateur de l'attribut lié + bonus de maîtrise (si maîtrisé)
  - Format d'affichage : +X ou -X

#### 4d - Origine/Race
- **Zone** : Top (en haut du dashboard)
- **Valeur par défaut** : "Non définie"
- **Options disponibles** : Liste complète des races D&D 5e

#### 4e - Classe
- **Zone** : Top (en haut du dashboard)
- **Valeur par défaut** : "Non définie"
- **Options disponibles** : Liste complète des classes D&D 5e

### Composant de calculs automatiques

Quand un personnage D&D 5e est sélectionné, un panneau spécialisé apparaît avec :

1. **Affichage du bonus de maîtrise** actuel
2. **Modificateurs d'attributs** calculés automatiquement
3. **Jets de sauvegarde** avec cases à cocher pour la maîtrise
4. **Bouton de recalcul** pour mettre à jour toutes les valeurs dérivées

### Calculs automatiques

#### Modificateurs d'attributs
```
Modificateur = Math.floor((Valeur de l'attribut - 10) / 2)
```

#### Jets de sauvegarde
```
Jet de sauvegarde = Modificateur + (Bonus de maîtrise si maîtrisé, sinon 0)
```

#### Compétences
```
Valeur de compétence = Modificateur de l'attribut lié + (Bonus de maîtrise si maîtrisé, sinon 0)
```

## Comment utiliser

1. **Créer un personnage D&D 5e** :
   - Aller dans la sélection de personnages
   - Cliquer sur "Créer un nouveau personnage"
   - Choisir "Donjons & Dragons 5e" comme système de jeu
   - Tous les éléments sont créés automatiquement

2. **Modifier les attributs** :
   - Cliquer sur un attribut dans la zone de gauche
   - Modifier sa valeur
   - Les modificateurs et compétences se recalculent automatiquement

3. **Gérer les maîtrises** :
   - Utiliser le panneau D&D 5e pour cocher/décocher les maîtrises de sauvegarde
   - Les compétences peuvent être modifiées individuellement

4. **Recalculer** :
   - Utiliser le bouton "🔄 Recalculer tout" pour mettre à jour toutes les valeurs

## Données source

Les données D&D 5e sont stockées dans `src/app/data/dnd5e-data.json` et incluent :
- Liste complète des classes
- Liste complète des origines/races
- Configuration des 6 attributs principaux
- Liste complète des 18 compétences avec leurs attributs liés

## Extensibilité

Le système est conçu pour être facilement extensible :
- Ajout de nouveaux systèmes de jeu via des fichiers JSON similaires
- Services spécialisés pour chaque système
- Composants d'interface dédiés
- Calculs automatiques personnalisables

## Architecture technique

- **GameSystemDataService** : Chargement des données spécifiques aux systèmes
- **Dnd5eService** : Logique et calculs spécifiques à D&D 5e
- **Dnd5eDashboardComponent** : Interface utilisateur pour les calculs D&D 5e
- **Metadata système** : Stockage des informations spécialisées dans les DataItem