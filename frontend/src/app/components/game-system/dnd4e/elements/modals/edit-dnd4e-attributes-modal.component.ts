import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  selector: 'app-edit-dnd4e-attributes-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-dnd4e-attributes-modal.component.html',
  styleUrl: './edit-dnd4e-attributes-modal.component.scss'
})
export class EditDnd4eAttributesModalComponent implements OnInit {
  @Input() item!: DataItem;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<DataItem>();

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
    this.loadAttributesFromItem();
    this.calculateDefenses();
  }

  /**
   * Charge les valeurs des attributs depuis l'item
   */
  private loadAttributesFromItem(): void {
    if (this.item?.metadata?.['attributes']) {
      const savedAttributes = this.item.metadata['attributes'];
      this.attributes.forEach(attr => {
        if (savedAttributes[attr.code] !== undefined) {
          attr.value = savedAttributes[attr.code];
        }
      });
    }
  }

  /**
   * Calcule le modificateur d'un attribut
   * Formule D&D 4e : (valeur - 10) / 2, arrondi à l'inférieur
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
   * Récupère un attribut par son code
   */
  getAttribute(code: string): Dnd4eAttribute | undefined {
    return this.attributes.find(a => a.code === code);
  }

  /**
   * Récupère une défense par son nom
   */
  getDefense(name: string): Dnd4eDefense | undefined {
    return this.defenses.find(d => d.name === name);
  }

  /**
   * Gère le changement de valeur d'un attribut
   */
  onAttributeChange(attr: Dnd4eAttribute): void {
    this.calculateDefenses();
  }

  /**
   * Augmente la valeur d'un attribut
   */
  incrementAttribute(attr: Dnd4eAttribute): void {
    attr.value++;
    this.onAttributeChange(attr);
  }

  /**
   * Diminue la valeur d'un attribut
   */
  decrementAttribute(attr: Dnd4eAttribute): void {
    if (attr.value > 0) {
      attr.value--;
      this.onAttributeChange(attr);
    }
  }

  /**
   * Ferme la modale sans sauvegarder
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Sauvegarde les modifications
   */
  onSave(): void {
    // Mettre à jour les métadonnées de l'item
    if (!this.item.metadata) {
      this.item.metadata = {};
    }
    if (!this.item.metadata['attributes']) {
      this.item.metadata['attributes'] = {};
    }

    this.attributes.forEach(attr => {
      this.item.metadata!['attributes'][attr.code] = attr.value;
    });

    this.save.emit(this.item);
    this.close.emit();
  }
}
