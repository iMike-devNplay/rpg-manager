import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerCharacter } from '../../../models/rpg.models';
import { CharacterService } from '../../../services/character.service';

@Component({
  selector: 'app-character-selector-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './character-selector-modal.component.html',
  styleUrls: ['./character-selector-modal.component.scss']
})
export class CharacterSelectorModalComponent {
  @Input() isVisible: boolean = false;
  @Input() inlineMode: boolean = false; // if true, render inline instead of modal overlay
  @Input() currentCharacter: PlayerCharacter | null = null;
  @Input() userCharacters: PlayerCharacter[] = [];
  
  @Output() close = new EventEmitter<void>();
  @Output() characterSelected = new EventEmitter<PlayerCharacter>();
  @Output() createNewCharacter = new EventEmitter<void>();
  @Output() duplicateCharacter = new EventEmitter<PlayerCharacter>();
  @Output() deleteCharacter = new EventEmitter<PlayerCharacter>();
  @Output() editCharacter = new EventEmitter<PlayerCharacter>();

  constructor(public characterService: CharacterService) {}

  onClose() {
    this.close.emit();
  }

  onSelectCharacter(character: PlayerCharacter) {
    this.characterSelected.emit(character);
  }

  onCreateNew() {
    this.createNewCharacter.emit();
  }

  onDuplicate(character: PlayerCharacter, event: Event) {
    event.stopPropagation();
    this.duplicateCharacter.emit(character);
  }

  onDelete(character: PlayerCharacter, event: Event) {
    event.stopPropagation();
    this.deleteCharacter.emit(character);
  }

  onEdit(character: PlayerCharacter, event: Event) {
    event.stopPropagation();
    this.editCharacter.emit(character);
  }

  getGameSystemLabel(gameSystem: string): string {
    return this.characterService.getGameSystemLabel(gameSystem as any);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }
}