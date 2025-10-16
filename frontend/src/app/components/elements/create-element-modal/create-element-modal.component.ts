import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataType, DashboardZone } from '../../../models/rpg.models';

export interface ElementCreationData {
  name: string;
  type: DataType;
  value: string | number;
  description?: string;
  zone: DashboardZone;
  hasProficiency?: boolean;
  proficiencyBonusValue?: number;
}

@Component({
  selector: 'app-create-element-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-element-modal.component.html',
  styleUrls: ['./create-element-modal.component.scss']
})
export class CreateElementModalComponent {
  @Input() isVisible: boolean = false;
  @Input() targetZone: DashboardZone = DashboardZone.CENTER;
  @Output() close = new EventEmitter<void>();
  @Output() elementCreated = new EventEmitter<ElementCreationData>();

  // Énumérations pour le template
  dataTypes = DataType;
  zones = DashboardZone;

  // Données du formulaire
  newElement: ElementCreationData = {
    name: '',
    type: DataType.NUMERIC,
    value: '',
    description: '',
    zone: DashboardZone.CENTER,
    hasProficiency: false,
    proficiencyBonusValue: 2
  };

  // Référence à Math pour le template
  Math = Math;

  ngOnInit() {
    this.newElement.zone = this.targetZone;
  }

  onClose() {
    this.resetForm();
    this.close.emit();
  }

  onCreateElement() {
    if (this.newElement.name.trim()) {
      // Convertir la valeur selon le type
      let processedValue: string | number = this.newElement.value;
      if (this.newElement.type === DataType.NUMERIC || this.newElement.type === DataType.ATTRIBUTE) {
        processedValue = Number(this.newElement.value) || 0;
      }

      const elementData: ElementCreationData = {
        ...this.newElement,
        name: this.newElement.name.trim(),
        value: processedValue
      };

      this.elementCreated.emit(elementData);
      this.resetForm();
    }
  }

  private resetForm() {
    this.newElement = {
      name: '',
      type: DataType.NUMERIC,
      value: '',
      description: '',
      zone: this.targetZone,
      hasProficiency: false,
      proficiencyBonusValue: 2
    };
  }

  getDataTypeLabel(type: DataType): string {
    switch (type) {
      case DataType.NUMERIC:
        return 'Numérique';
      case DataType.TEXT:
        return 'Texte';
      case DataType.ATTRIBUTE:
        return 'Attribut (D&D)';
      case DataType.PROFICIENCY_BONUS:
        return 'Bonus de maîtrise';
      default:
        return 'Inconnu';
    }
  }

  getZoneLabel(zone: DashboardZone): string {
    switch (zone) {
      case DashboardZone.TOP:
        return 'Zone Haute';
      case DashboardZone.LEFT:
        return 'Zone Gauche';
      case DashboardZone.CENTER:
        return 'Zone Centre';
      case DashboardZone.RIGHT:
        return 'Zone Droite';
      case DashboardZone.BOTTOM:
        return 'Zone Basse';
      default:
        return 'Inconnu';
    }
  }

  isAttributeType(): boolean {
    return this.newElement.type === DataType.ATTRIBUTE;
  }

  isProficiencyBonusType(): boolean {
    return this.newElement.type === DataType.PROFICIENCY_BONUS;
  }

  getAvailableDataTypes(): Array<{value: DataType, label: string}> {
    return Object.values(DataType).map(type => ({
      value: type,
      label: this.getDataTypeLabel(type)
    }));
  }

  getAvailableZones(): Array<{value: DashboardZone, label: string}> {
    return Object.values(DashboardZone).map(zone => ({
      value: zone,
      label: this.getZoneLabel(zone)
    }));
  }

  // Méthodes pour les calculs d'attributs
  calculateModifier(value: number): number {
    return Math.floor((value - 10) / 2);
  }

  calculateSavingThrow(attributeValue: number, proficiencyBonus: number): number {
    return this.calculateModifier(attributeValue) + proficiencyBonus;
  }

  getModifierDisplay(): string {
    const value = Number(this.newElement.value) || 0;
    const modifier = this.calculateModifier(value);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  }

  getSavingThrowDisplay(): string {
    const value = Number(this.newElement.value) || 0;
    const proficiencyBonus = Number(this.newElement.proficiencyBonusValue) || 2;
    const savingThrow = this.calculateSavingThrow(value, proficiencyBonus);
    return savingThrow >= 0 ? `+${savingThrow}` : `${savingThrow}`;
  }
}