import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlayerCharacter, GameSystem, GAME_SYSTEM_LABELS } from '../../models/rpg.models';

@Component({
  selector: 'app-edit-character-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-character-modal.component.html',
  styleUrl: './edit-character-modal.scss'
})
export class EditCharacterModalComponent implements OnInit, OnChanges {
  @Input() character!: PlayerCharacter;
  @Output() characterUpdated = new EventEmitter<{name: string, gameSystem: GameSystem}>();
  @Output() modalClosed = new EventEmitter<void>();

  characterName = '';
  selectedGameSystem = GameSystem.DND5E;
  gameSystems = GameSystem;
  gameSystemLabels = GAME_SYSTEM_LABELS;

  ngOnInit() {
    this.initializeValues();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['character'] && changes['character'].currentValue) {
      this.initializeValues();
    }
  }

  private initializeValues() {
    if (this.character) {
      this.characterName = this.character.name;
      this.selectedGameSystem = this.character.gameSystem;
    }
  }

  onSubmit() {
    console.log('Form submitted with:', this.characterName, this.selectedGameSystem);
    if (this.characterName?.trim()) {
      this.characterUpdated.emit({
        name: this.characterName.trim(),
        gameSystem: this.selectedGameSystem
      });
      this.onClose();
    }
  }

  onClose() {
    this.modalClosed.emit();
  }

  getSystemLabel(systemKey: string): string {
    return this.gameSystemLabels[systemKey as GameSystem] || systemKey;
  }

  getGameSystemOptions(): {key: GameSystem, label: string}[] {
    return Object.entries(this.gameSystemLabels).map(([key, label]) => ({
      key: key as GameSystem,
      label: label
    }));
  }
}
