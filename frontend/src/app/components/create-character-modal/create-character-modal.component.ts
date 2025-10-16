import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameSystem } from '../../models/rpg.models';
import { CharacterService } from '../../services/character.service';

@Component({
  selector: 'app-create-character-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-character-modal.component.html',
  styleUrls: ['./create-character-modal.component.scss']
})
export class CreateCharacterModalComponent {
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() characterCreated = new EventEmitter<{name: string, gameSystem: GameSystem}>();

  newCharacterName: string = '';
  selectedGameSystem: GameSystem = GameSystem.DND5E;

  constructor(public characterService: CharacterService) {}

  onClose() {
    this.resetForm();
    this.close.emit();
  }

  onCreateCharacter() {
    if (this.newCharacterName.trim()) {
      this.characterCreated.emit({
        name: this.newCharacterName.trim(),
        gameSystem: this.selectedGameSystem
      });
      this.resetForm();
    }
  }

  private resetForm() {
    this.newCharacterName = '';
    this.selectedGameSystem = GameSystem.DND5E;
  }

  getAvailableGameSystems() {
    return this.characterService.getAvailableGameSystems();
  }
}