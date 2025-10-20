import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NumericElement } from '../../../../../../models/element-types';

@Component({
  selector: 'app-numeric-element',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './numeric-element.component.html',
  styleUrls: ['./numeric-element.component.scss']
})
export class NumericElementComponent {
  @Input() element!: NumericElement;
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
    
    // Vérifier les limites si définies
    if (this.element.min !== undefined && newValue < this.element.min) return;
    if (this.element.max !== undefined && newValue > this.element.max) return;
    
    this.valueChange.emit(newValue);
  }

  getFormattedValue(): string {
    if (this.element.value >= 0) {
      return `+${this.element.value}`;
    }
    return this.element.value.toString();
  }
}