import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DndProficiencyBonusElement } from '../../../../../models/element-types';

@Component({
  selector: 'app-dnd-proficiency-bonus',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dnd-proficiency-bonus.component.html',
  styleUrls: ['./dnd-proficiency-bonus.component.scss']
})
export class DndProficiencyBonusComponent {
  @Input() element!: DndProficiencyBonusElement;

  getDisplayValue(): string {
    return this.element.value >= 0 ? `+${this.element.value}` : `${this.element.value}`;
  }

  getLevelFromBonus(bonus: number): number {
    // Calcul du niveau approximatif selon le bonus de maîtrise D&D 5e
    if (bonus >= 6) return 17;
    if (bonus >= 5) return 13;
    if (bonus >= 4) return 9;
    if (bonus >= 3) return 5;
    return 1;
  }

  getLevelRange(): string {
    const level = this.getLevelFromBonus(this.element.value);
    if (this.element.value >= 6) return "Niv. 17-20";
    if (this.element.value >= 5) return "Niv. 13-16";
    if (this.element.value >= 4) return "Niv. 9-12";
    if (this.element.value >= 3) return "Niv. 5-8";
    return "Niv. 1-4";
  }
}