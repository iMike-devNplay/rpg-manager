import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardZone, DataItem, DataType } from '../../../../../models/rpg.models';

export interface ElementCreationData {
  id?: string; // Pour l'édition
  name: string;
  type: DataType;
  value: string | number;
  description?: string;
  zone: DashboardZone;
  hasProficiency?: boolean;
  proficiencyBonusValue?: number;
  allowQuickModification?: boolean;
}

@Component({
  selector: 'app-create-element-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-element-modal.component.html',
  styleUrls: ['./create-element-modal.component.scss']
})
export class CreateElementModalComponent implements OnInit, OnChanges {
  @Input() isVisible: boolean = false;
  @Input() targetZone: DashboardZone = DashboardZone.CENTER;
  @Input() editingItem: DataItem | null = null;
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
    proficiencyBonusValue: 2,
    allowQuickModification: false
  };

  // Référence à Math pour le template
  Math = Math;

  ngOnInit() {
    this.newElement.zone = this.targetZone;
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['editingItem'] || changes['isVisible']) {
      this.initializeForm();
    }
  }

  private initializeForm() {
    if (this.editingItem) {
      // Mode édition : pré-remplir avec les données existantes
      this.newElement = {
        name: this.editingItem.name,
        type: this.editingItem.type,
        value: this.editingItem.value,
        description: this.editingItem.description || '',
        zone: this.editingItem.zone || DashboardZone.CENTER, // Fournir une valeur par défaut
        hasProficiency: this.editingItem.hasProficiency || false,
        proficiencyBonusValue: 2, // Sera récupéré automatiquement
        allowQuickModification: this.editingItem.allowQuickModification !== false
      };
    } else {
      // Mode création : valeurs par défaut
      this.resetForm();
    }
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

      // Ajouter l'ID si on est en mode édition
      if (this.editingItem) {
        elementData.id = this.editingItem.id;
      }

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
      proficiencyBonusValue: 2,
      allowQuickModification: false
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

  isNumericType(): boolean {
    return this.newElement.type === DataType.NUMERIC;
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