import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataItem, DataType } from '../../../../../models/rpg.models';
import { Element } from '../../../../../models/element-types';
import { ElementService } from '../../../../../services/element.service';
import { StorageService } from '../../../../../services/storage.service';
import { CharacterService } from '../../../../../services/character.service';
import { TextElementComponent } from '../element-types/text-element/text-element.component';
import { NumericElementComponent } from '../element-types/numeric-element/numeric-element.component';
import { EquipmentElementComponent } from '../element-types/equipment-element/equipment-element.component';
import { HpElementComponent } from '../../../../elements/element-types/hp-element/hp-element.component';
import { AttackElementComponent } from '../../../../elements/element-types/attack-element/attack-element.component';
import { DndAttributeElementComponent } from '../../../dnd5e/elements/element-types/dnd-attribute-element/dnd-attribute-element.component';
import { DndAttributesGroupComponent } from '../../../dnd5e/elements/dnd-attributes-group/dnd-attributes-group.component';
import { DndProficiencyBonusComponent } from '../../../dnd5e/elements/dnd-proficiency-bonus/dnd-proficiency-bonus.component';
import { DndLevelComponent } from '../../../dnd5e/elements/dnd-level/dnd-level.component';
import { DndSkillsGroupComponent } from '../../../dnd5e/elements/dnd-skills-group/dnd-skills-group.component';

@Component({
  selector: 'app-element-display',
  standalone: true,
  imports: [
    CommonModule,
    TextElementComponent,
    NumericElementComponent,
    DndAttributeElementComponent,
    DndAttributesGroupComponent,
    DndProficiencyBonusComponent,
    DndLevelComponent,
    DndSkillsGroupComponent,
    EquipmentElementComponent,
    HpElementComponent,
    AttackElementComponent
  ],
  templateUrl: './element-display.component.html',
  styleUrls: ['./element-display.component.scss']
})
export class ElementDisplayComponent {
  @Input() item!: DataItem;
  @Input() showQuickModification = false;
  @Output() itemUpdated = new EventEmitter<DataItem>();
  @Output() itemDeleted = new EventEmitter<DataItem>();
  @Output() itemEdit = new EventEmitter<DataItem>();
  @Output() itemDragStart = new EventEmitter<DataItem>();
  @Output() itemDragEnd = new EventEmitter<void>();
  @Output() itemDroppedOn = new EventEmitter<{draggedItemId: string, targetItem: DataItem}>();

  constructor(private elementService: ElementService, private storageService: StorageService, private characterService: CharacterService) {}

  /**
   * Convertit le DataItem legacy vers le nouveau format Element
   */
  get element(): Element {
    // Conversion temporaire pour compatibilité
    const baseElement = {
      id: this.item.id,
      name: this.item.name,
      description: this.item.description,
      zone: '', // À récupérer du contexte
      position: 0, // À récupérer du contexte
      gameSystem: null as any
    };

    // Conversion selon le type legacy
    switch (this.item.type) {
      case 'text':
        return {
          ...baseElement,
          type: 'text',
          value: this.item.value as string
        };
      case 'numeric':
        return {
          ...baseElement,
          type: 'numeric',
          value: this.item.value as number,
          canQuickModify: this.item.allowQuickModification !== false
        };
      case 'attribute':
        return {
          ...baseElement,
          type: 'dnd-attribute',
          value: this.item.value as number,
          hasProficiency: this.item.hasProficiency
        };
      case 'attributes_group':
        return {
          ...baseElement,
          type: 'dnd-attributes-group',
          attributes: this.item.metadata?.['attributes'] || {
            strength: { value: 10, hasProficiency: false },
            dexterity: { value: 10, hasProficiency: false },
            constitution: { value: 10, hasProficiency: false },
            intelligence: { value: 10, hasProficiency: false },
            wisdom: { value: 10, hasProficiency: false },
            charisma: { value: 10, hasProficiency: false }
          }
        };
      case 'dnd_proficiency_bonus':
        return {
          ...baseElement,
          type: 'dnd-proficiency-bonus',
          value: this.item.value as number,
          level: this.item.metadata?.['level'] || 1
        };
      case 'dnd_level':
        return {
          ...baseElement,
          type: 'dnd-level',
          level: this.item.value as number
        };
      case 'dnd_skills_group':
        return {
          ...baseElement,
          type: 'dnd-skills-group',
          skills: this.item.metadata?.['skills'] || {
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
      case DataType.HP:
        return {
          ...baseElement,
          type: 'hp',
          maxHp: this.item.metadata?.['maxHp'] || this.item.value as number || 10,
          currentHp: this.item.metadata?.['currentHp'] !== undefined ? this.item.metadata['currentHp'] : (this.item.value as number || 10),
          temporaryHp: this.item.metadata?.['temporaryHp'] || 0
        };
      case DataType.ATTACK:
        return {
          ...baseElement,
          type: 'attack',
          attackBonus: this.item.metadata?.['attackBonus'] || '',
          damage: this.item.metadata?.['damage'] || '',
          misc: this.item.metadata?.['misc'] || ''
        };
      default:
        // Fallback vers text
        return {
          ...baseElement,
          type: 'text',
          value: String(this.item.value)
        };
    }
  }

  /**
   * Gestionnaire pour les changements de valeur des éléments
   */
  onElementValueChange(newValue: any): void {
    const updatedItem = { ...this.item, value: newValue };
    // Persist the change immediately so parent views reflect saved state
    this.storageService.saveDataItem(updatedItem);
    this.itemUpdated.emit(updatedItem);
  }

  /**
   * Gestionnaire pour le toggle d'équipement
   */
  onEquipmentToggle(equipped: boolean): void {
    const updatedItem = { ...this.item, equipped };
    // Persist equipment toggle
    this.storageService.saveDataItem(updatedItem);
    this.itemUpdated.emit(updatedItem);
  }

  /**
   * Gestionnaire pour les changements de niveau
   */
  onLevelChange(newLevel: number): void {
    const updatedItem = { ...this.item, value: newLevel };
    this.storageService.saveDataItem(updatedItem);
    this.itemUpdated.emit(updatedItem);
  }

  /**
   * Gestionnaire pour les changements de HP
   */
  onHpChange(hpData: Partial<import('../../../../../models/element-types').HpElement>): void {
    const updatedItem = { 
      ...this.item, 
      metadata: {
        ...this.item.metadata,
        maxHp: hpData.maxHp,
        currentHp: hpData.currentHp,
        temporaryHp: hpData.temporaryHp
      }
    };
    this.storageService.saveDataItem(updatedItem);
    this.itemUpdated.emit(updatedItem);
  }

  /**
   * Récupère le bonus de maîtrise actuel du personnage
   */
  getCurrentProficiencyBonus(): number {
    const character = this.characterService.getCurrentCharacter();
    if (character) {
      // Chercher le bonus de maîtrise D&D
      const proficiencyBonusItem = character.dataItems.find(item => 
        item.type === DataType.DND_PROFICIENCY_BONUS
      );
      if (proficiencyBonusItem) {
        return Number(proficiencyBonusItem.value) || 2;
      }
    }
    return 2; // Valeur par défaut
  }

  /**
   * Vérifie si l'élément peut être modifié rapidement
   */
  canQuickModify(): boolean {
    return this.showQuickModification && 
           this.item.allowQuickModification !== false &&
           (this.item.type === DataType.NUMERIC || 
            this.item.type === DataType.ATTRIBUTE || 
            this.item.type === DataType.PROFICIENCY_BONUS ||
            this.item.type === DataType.HP);
  }

  /**
   * Modifie rapidement la valeur
   */
  quickModify(change: number): void {
    if (this.canQuickModify()) {
      const updatedItem = this.elementService.quickModifyValue(this.item, change);
      // Ensure change is persisted
      this.storageService.saveDataItem(updatedItem);
      this.itemUpdated.emit(updatedItem);
    }
  }

  /**
   * Supprime l'élément
   */
  deleteItem(): void {
    this.itemDeleted.emit(this.item);
  }

  /**
   * Ouvre la modal d'édition de l'élément
   */
  editItem(): void {
    this.itemEdit.emit(this.item);
  }

  /**
   * Obtient la valeur formatée pour l'affichage
   */
  getFormattedValue(): string {
    return this.elementService.formatElementValue(this.item);
  }

  /**
   * Obtient les détails de l'attribut (modificateur et jet de sauvegarde)
   */
  getAttributeDetails(): any {
    if (this.item.type === DataType.ATTRIBUTE) {
      return this.elementService.getAttributeDetails(this.item);
    }
    return null;
  }

  /**
   * Vérifie si c'est un élément textuel
   */
  isTextElement(): boolean {
    return this.item.type === DataType.TEXT;
  }

  /**
   * Vérifie si c'est un élément numérique (incluant attributs)
   */
  isNumericElement(): boolean {
    return this.item.type === DataType.NUMERIC || 
           this.item.type === DataType.ATTRIBUTE || 
           this.item.type === DataType.PROFICIENCY_BONUS;
  }

  /**
   * Vérifie si c'est un attribut D&D
   */
  isAttribute(): boolean {
    return this.item.type === DataType.ATTRIBUTE;
  }

  /**
   * Gestion du début de drag
   */
  onDragStart(event: DragEvent): void {
    // Stocker l'ID de l'élément dans le dataTransfer
    event.dataTransfer?.setData('text/plain', this.item.id);
    
    // Ajouter une classe CSS pour le style pendant le drag
    (event.target as HTMLElement).classList.add('dragging');
    
    // Notifier le parent
    this.itemDragStart.emit(this.item);
  }

  /**
   * Gestion de la fin de drag
   */
  onDragEnd(event: DragEvent): void {
    // Retirer la classe CSS
    (event.target as HTMLElement).classList.remove('dragging');
    
    // Retirer aussi la classe drop-target de tous les éléments
    document.querySelectorAll('.drop-target').forEach(element => {
      element.classList.remove('drop-target');
    });
    
    // Notifier le parent
    this.itemDragEnd.emit();
  }

  /**
   * Gestion du dragover sur cet élément
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Ajouter une classe CSS pour indiquer qu'on peut dropper ici
    (event.currentTarget as HTMLElement).classList.add('drop-target');
  }

  /**
   * Gestion du dragleave sur cet élément
   */
  onDragLeave(event: DragEvent): void {
    // Retirer la classe CSS seulement si on quitte vraiment l'élément
    // (pas ses enfants)
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    // Si la souris est encore dans les limites de l'élément, ne pas retirer la classe
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return;
    }
    
    (event.currentTarget as HTMLElement).classList.remove('drop-target');
  }

  /**
   * Gestion du drop sur cet élément
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Retirer la classe CSS
    (event.currentTarget as HTMLElement).classList.remove('drop-target');
    
    // Récupérer l'ID de l'élément dragué
    const draggedItemId = event.dataTransfer?.getData('text/plain');
    
    if (draggedItemId && draggedItemId !== this.item.id) {
      // Notifier le parent avec l'élément dragué et l'élément cible
      this.itemDroppedOn.emit({
        draggedItemId,
        targetItem: this.item
      });
    }
  }
}
