import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataItem, DataType } from '../../../../../../models/rpg.models';

@Component({
  selector: 'app-select-element-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './select-element-modal.component.html',
  styleUrls: ['./select-element-modal.component.scss']
})
export class SelectElementModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() editingElement: DataItem | null = null; // null = création, sinon édition
  @Input() tabId = '';
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<DataItem>>();

  formData = {
    name: '',
    value: '',
    description: '',
    options: [] as { label: string; value: string }[]
  };

  // Pour l'ajout d'options
  newOptionLabel = '';
  newOptionValue = '';
  
  // État de collapse pour la liste des options (fermé par défaut)
  optionsCollapsed = true;

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      this.initializeForm();
    }
  }

  private initializeForm(): void {
    // Initialize form data for select modal
    if (this.editingElement) {
      // Mode édition
      this.formData = {
        name: this.editingElement.name,
        value: this.editingElement.value as string || '',
        description: this.editingElement.description || '',
        options: this.editingElement.metadata?.availableOptions || []
      };
    } else {
      // Mode création
      this.formData = {
        name: '',
        value: '',
        description: '',
        options: []
      };
    }
  }

  addOption(): void {
    if (this.newOptionLabel.trim() && this.newOptionValue.trim()) {
      this.formData.options.push({
        label: this.newOptionLabel.trim(),
        value: this.newOptionValue.trim()
      });
      this.newOptionLabel = '';
      this.newOptionValue = '';
    }
  }

  removeOption(index: number): void {
    this.formData.options.splice(index, 1);
  }

  onSave(): void {
    if (!this.isFormValid()) return;

    const elementData: Partial<DataItem> = {
      type: DataType.SELECT,
      name: this.formData.name.trim(),
      value: this.formData.value.trim(),
      description: this.formData.description.trim() || undefined,
      tabId: this.tabId,
      metadata: {
        availableOptions: this.formData.options
      }
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
    return this.formData.name.trim().length > 0 && this.formData.options.length > 0;
  }
}
