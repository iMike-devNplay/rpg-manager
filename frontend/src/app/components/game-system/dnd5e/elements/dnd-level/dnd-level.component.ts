import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DndLevelElement } from '../../../../../models/element-types';

@Component({
  selector: 'app-dnd-level',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dnd-level.component.html',
  styleUrls: ['./dnd-level.component.scss']
})
export class DndLevelComponent {
  @Input() element!: DndLevelElement;
  @Output() valueChange = new EventEmitter<number>();

  isEditing = false;
  editValue: number = 1;

  ngOnInit() {
    this.editValue = this.element.level;
  }

  startEdit() {
    this.isEditing = true;
    this.editValue = this.element.level;
  }

  saveEdit() {
    if (this.editValue >= 1 && this.editValue <= 20) {
      this.valueChange.emit(this.editValue);
      this.isEditing = false;
    }
  }

  cancelEdit() {
    this.isEditing = false;
    this.editValue = this.element.level;
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.saveEdit();
    } else if (event.key === 'Escape') {
      this.cancelEdit();
    }
  }
}