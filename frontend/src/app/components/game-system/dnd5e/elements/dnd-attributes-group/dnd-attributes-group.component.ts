import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DndAttributesGroupElement } from '../../../../../models/element-types';
import { Dnd5eService } from '../../../../../services/dnd5e.service';
import { CharacterService } from '../../../../../services/character.service';
import { PlayerCharacter } from '../../../../../models/rpg.models';

@Component({
  selector: 'app-dnd-attributes-group',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dnd-attributes-group.component.html',
  styleUrls: ['./dnd-attributes-group.component.scss']
})
export class DndAttributesGroupComponent implements OnInit {
  @Input() element!: DndAttributesGroupElement;
  
  proficiencyBonus = 2;

  attributeLabels = {
    strength: 'FOR',
    dexterity: 'DEX', 
    constitution: 'CON',
    intelligence: 'INT',
    wisdom: 'SAG',
    charisma: 'CHA'
  };

  attributeNames = {
    strength: 'Force',
    dexterity: 'Dextérité',
    constitution: 'Constitution', 
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
  }

  private loadProficiencyBonus(): void {
    const character = this.characterService.getCurrentCharacter();
    if (character) {
      const proficiencyBonusItem = character.dataItems.find(item => 
        item.metadata?.dnd5eType === 'proficiency-bonus'
      );
      this.proficiencyBonus = proficiencyBonusItem ? Number(proficiencyBonusItem.value) : 2;
    }
  }

  getModifier(attributeValue: number): number {
    return this.dnd5eService.calculateAttributeModifier(attributeValue);
  }

  getModifierDisplay(attributeValue: number): string {
    const modifier = this.getModifier(attributeValue);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  }

  getSavingThrow(attributeValue: number, hasProficiency: boolean): number {
    return this.dnd5eService.calculateSavingThrow(attributeValue, hasProficiency, this.proficiencyBonus);
  }

  getSavingThrowDisplay(attributeValue: number, hasProficiency: boolean): string {
    const savingThrow = this.getSavingThrow(attributeValue, hasProficiency);
    return savingThrow >= 0 ? `+${savingThrow}` : `${savingThrow}`;
  }

  getAttributeKeys(): (keyof typeof this.element.attributes)[] {
    return Object.keys(this.element.attributes) as (keyof typeof this.element.attributes)[];
  }

  toggleSaveProficiency(attributeKey: keyof typeof this.element.attributes): void {
    // Cette méthode sera appelée depuis le parent pour modifier l'élément
    // Pour l'instant, on la laisse vide car l'édition se fera via une modal dédiée
  }
}