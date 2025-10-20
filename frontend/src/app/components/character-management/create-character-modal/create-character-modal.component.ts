import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameSystem } from '../../../models/rpg.models';
import { CharacterService } from '../../../services/character.service';

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
  availableGameSystems: {value: GameSystem, label: string}[] = [];

  constructor(public characterService: CharacterService) {
    // Initialiser la liste des systèmes de jeu une seule fois
    this.availableGameSystems = this.characterService.getAvailableGameSystems();
  }

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
      // Ne pas réinitialiser immédiatement - laisser le parent gérer la fermeture
    }
  }

  private resetForm() {
    this.newCharacterName = '';
    this.selectedGameSystem = GameSystem.DND5E;
  }
}