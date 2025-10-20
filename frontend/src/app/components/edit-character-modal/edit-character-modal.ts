import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlayerCharacter } from '../../models/rpg.models';

@Component({
  selector: 'app-edit-character-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-character-modal.component.html',
  styleUrl: './edit-character-modal.scss'
})
export class EditCharacterModalComponent implements OnInit, OnChanges {
  @Input() character!: PlayerCharacter;
  @Output() characterUpdated = new EventEmitter<{name: string}>();
  @Output() modalClosed = new EventEmitter<void>();

  characterName = '';
  // Note: game system is no longer editable from this modal

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
    }
  }

  onSubmit() {
    console.log('Form submitted with:', this.characterName);
    if (this.characterName?.trim()) {
      this.characterUpdated.emit({ name: this.characterName.trim() });
      this.onClose();
    }
  }

  onClose() {
    this.modalClosed.emit();
  }
}
