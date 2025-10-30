import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataItem } from '../../../../../models/rpg.models';

interface Dnd4eAttribute {
  code: string;
  name: string;
  value: number;
}

interface Dnd4eDefense {
  name: string;
  value: number;
  attributes: string[];
}

@Component({
  selector: 'app-dnd4e-attributes-group',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dnd4e-attributes-group.component.html',
  styleUrl: './dnd4e-attributes-group.component.scss'
})
export class Dnd4eAttributesGroupComponent implements OnInit {
  @Input() element!: DataItem;

  attributes: Dnd4eAttribute[] = [
    { code: 'FOR', name: 'Force', value: 10 },
    { code: 'DEX', name: 'Dextérité', value: 10 },
    { code: 'CON', name: 'Constitution', value: 10 },
    { code: 'INT', name: 'Intelligence', value: 10 },
    { code: 'SAG', name: 'Sagesse', value: 10 },
    { code: 'CHA', name: 'Charisme', value: 10 }
  ];

  defenses: Dnd4eDefense[] = [
    { name: 'Réflexe', value: 0, attributes: ['DEX', 'INT'] },
    { name: 'Vigueur', value: 0, attributes: ['FOR', 'CON'] },
    { name: 'Volonté', value: 0, attributes: ['SAG', 'CHA'] }
  ];

  ngOnInit(): void {
    this.loadAttributesFromElement();
    this.calculateDefenses();
  }

  /**
   * Charge les valeurs des attributs depuis l'élément
   */
  private loadAttributesFromElement(): void {
    if (this.element?.metadata?.['attributes']) {
      const savedAttributes = this.element.metadata['attributes'];
      this.attributes.forEach(attr => {
        if (savedAttributes[attr.code] !== undefined) {
          attr.value = savedAttributes[attr.code];
        }
      });
    }
  }

  /**
   * Calcule le modificateur d'un attribut
   */
  getModifier(value: number): number {
    return Math.floor((value - 10) / 2);
  }

  /**
   * Affiche le modificateur avec son signe
   */
  getModifierDisplay(value: number): string {
    const modifier = this.getModifier(value);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  }

  /**
   * Calcule les bonus aux défenses
   */
  calculateDefenses(): void {
    this.defenses.forEach(defense => {
      const modifiers = defense.attributes.map(attrCode => {
        const attr = this.attributes.find(a => a.code === attrCode);
        return attr ? this.getModifier(attr.value) : 0;
      });
      defense.value = Math.max(...modifiers);
    });
  }

  /**
   * Affiche le bonus de défense avec son signe
   */
  getDefenseDisplay(defense: Dnd4eDefense): string {
    return defense.value >= 0 ? `+${defense.value}` : `${defense.value}`;
  }

  /**
   * Récupère une défense par son nom
   */
  getDefense(name: string): Dnd4eDefense | undefined {
    return this.defenses.find(d => d.name === name);
  }
}
