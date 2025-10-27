import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataItem } from '../../../../models/rpg.models';

@Component({
  selector: 'app-select-element',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './select-element.component.html',
  styleUrl: './select-element.component.scss'
})
export class SelectElementComponent {
  @Input() item!: DataItem;
  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;

  get options(): { label: string; value: string }[] {
    return this.item.metadata?.availableOptions || [];
  }

  get selectedLabel(): string {
    const option = this.options.find(opt => opt.value === this.item.value);
    return option ? option.label : this.item.value as string || 'Non défini';
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  onValueChange(newValue: string): void {
    this.isOpen = false; // Fermer le dropdown après sélection
    this.valueChange.emit(newValue);
  }
}
