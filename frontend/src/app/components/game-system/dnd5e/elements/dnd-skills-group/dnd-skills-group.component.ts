import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DndSkillsGroupElement, DndAttributesGroupElement } from '../../../../../models/element-types';
import { Dnd5eService } from '../../../../../services/dnd5e.service';
import { CharacterService } from '../../../../../services/character.service';
import { DataType } from '../../../../../models/rpg.models';

interface SkillGroup {
  key: string;
  name: string;
}

@Component({
  selector: 'app-dnd-skills-group',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dnd-skills-group.component.html',
  styleUrls: ['./dnd-skills-group.component.scss']
})
export class DndSkillsGroupComponent implements OnInit, OnChanges {
  @Input() element!: DndSkillsGroupElement;
  @Input() proficiencyBonus?: number; // Bonus passé depuis le parent
  
  private _proficiencyBonus = 2; // Valeur par défaut interne
  private _attributesGroup: DndAttributesGroupElement | null = null;

  // Définition des compétences avec leurs attributs liés et noms français
  skillsDefinition = {
    // Compétences basées sur la Force
    athletics: { attribute: 'strength', name: 'Athlétisme' },
    
    // Compétences basées sur la Dextérité
    acrobatics: { attribute: 'dexterity', name: 'Acrobaties' },
    sleightOfHand: { attribute: 'dexterity', name: 'Escamotage' },
    stealth: { attribute: 'dexterity', name: 'Discrétion' },
    
    // Compétences basées sur l'Intelligence
    arcana: { attribute: 'intelligence', name: 'Arcanes' },
    history: { attribute: 'intelligence', name: 'Histoire' },
    investigation: { attribute: 'intelligence', name: 'Investigation' },
    nature: { attribute: 'intelligence', name: 'Nature' },
    religion: { attribute: 'intelligence', name: 'Religion' },
    
    // Compétences basées sur la Sagesse
    animalHandling: { attribute: 'wisdom', name: 'Dressage' },
    insight: { attribute: 'wisdom', name: 'Intuition' },
    medicine: { attribute: 'wisdom', name: 'Médecine' },
    perception: { attribute: 'wisdom', name: 'Perception' },
    survival: { attribute: 'wisdom', name: 'Survie' },
    
    // Compétences basées sur le Charisme
    deception: { attribute: 'charisma', name: 'Tromperie' },
    intimidation: { attribute: 'charisma', name: 'Intimidation' },
    performance: { attribute: 'charisma', name: 'Représentation' },
    persuasion: { attribute: 'charisma', name: 'Persuasion' }
  };

  // Noms des attributs en français
  attributeNames = {
    strength: 'Force',
    dexterity: 'Dextérité', 
    intelligence: 'Intelligence',
    wisdom: 'Sagesse',
    charisma: 'Charisme'
  };

  constructor(
    private dnd5eService: Dnd5eService,
    private characterService: CharacterService
  ) {}

  ngOnInit(): void {
    this.loadProficiencyBonus();
    this.loadAttributesGroup();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Si le bonus de maîtrise a changé via l'Input, on l'utilise
    if (changes['proficiencyBonus'] && changes['proficiencyBonus'].currentValue) {
      // Le composant se met automatiquement à jour avec le nouveau bonus
    }
  }

  /**
   * Retourne le bonus de maîtrise effectif (Input ou chargé depuis les données)
   */
  get effectiveProficiencyBonus(): number {
    return this.proficiencyBonus ?? this._proficiencyBonus;
  }

  /**
   * Obtient l'état de maîtrise d'une compétence de manière sécurisée
   */
  getSkillProficiency(skillKey: string): boolean {
    return (this.element?.skills as any)?.[skillKey]?.hasProficiency || false;
  }

  /**
   * Obtient l'état d'expertise d'une compétence de manière sécurisée
   */
  getSkillExpertise(skillKey: string): boolean {
    return (this.element?.skills as any)?.[skillKey]?.hasExpertise || false;
  }

  private loadProficiencyBonus(): void {
    const character = this.characterService.getCurrentCharacter();
    if (character) {
      // Chercher d'abord le nouveau type de bonus de maîtrise D&D
      let proficiencyBonusItem = character.dataItems.find(item => 
        item.type === DataType.DND_PROFICIENCY_BONUS
      );
      
      // Fallback vers l'ancien type si pas trouvé
      if (!proficiencyBonusItem) {
        proficiencyBonusItem = character.dataItems.find(item => 
          item.metadata?.dnd5eType === 'proficiency-bonus'
        );
      }
      
      this._proficiencyBonus = proficiencyBonusItem ? Number(proficiencyBonusItem.value) : 2;
    }
  }

  private loadAttributesGroup(): void {
    const character = this.characterService.getCurrentCharacter();
    if (character) {
      const attributesGroupItem = character.dataItems.find(item => 
        item.type === DataType.ATTRIBUTES_GROUP
      );
      
      if (attributesGroupItem && attributesGroupItem.metadata?.['attributes']) {
        this._attributesGroup = {
          id: attributesGroupItem.id,
          name: attributesGroupItem.name,
          type: 'dnd-attributes-group',
          zone: attributesGroupItem.zone as string, // Conversion vers string
          position: 0,
          attributes: attributesGroupItem.metadata['attributes']
        };
      }
    }
  }

  /**
   * Récupère la valeur d'un attribut
   */
  getAttributeValue(attributeName: string): number {
    if (!this._attributesGroup) return 10;
    
    const attributeKey = attributeName as keyof typeof this._attributesGroup.attributes;
    return this._attributesGroup.attributes[attributeKey]?.value || 10;
  }

  /**
   * Calcule le modificateur d'attribut
   */
  getAttributeModifier(attributeName: string): number {
    const attributeValue = this.getAttributeValue(attributeName);
    return this.dnd5eService.calculateAttributeModifier(attributeValue);
  }

  /**
   * Calcule la valeur totale d'une compétence
   */
  getSkillValue(skillKey: keyof typeof this.element.skills): number {
    const skill = this.element.skills[skillKey];
    const skillDef = this.skillsDefinition[skillKey];
    
    const attributeModifier = this.getAttributeModifier(skillDef.attribute);
    const proficiencyBonus = this.effectiveProficiencyBonus;
    
    let totalModifier = attributeModifier;
    
    if (skill.hasProficiency) {
      totalModifier += proficiencyBonus;
    }
    
    if (skill.hasExpertise) {
      totalModifier += proficiencyBonus; // Expertise = bonus supplémentaire
    }
    
    return totalModifier;
  }

  /**
   * Version sécurisée pour l'accès dynamique aux compétences
   */
  getSkillValueSafe(skillKey: string): number {
    const skill = (this.element?.skills as any)?.[skillKey];
    const skillDef = (this.skillsDefinition as any)?.[skillKey];
    
    if (!skill || !skillDef) {
      return 0;
    }
    
    const attributeModifier = this.getAttributeModifier(skillDef.attribute);
    const proficiencyBonus = this.effectiveProficiencyBonus;
    
    let totalModifier = attributeModifier;
    
    if (skill.hasProficiency) {
      totalModifier += proficiencyBonus;
    }
    
    if (skill.hasExpertise) {
      totalModifier += proficiencyBonus; // Expertise = bonus supplémentaire
    }
    
    return totalModifier;
  }

  /**
   * Affichage formaté de la valeur de compétence (version sécurisée)
   */
  getSkillValueDisplay(skillKey: string): string {
    const value = this.getSkillValueSafe(skillKey);
    return value >= 0 ? `+${value}` : `${value}`;
  }

  /**
   * Groupe les compétences par attribut pour l'affichage
   */
  getSkillsByAttribute() {
    const grouped: { [attribute: string]: { key: string; name: string }[] } = {};
    
    for (const [skillKey, skillDef] of Object.entries(this.skillsDefinition)) {
      const attribute = skillDef.attribute;
      if (!grouped[attribute]) {
        grouped[attribute] = [];
      }
      grouped[attribute].push({
        key: skillKey,
        name: skillDef.name
      });
    }
    
    // Convertir en format pour le template
    return Object.entries(grouped).map(([attribute, skills]) => ({
      attribute,
      name: this.attributeNames[attribute as keyof typeof this.attributeNames] || attribute,
      skills
    }));
  }
}