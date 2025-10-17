import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DndAttributeElement } from '../../../../models/element-types';

@Component({
  selector: 'app-dnd-attribute-element',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dnd-attribute-element.component.html',
  styleUrls: ['./dnd-attribute-element.component.scss']
})
export class DndAttributeElementComponent {
  @Input() element!: DndAttributeElement;
  @Input() canQuickModify: boolean = false;
  
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() valueChange = new EventEmitter<number>();

  onEdit(): void {
    this.edit.emit();
  }

  onDelete(): void {
    this.delete.emit();
  }

  quickModify(delta: number): void {
    if (!this.canQuickModify) return;
    
    const newValue = this.element.value + delta;
    
    // Limites typiques D&D (1-30, mais généralement 8-20)
    if (newValue < 1 || newValue > 30) return;
    
    this.valueChange.emit(newValue);
  }

  getModifier(): string {
    const modifier = Math.floor((this.element.value - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  }

  getSavingThrow(): string {
    const modifier = Math.floor((this.element.value - 10) / 2);
    const proficiencyBonus = this.element.hasProficiency ? 2 : 0; // Simplifié, pourrait être plus complexe
    const total = modifier + proficiencyBonus;
    return total >= 0 ? `+${total}` : `${total}`;
  }
}