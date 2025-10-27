import { ElementTypeConfig, GameSystem, ElementType } from '../models/element-types';

export const ELEMENT_TYPES_CONFIG: ElementTypeConfig[] = [
  // Éléments de base (disponibles pour tous les systèmes)
  {
    id: 'text',
    name: 'Texte',
    description: 'Élément textuel simple pour notes, descriptions, etc.',
    gameSystem: null,
    icon: '📝',
    category: 'basic'
  },
  {
    id: 'numeric',
    name: 'Numérique',
    description: 'Valeur numérique avec modification rapide',
    gameSystem: null,
    icon: '🔢',
    category: 'basic'
  },
  {
    id: 'select',
    name: 'Sélection',
    description: 'Liste déroulante avec options prédéfinies',
    gameSystem: null,
    icon: '📋',
    category: 'basic'
  },
  {
    id: 'hp',
    name: 'Points de vie',
    description: 'Gestion des points de vie (max, courant, temporaires)',
    gameSystem: null,
    icon: '❤️',
    category: 'combat'
  },
  {
    id: 'attack',
    name: 'Attaque',
    description: 'Information d\'attaque (arme ou sort) avec bonus, dégâts et propriétés',
    gameSystem: null,
    icon: '⚔️',
    category: 'combat'
  },
  {
    id: 'equipment',
    name: 'Équipement',
    description: 'Objet avec quantité, poids et statut d\'équipement',
    gameSystem: null,
    icon: '🎒',
    category: 'equipment'
  },

  // Éléments spécifiques à D&D 5e
  {
    id: 'dnd-attribute',
    name: 'Caractéristique D&D',
    description: 'Caractéristique D&D avec modificateur et jet de sauvegarde',
    gameSystem: 'dnd5e',
    icon: '💪',
    category: 'attribute'
  },
  {
    id: 'dnd-attributes-group',
    name: 'Groupe d\'attributs D&D',
    description: 'Groupe des 6 attributs principaux avec modificateurs et jets de sauvegarde',
    gameSystem: 'dnd5e',
    icon: '📊',
    category: 'attribute'
  },
  {
    id: 'dnd-proficiency-bonus',
    name: 'Bonus de maîtrise D&D',
    description: 'Bonus de maîtrise avec calcul automatique selon le niveau',
    gameSystem: 'dnd5e',
    icon: '🎯',
    category: 'attribute'
  },
  {
    id: 'dnd-level',
    name: 'Niveau D&D',
    description: 'Niveau du personnage (1-20)',
    gameSystem: 'dnd5e',
    icon: '📈',
    category: 'attribute'
  },
  {
    id: 'dnd-skills-group',
    name: 'Groupe de compétences D&D',
    description: 'Toutes les compétences D&D 5e avec maîtrise et expertise',
    gameSystem: 'dnd5e',
    icon: '🎯',
    category: 'attribute'
  },
  {
    id: 'dnd-spell',
    name: 'Sort D&D',
    description: 'Sort D&D avec niveau, école et composants',
    gameSystem: 'dnd5e',
    icon: '✨',
    category: 'magic'
  }
];

export class ElementTypeService {
  /**
   * Récupère les types d'éléments disponibles pour un système de jeu donné
   */
  static getAvailableTypes(gameSystem: GameSystem): ElementTypeConfig[] {
    return ELEMENT_TYPES_CONFIG.filter(config => 
      config.gameSystem === null || config.gameSystem === gameSystem
    );
  }

  /**
   * Récupère la configuration d'un type d'élément
   */
  static getTypeConfig(type: ElementType): ElementTypeConfig | undefined {
    return ELEMENT_TYPES_CONFIG.find(config => config.id === type);
  }

  /**
   * Récupère les types par catégorie pour un système donné
   */
  static getTypesByCategory(gameSystem: GameSystem): Record<string, ElementTypeConfig[]> {
    const availableTypes = this.getAvailableTypes(gameSystem);
    return availableTypes.reduce((acc, config) => {
      if (!acc[config.category]) {
        acc[config.category] = [];
      }
      acc[config.category].push(config);
      return acc;
    }, {} as Record<string, ElementTypeConfig[]>);
  }

  /**
   * Vérifie si un type d'élément est disponible pour un système donné
   */
  static isTypeAvailable(type: ElementType, gameSystem: GameSystem): boolean {
    const config = this.getTypeConfig(type);
    return config ? (config.gameSystem === null || config.gameSystem === gameSystem) : false;
  }
}