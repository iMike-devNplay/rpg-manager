import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DndLevelElement } from '../../../../../../models/element-types';

@Component({
  selector: 'app-dnd-level-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dnd-level-modal.component.html',
  styleUrls: ['./dnd-level-modal.component.scss']
})
export class DndLevelModalComponent {
  @Input() isOpen = false;
  @Input() editingElement: DndLevelElement | null = null;

  // Événements
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<DndLevelElement>>();

  // Propriétés du formulaire
  elementName = '';
  elementDescription = '';
  level = 1;

  ngOnChanges() {
    if (this.isOpen) {
      if (this.editingElement) {
        // Mode édition
        this.elementName = this.editingElement.name;
        this.elementDescription = this.editingElement.description || '';
        this.level = this.editingElement.level;
      } else {
        // Mode création
        this.resetForm();
      }
    }
  }

  resetForm() {
    this.elementName = 'Niveau';
    this.elementDescription = 'Niveau du personnage';
    this.level = 1;
  }

  onClose() {
    this.close.emit();
  }

  onSave() {
    if (!this.elementName.trim()) {
      return;
    }

    if (this.level < 1 || this.level > 20) {
      return;
    }

    const elementData: Partial<DndLevelElement> = {
      name: this.elementName.trim(),
      description: this.elementDescription.trim(),
      type: 'dnd-level',
      level: this.level
    };

    this.save.emit(elementData);
  }

  isFormValid(): boolean {
    return this.elementName.trim().length > 0 && 
           this.level >= 1 && 
           this.level <= 20;
  }
}