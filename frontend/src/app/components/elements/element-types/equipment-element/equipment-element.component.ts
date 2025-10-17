import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EquipmentElement } from '../../../../models/element-types';

@Component({
  selector: 'app-equipment-element',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './equipment-element.component.html',
  styleUrls: ['./equipment-element.component.scss']
})
export class EquipmentElementComponent {
  @Input() element!: EquipmentElement;
  @Input() canQuickModify: boolean = false;
  
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() equipToggle = new EventEmitter<boolean>();

  onEdit(): void {
    this.edit.emit();
  }

  onDelete(): void {
    this.delete.emit();
  }

  toggleEquipped(): void {
    this.equipToggle.emit(!this.element.equipped);
  }
}