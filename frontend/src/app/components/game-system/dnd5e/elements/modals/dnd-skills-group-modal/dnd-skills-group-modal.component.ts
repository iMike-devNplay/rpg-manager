import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DndSkillsGroupElement } from '../../../../../../models/element-types';

@Component({
  selector: 'app-dnd-skills-group-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dnd-skills-group-modal.component.html',
  styleUrls: ['./dnd-skills-group-modal.component.scss']
})
export class DndSkillsGroupModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() editingElement: DndSkillsGroupElement | null = null;
  @Input() zone = '';

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<DndSkillsGroupElement>>();

  element: Partial<DndSkillsGroupElement> = {
    name: 'Compétences',
    description: 'Groupe de compétences D&D 5e',
    type: 'dnd-skills-group',
    skills: {
      // Compétences basées sur la Force
      athletics: { hasProficiency: false, hasExpertise: false },
      // Compétences basées sur la Dextérité
      acrobatics: { hasProficiency: false, hasExpertise: false },
      sleightOfHand: { hasProficiency: false, hasExpertise: false },
      stealth: { hasProficiency: false, hasExpertise: false },
      // Compétences basées sur l'Intelligence
      arcana: { hasProficiency: false, hasExpertise: false },
      history: { hasProficiency: false, hasExpertise: false },
      investigation: { hasProficiency: false, hasExpertise: false },
      nature: { hasProficiency: false, hasExpertise: false },
      religion: { hasProficiency: false, hasExpertise: false },
      // Compétences basées sur la Sagesse
      animalHandling: { hasProficiency: false, hasExpertise: false },
      insight: { hasProficiency: false, hasExpertise: false },
      medicine: { hasProficiency: false, hasExpertise: false },
      perception: { hasProficiency: false, hasExpertise: false },
      survival: { hasProficiency: false, hasExpertise: false },
      // Compétences basées sur le Charisme
      deception: { hasProficiency: false, hasExpertise: false },
      intimidation: { hasProficiency: false, hasExpertise: false },
      performance: { hasProficiency: false, hasExpertise: false },
      persuasion: { hasProficiency: false, hasExpertise: false }
    }
  };

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
    insight: { attribute: 'wisdom', name: 'Perspicacité' },
    medicine: { attribute: 'wisdom', name: 'Médecine' },
    perception: { attribute: 'wisdom', name: 'Perception' },
    survival: { attribute: 'wisdom', name: 'Survie' },
    // Compétences basées sur le Charisme
    deception: { attribute: 'charisma', name: 'Tromperie' },
    intimidation: { attribute: 'charisma', name: 'Intimidation' },
    performance: { attribute: 'charisma', name: 'Représentation' },
    persuasion: { attribute: 'charisma', name: 'Persuasion' }
  };

  // Groupement des compétences par attribut
  attributeNames = {
    strength: 'Force',
    dexterity: 'Dextérité', 
    intelligence: 'Intelligence',
    wisdom: 'Sagesse',
    charisma: 'Charisme'
  };

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingElement'] || changes['isOpen']) {
      this.initializeForm();
    }
  }

  private initializeForm(): void {
    if (this.editingElement) {
      // Mode édition
      this.element = {
        ...this.editingElement,
        skills: { ...this.editingElement.skills }
      };
    } else {
      // Mode création - réinitialiser avec les valeurs par défaut
      this.element = {
        name: 'Compétences',
        description: 'Groupe de compétences D&D 5e',
        type: 'dnd-skills-group',
        zone: this.zone,
        skills: {
          // Compétences basées sur la Force
          athletics: { hasProficiency: false, hasExpertise: false },
          // Compétences basées sur la Dextérité
          acrobatics: { hasProficiency: false, hasExpertise: false },
          sleightOfHand: { hasProficiency: false, hasExpertise: false },
          stealth: { hasProficiency: false, hasExpertise: false },
          // Compétences basées sur l'Intelligence
          arcana: { hasProficiency: false, hasExpertise: false },
          history: { hasProficiency: false, hasExpertise: false },
          investigation: { hasProficiency: false, hasExpertise: false },
          nature: { hasProficiency: false, hasExpertise: false },
          religion: { hasProficiency: false, hasExpertise: false },
          // Compétences basées sur la Sagesse
          animalHandling: { hasProficiency: false, hasExpertise: false },
          insight: { hasProficiency: false, hasExpertise: false },
          medicine: { hasProficiency: false, hasExpertise: false },
          perception: { hasProficiency: false, hasExpertise: false },
          survival: { hasProficiency: false, hasExpertise: false },
          // Compétences basées sur le Charisme
          deception: { hasProficiency: false, hasExpertise: false },
          intimidation: { hasProficiency: false, hasExpertise: false },
          performance: { hasProficiency: false, hasExpertise: false },
          persuasion: { hasProficiency: false, hasExpertise: false }
        }
      };
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onSave(): void {
    this.save.emit(this.element);
  }

  /**
   * Toggle la maîtrise d'une compétence
   */
  toggleProficiency(skillKey: string): void {
    if (this.element.skills && (this.element.skills as any)[skillKey]) {
      const skill = (this.element.skills as any)[skillKey];
      skill.hasProficiency = !skill.hasProficiency;
      
      // Si on désactive la maîtrise, désactiver aussi l'expertise
      if (!skill.hasProficiency) {
        skill.hasExpertise = false;
      }
    }
  }

  /**
   * Toggle l'expertise d'une compétence
   */
  toggleExpertise(skillKey: string): void {
    if (this.element.skills && (this.element.skills as any)[skillKey]) {
      const skill = (this.element.skills as any)[skillKey];
      
      // L'expertise nécessite la maîtrise
      if (!skill.hasProficiency) {
        skill.hasProficiency = true;
      }
      
      skill.hasExpertise = !skill.hasExpertise;
    }
  }

  /**
   * Obtient les compétences groupées par attribut
   */
  getSkillsByAttribute(): { [attribute: string]: string[] } {
    const grouped: { [attribute: string]: string[] } = {};
    
    for (const [skillKey, skillDef] of Object.entries(this.skillsDefinition)) {
      const attribute = skillDef.attribute;
      if (!grouped[attribute]) {
        grouped[attribute] = [];
      }
      grouped[attribute].push(skillKey);
    }
    
    return grouped;
  }

  /**
   * Obtient le nom d'affichage d'une compétence
   */
  getSkillName(skillKey: string): string {
    return this.skillsDefinition[skillKey as keyof typeof this.skillsDefinition]?.name || skillKey;
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

  /**
   * Vérifie si l'expertise est désactivée (pas de maîtrise)
   */
  isExpertiseDisabled(skillKey: string): boolean {
    return !this.getSkillProficiency(skillKey);
  }

  /**
   * Obtient le nom d'un attribut de manière sécurisée
   */
  getAttributeName(attributeKey: string): string {
    return (this.attributeNames as any)[attributeKey] || attributeKey;
  }
}