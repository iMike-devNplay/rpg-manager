import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NumericElement } from '../../../../../../models/element-types';

@Component({
  selector: 'app-numeric-element-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './numeric-element-modal.component.html',
  styleUrls: ['./numeric-element-modal.component.scss']
})
export class NumericElementModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() editingElement: NumericElement | null = null;
  @Input() zone = '';
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<NumericElement>>();

  formData = {
    name: '',
    value: 0,
    min: undefined as number | undefined,
    max: undefined as number | undefined,
    canQuickModify: true,
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
    console.log('DEBUG: NumericModal initializeForm called with editingElement:', this.editingElement);
    
    if (this.editingElement) {
      this.formData = {
        name: this.editingElement.name,
        value: this.editingElement.value,
        min: this.editingElement.min,
        max: this.editingElement.max,
        canQuickModify: this.editingElement.canQuickModify ?? true,
        description: this.editingElement.description || ''
      };
      console.log('DEBUG: NumericModal initialized form with editing data:', this.formData);
    } else {
      this.formData = {
        name: '',
        value: 0,
        min: undefined,
        max: undefined,
        canQuickModify: true,
        description: ''
      };
      console.log('DEBUG: NumericModal initialized form for new element:', this.formData);
    }
  }

  onSave(): void {
    console.log('DEBUG: NumericModal onSave called with formData:', this.formData);
    if (!this.isFormValid()) return;

    const elementData: Partial<NumericElement> = {
      type: 'numeric',
      name: this.formData.name.trim(),
      value: this.formData.value,
      min: this.formData.min,
      max: this.formData.max,
      canQuickModify: this.formData.canQuickModify,
      description: this.formData.description.trim() || undefined,
      zone: this.zone
    };

    if (this.editingElement) {
      elementData.id = this.editingElement.id;
    }

    console.log('DEBUG: NumericModal emitting elementData:', elementData);
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
    const hasName = this.formData.name.trim().length > 0;
    const hasValidRange = this.formData.min === undefined || 
                         this.formData.max === undefined || 
                         this.formData.min <= this.formData.max;
    const valueInRange = (this.formData.min === undefined || this.formData.value >= this.formData.min) &&
                        (this.formData.max === undefined || this.formData.value <= this.formData.max);
    
    return hasName && hasValidRange && valueInRange;
  }

  get modalTitle(): string {
    return this.editingElement ? 'Modifier l\'élément numérique' : 'Créer un élément numérique';
  }
}