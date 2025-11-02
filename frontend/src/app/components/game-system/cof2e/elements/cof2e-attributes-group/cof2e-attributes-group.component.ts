import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cof2eAttributesGroupElement } from '../../../../../models/element-types';

export interface Cof2eAttribute {
  code: string;
  name: string;
  value: number;
  order: number;
}

@Component({
  selector: 'app-cof2e-attributes-group',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cof2e-attributes-group.component.html',
  styleUrls: ['./cof2e-attributes-group.component.scss']
})
export class Cof2eAttributesGroupComponent implements OnInit, OnChanges {
  @Input() element!: Cof2eAttributesGroupElement;

  attributes: Cof2eAttribute[] = [];

  ngOnInit(): void {
    this.loadAttributesFromElement();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['element']) {
      this.loadAttributesFromElement();
    }
  }

  private loadAttributesFromElement(): void {
    const savedAttributes = this.element?.attributes || {};
    
    // Définition des 7 caractéristiques COF2e avec leur ordre d'affichage
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
      value: savedAttributes[def.code as keyof typeof savedAttributes] || 0,
      order: def.order
    }));
  }

  getAttributeDisplay(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
  }

  getAttributeClass(value: number): string {
    if (value >= 4) return 'very-high';
    if (value >= 2) return 'high';
    if (value >= 0) return 'normal';
    if (value >= -1) return 'low';
    return 'very-low';
  }
}
