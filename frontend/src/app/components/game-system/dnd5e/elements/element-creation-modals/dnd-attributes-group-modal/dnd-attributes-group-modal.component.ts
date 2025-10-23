import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DndAttributesGroupElement } from '../../../../../../models/element-types';

@Component({
  selector: 'app-dnd-attributes-group-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dnd-attributes-group-modal.component.html',
  styleUrls: ['./dnd-attributes-group-modal.component.scss']
})
export class DndAttributesGroupModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() editingElement: DndAttributesGroupElement | null = null;
  @Input() zone = '';
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<DndAttributesGroupElement>>();

  formData = {
    name: 'Attributs',
    description: 'Groupe des 6 attributs principaux (Force, Dextérité, Constitution, Intelligence, Sagesse, Charisme)',
    attributes: {
      strength: { value: 10, hasProficiency: false },
      dexterity: { value: 10, hasProficiency: false },
      constitution: { value: 10, hasProficiency: false },
      intelligence: { value: 10, hasProficiency: false },
      wisdom: { value: 10, hasProficiency: false },
      charisma: { value: 10, hasProficiency: false }
    }
  };

  attributeLabels = {
    strength: 'Force (FOR)',
    dexterity: 'Dextérité (DEX)',
    constitution: 'Constitution (CON)',
    intelligence: 'Intelligence (INT)',
    wisdom: 'Sagesse (SAG)',
    charisma: 'Charisme (CHA)'
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
        description: this.editingElement.description || '',
        attributes: { ...this.editingElement.attributes }
      };
    } else {
      this.formData = {
        name: 'Attributs',
        description: 'Groupe des 6 attributs principaux (Force, Dextérité, Constitution, Intelligence, Sagesse, Charisme)',
        attributes: {
          strength: { value: 10, hasProficiency: false },
          dexterity: { value: 10, hasProficiency: false },
          constitution: { value: 10, hasProficiency: false },
          intelligence: { value: 10, hasProficiency: false },
          wisdom: { value: 10, hasProficiency: false },
          charisma: { value: 10, hasProficiency: false }
        }
      };
    }
  }

  onSave(): void {
    const elementData: Partial<DndAttributesGroupElement> = {
      type: 'dnd-attributes-group',
      name: this.formData.name.trim(),
      description: this.formData.description.trim() || undefined,
      attributes: { ...this.formData.attributes },
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

  getAttributeKeys(): (keyof typeof this.formData.attributes)[] {
    return Object.keys(this.formData.attributes) as (keyof typeof this.formData.attributes)[];
  }

  // Méthodes de validation
  isAttributeValueValid(value: number): boolean {
    return value >= 1 && value <= 30;
  }

  isFormValid(): boolean {
    if (!this.formData.name.trim()) return false;
    
    return this.getAttributeKeys().every(key => 
      this.isAttributeValueValid(this.formData.attributes[key].value)
    );
  }

  // Calcul du modificateur pour l'aperçu
  getModifierDisplay(attributeValue: number): string {
    const modifier = Math.floor((attributeValue - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  }
}