import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TextElement } from '../../../../../../models/element-types';

@Component({
  selector: 'app-text-element-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './text-element-modal.component.html',
  styleUrls: ['./text-element-modal.component.scss']
})
export class TextElementModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() editingElement: TextElement | null = null; // null = création, sinon édition
  @Input() zone = '';
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<TextElement>>();

  formData = {
    name: '',
    value: '',
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
      // Mode édition
      this.formData = {
        name: this.editingElement.name,
        value: this.editingElement.value,
        description: this.editingElement.description || ''
      };
    } else {
      // Mode création
      this.formData = {
        name: '',
        value: '',
        description: ''
      };
    }
  }

  onSave(): void {
    if (!this.isFormValid()) return;

    const elementData: Partial<TextElement> = {
      type: 'text',
      name: this.formData.name.trim(),
      value: this.formData.value.trim(),
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
           this.formData.value.trim().length > 0;
  }

  get modalTitle(): string {
    return this.editingElement ? 'Modifier l\'élément textuel' : 'Créer un élément textuel';
  }
}