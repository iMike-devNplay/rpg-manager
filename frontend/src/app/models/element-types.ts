export type GameSystem = 'dnd5e' | 'pathfinder' | 'call-of-cthulhu' | null;

export type ElementType = 'text' | 'numeric' | 'dnd-attribute' | 'dnd-attributes-group' | 'dnd-proficiency-bonus' | 'dnd-skill' | 'dnd-spell' | 'equipment';

export interface ElementTypeConfig {
  id: ElementType;
  name: string;
  description: string;
  gameSystem: GameSystem; // null = disponible pour tous les systèmes
  icon: string;
  category: 'basic' | 'attribute' | 'combat' | 'magic' | 'equipment';
}

export interface BaseElement {
  id: string;
  name: string;
  type: ElementType;
  description?: string;
  zone: string;
  position: number;
  gameSystem?: GameSystem;
}

export interface TextElement extends BaseElement {
  type: 'text';
  value: string;
}

export interface NumericElement extends BaseElement {
  type: 'numeric';
  value: number;
  min?: number;
  max?: number;
  canQuickModify?: boolean;
}

export interface DndAttributeElement extends BaseElement {
  type: 'dnd-attribute';
  value: number; // Score de caractéristique (10-20 généralement)
  hasProficiency?: boolean; // Maîtrise du jet de sauvegarde
}

export interface DndAttributesGroupElement extends BaseElement {
  type: 'dnd-attributes-group';
  attributes: {
    strength: { value: number; hasProficiency: boolean };
    dexterity: { value: number; hasProficiency: boolean };
    constitution: { value: number; hasProficiency: boolean };
    intelligence: { value: number; hasProficiency: boolean };
    wisdom: { value: number; hasProficiency: boolean };
    charisma: { value: number; hasProficiency: boolean };
  };
}

export interface DndProficiencyBonusElement extends BaseElement {
  type: 'dnd-proficiency-bonus';
  value: number; // Bonus de maîtrise (2-6 selon le niveau)
  level?: number; // Niveau du personnage (optionnel pour calcul automatique)
}

export interface DndSkillElement extends BaseElement {
  type: 'dnd-skill';
  attribute: 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';
  hasProficiency: boolean;
  hasExpertise?: boolean;
}

export interface DndSpellElement extends BaseElement {
  type: 'dnd-spell';
  level: number; // 0-9
  school: string;
  castingTime: string;
  range: string;
  components: string[];
  duration: string;
  description: string;
}

export interface EquipmentElement extends BaseElement {
  type: 'equipment';
  quantity: number;
  weight?: number;
  cost?: string;
  equipped?: boolean;
}

export type Element = TextElement | NumericElement | DndAttributeElement | DndAttributesGroupElement | DndProficiencyBonusElement | DndSkillElement | DndSpellElement | EquipmentElement;