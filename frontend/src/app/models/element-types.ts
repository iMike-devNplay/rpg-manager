export type GameSystem = 'dnd5e' | 'pathfinder' | 'call-of-cthulhu' | null;

export type ElementType = 'text' | 'numeric' | 'select' | 'dnd-attribute' | 'dnd-attributes-group' | 'dnd-proficiency-bonus' | 'dnd-level' | 'dnd-skills-group' | 'dnd-spell' | 'equipment' | 'hp' | 'attack';

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

export interface SelectElement extends BaseElement {
  type: 'select';
  value: string;
  options: { label: string; value: string }[];
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

export interface DndLevelElement extends BaseElement {
  type: 'dnd-level';
  level: number; // Niveau du personnage (1-20)
}

export interface DndSkillsGroupElement extends BaseElement {
  type: 'dnd-skills-group';
  skills: {
    // Compétences basées sur la Force
    athletics: { hasProficiency: boolean; hasExpertise: boolean };
    // Compétences basées sur la Dextérité
    acrobatics: { hasProficiency: boolean; hasExpertise: boolean };
    sleightOfHand: { hasProficiency: boolean; hasExpertise: boolean };
    stealth: { hasProficiency: boolean; hasExpertise: boolean };
    // Compétences basées sur l'Intelligence
    arcana: { hasProficiency: boolean; hasExpertise: boolean };
    history: { hasProficiency: boolean; hasExpertise: boolean };
    investigation: { hasProficiency: boolean; hasExpertise: boolean };
    nature: { hasProficiency: boolean; hasExpertise: boolean };
    religion: { hasProficiency: boolean; hasExpertise: boolean };
    // Compétences basées sur la Sagesse
    animalHandling: { hasProficiency: boolean; hasExpertise: boolean };
    insight: { hasProficiency: boolean; hasExpertise: boolean };
    medicine: { hasProficiency: boolean; hasExpertise: boolean };
    perception: { hasProficiency: boolean; hasExpertise: boolean };
    survival: { hasProficiency: boolean; hasExpertise: boolean };
    // Compétences basées sur le Charisme
    deception: { hasProficiency: boolean; hasExpertise: boolean };
    intimidation: { hasProficiency: boolean; hasExpertise: boolean };
    performance: { hasProficiency: boolean; hasExpertise: boolean };
    persuasion: { hasProficiency: boolean; hasExpertise: boolean };
  };
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

export interface HpElement extends BaseElement {
  type: 'hp';
  maxHp: number;
  currentHp: number;
  temporaryHp: number;
}

export interface AttackElement extends BaseElement {
  type: 'attack';
  attackBonus: string; // Bonus d'attaque ou DD du sort
  damage: string; // Montant ou formule des dégâts
  misc: string; // Type de dégâts, type d'arme, etc.
}

export type Element = TextElement | NumericElement | SelectElement | DndAttributeElement | DndAttributesGroupElement | DndProficiencyBonusElement | DndLevelElement | DndSkillsGroupElement | DndSpellElement | EquipmentElement | HpElement | AttackElement;