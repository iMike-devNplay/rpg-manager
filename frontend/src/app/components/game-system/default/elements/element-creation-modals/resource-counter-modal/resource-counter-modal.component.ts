import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResourceCounterElement } from '../../../../../../models/element-types';

export interface ResourceCounterData {
  id?: string;
  name: string;
  description?: string;
  currentValue: number;
  maxValue?: number;
  zone: string;
}

@Component({
  selector: 'app-resource-counter-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resource-counter-modal.component.html',
  styleUrls: ['./resource-counter-modal.component.scss']
})
export class ResourceCounterModalComponent implements OnInit, OnChanges {
  @Input() isVisible: boolean = false;
  @Input() editingElement: ResourceCounterElement | null = null;
  @Input() targetZone: string = 'center';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<ResourceCounterData>();

  formData: ResourceCounterData = {
    name: '',
    description: '',
    currentValue: 0,
    zone: 'center'
  };

  hasMaxValue: boolean = false;

  ngOnInit() {
    if (this.editingElement) {
      this.loadElementData();
    } else {
      this.resetForm();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['editingElement'] && changes['editingElement'].currentValue) {
      this.loadElementData();
    } else if (changes['editingElement'] && !changes['editingElement'].currentValue) {
      this.resetForm();
    }

    if (changes['targetZone'] && changes['targetZone'].currentValue) {
      this.formData.zone = changes['targetZone'].currentValue;
    }
  }

  private loadElementData() {
    if (this.editingElement) {
      this.formData = {
        id: this.editingElement.id,
        name: this.editingElement.name,
        description: this.editingElement.description || '',
        currentValue: this.editingElement.currentValue,
        maxValue: this.editingElement.maxValue,
        zone: this.editingElement.zone
      };
      this.hasMaxValue = this.editingElement.maxValue !== undefined;
    }
  }

  private resetForm() {
    this.formData = {
      name: '',
      description: '',
      currentValue: 0,
      zone: this.targetZone
    };
    this.hasMaxValue = false;
  }

  onHasMaxValueChange() {
    if (!this.hasMaxValue) {
      this.formData.maxValue = undefined;
    } else {
      this.formData.maxValue = Math.max(this.formData.currentValue, 1);
    }
  }

  onCurrentValueChange() {
    // S'assurer que la valeur courante reste dans les limites
    if (this.formData.currentValue < 0) {
      this.formData.currentValue = 0;
    }
    
    if (this.hasMaxValue && this.formData.maxValue !== undefined) {
      if (this.formData.currentValue > this.formData.maxValue) {
        this.formData.currentValue = this.formData.maxValue;
      }
    }
  }

  onMaxValueChange() {
    if (this.hasMaxValue && this.formData.maxValue !== undefined) {
      // S'assurer que la valeur max est au moins 1
      if (this.formData.maxValue < 1) {
        this.formData.maxValue = 1;
      }
      
      // Ajuster la valeur courante si elle dépasse le max
      if (this.formData.currentValue > this.formData.maxValue) {
        this.formData.currentValue = this.formData.maxValue;
      }
    }
  }

  onSave() {
    if (this.isFormValid()) {
      const data: ResourceCounterData = {
        ...this.formData,
        maxValue: this.hasMaxValue ? this.formData.maxValue : undefined
      };
      this.save.emit(data);
    }
  }

  onCancel() {
    this.close.emit();
  }

  isFormValid(): boolean {
    return (
      this.formData.name.trim().length > 0 &&
      this.formData.currentValue >= 0 &&
      (!this.hasMaxValue || (this.formData.maxValue !== undefined && this.formData.maxValue >= 1))
    );
  }

  get isEditing(): boolean {
    return this.editingElement !== null;
  }
}