import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataItem } from '../../../../../../models/rpg.models';

export interface Cof2eAttribute {
  code: string;
  name: string;
  value: number;
  order: number;
}

@Component({
  selector: 'app-edit-cof2e-attributes-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-cof2e-attributes-modal.component.html',
  styleUrls: ['./edit-cof2e-attributes-modal.component.scss']
})
export class EditCof2eAttributesModalComponent implements OnInit {
  @Input() item!: DataItem;
  @Output() save = new EventEmitter<DataItem>();
  @Output() close = new EventEmitter<void>();

  attributes: Cof2eAttribute[] = [];

  ngOnInit(): void {
    this.loadAttributesFromItem();
  }

  private loadAttributesFromItem(): void {
    const savedAttributes = this.item.metadata?.['attributes'] || {};
    
    // Définition des 7 caractéristiques COF2e
    const attributeDefinitions = [
      { code: 'FOR', name: 'Force', order: 1 },
      { code: 'AGI', name: 'Agilité', order: 2 },
      { code: 'CON', name: 'Constitution', order: 3 },
      { code: 'PER', name: 'Perception', order: 4 },
      { code: 'INT', name: 'Intelligence', order: 5 },
      { code: 'CHA', name: 'Charisme', order: 6 },
      { code: 'VOL', name: 'Volonté', order: 7 }
    ];

    this.attributes = attributeDefinitions.map(def => ({
      code: def.code,
      name: def.name,
      value: savedAttributes[def.code] || 0,
      order: def.order
    }));
  }

  increment(attr: Cof2eAttribute): void {
    if (attr.value < 5) {
      attr.value++;
    }
  }

  decrement(attr: Cof2eAttribute): void {
    if (attr.value > -2) {
      attr.value--;
    }
  }

  getDisplayValue(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
  }

  onSave(): void {
    // Construire l'objet attributes
    const attributesData: any = {};
    this.attributes.forEach(attr => {
      attributesData[attr.code] = attr.value;
    });

    // Mettre à jour les métadonnées
    const updatedItem = {
      ...this.item,
      metadata: {
        ...this.item.metadata,
        attributes: attributesData
      }
    };

    this.save.emit(updatedItem);
  }

  onClose(): void {
    this.close.emit();
  }
}
