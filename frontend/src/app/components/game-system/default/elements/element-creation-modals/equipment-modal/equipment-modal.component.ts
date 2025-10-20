import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquipmentElement } from '../../../../../../models/element-types';

@Component({
  selector: 'app-equipment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipment-modal.component.html',
  styleUrls: ['./equipment-modal.component.scss']
})
export class EquipmentModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() editingElement: EquipmentElement | null = null;
  @Input() zone = '';
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<EquipmentElement>>();

  formData = {
    name: '',
    quantity: 1,
    weight: undefined as number | undefined,
    cost: '',
    equipped: false,
    description: ''
  };

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      this.initializeForm();
    }
  }

  private initializeForm(): void {
    if (this.editingElement) {
      this.formData = {
        name: this.editingElement.name,
        quantity: this.editingElement.quantity,
        weight: this.editingElement.weight,
        cost: this.editingElement.cost || '',
        equipped: this.editingElement.equipped || false,
        description: this.editingElement.description || ''
      };
    } else {
      this.formData = {
        name: '',
        quantity: 1,
        weight: undefined,
        cost: '',
        equipped: false,
        description: ''
      };
    }
  }

  onSave(): void {
    if (!this.isFormValid()) return;

    const elementData: Partial<EquipmentElement> = {
      type: 'equipment',
      name: this.formData.name.trim(),
      quantity: this.formData.quantity,
      weight: this.formData.weight,
      cost: this.formData.cost.trim() || undefined,
      equipped: this.formData.equipped,
      description: this.formData.description.trim() || undefined,
      zone: this.zone
    };

    if (this.editingElement) {
      elementData.id = this.editingElement.id;
    }

    this.save.emit(elementData);
    this.onClose();
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  isFormValid(): boolean {
    return this.formData.name.trim().length > 0 && 
           this.formData.quantity > 0;
  }

  get modalTitle(): string {
    return this.editingElement ? 'Modifier l\'équipement' : 'Créer un équipement';
  }
}