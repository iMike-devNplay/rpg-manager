import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DndAttributeElement } from '../../../../../../models/element-types';

@Component({
  selector: 'app-dnd-attribute-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dnd-attribute-modal.component.html',
  styleUrls: ['./dnd-attribute-modal.component.scss']
})
export class DndAttributeModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() editingElement: DndAttributeElement | null = null;
  @Input() zone = '';
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<DndAttributeElement>>();

  formData = {
    name: '',
    value: 10,
    hasProficiency: false,
    description: ''
  };

  // Attributs prédéfinis D&D 5e
  predefinedAttributes = [
    { name: 'Force', value: 'STR' },
    { name: 'Dextérité', value: 'DEX' },
    { name: 'Constitution', value: 'CON' },
    { name: 'Intelligence', value: 'INT' },
    { name: 'Sagesse', value: 'WIS' },
    { name: 'Charisme', value: 'CHA' }
  ];

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
        value: this.editingElement.value,
        hasProficiency: this.editingElement.hasProficiency || false,
        description: this.editingElement.description || ''
      };
    } else {
      this.formData = {
        name: '',
        value: 10,
        hasProficiency: false,
        description: ''
      };
    }
  }

  selectPredefinedAttribute(attributeName: string): void {
    this.formData.name = attributeName;
  }

  getModifier(): number {
    return Math.floor((this.formData.value - 10) / 2);
  }

  getModifierString(): string {
    const modifier = this.getModifier();
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  }

  getSavingThrow(): string {
    const modifier = this.getModifier();
    const proficiencyBonus = this.formData.hasProficiency ? 2 : 0; // Simplifié
    const total = modifier + proficiencyBonus;
    return total >= 0 ? `+${total}` : `${total}`;
  }

  onSave(): void {
    if (!this.isFormValid()) return;

    const elementData: Partial<DndAttributeElement> = {
      type: 'dnd-attribute',
      name: this.formData.name.trim(),
      value: this.formData.value,
      hasProficiency: this.formData.hasProficiency,
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
           this.formData.value >= 1 && 
           this.formData.value <= 30;
  }

  get modalTitle(): string {
    return this.editingElement ? 'Modifier la caractéristique D&D' : 'Créer une caractéristique D&D';
  }
}